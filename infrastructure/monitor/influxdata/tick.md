# 基于 Tick 脚本的报警设计

## 链操作符

- `|`：表示声明了一个链接方法（chaining method），会创建一个对应 node 的实例，并且使其跟它上面的 node 相连接。

- `.`：表示声明了一个属性方法调用，用来设置一个 node 内部属性的值。

- `@`：声明一个用户定义的函数（UDF）调用，本质上是将新的 UDF 节点添加到管道的链接方法。

## 单双引号

- 声明一个字符串请使用单引号。
- 为了在 lambda 表达式中访问一个 tag 或者 filed 的值需要使用双引号来引用 tag 或者 field 名称。

请看下面一个例子来体会引号该怎么用：

```javaScript
   // Data frame
  var data = stream
     |from()
        .database('telegraf')
        .retentionPolicy('autogen')
        .measurement('cpu')
        .groupBy('host')
        .where(lambda: "cpu" == 'cpu-total')
     |eval(lambda: 100.0 - "usage_idle")
        .as('used')
   ...
```

在 `where` 方法中，里面传入一个 lambda 表达式，表达的是比较 tag 字段 "cpu" 的值是否等于字符串 `cpu-total`, 根据规则，这里的 `cpu` 需要使用双引号。对于链方法 `eval` 也是相同的逻辑，所以 `usage_idle` 也需要使用双引号。需要注意的是，`groupBy` 里面也是一个 tag 字段名称，但是使用的是单引号，这里就是想表达的是字符串的意思，对该字段做 groupBy，所以用单引号是对的。

再看下面一个例子：

```javaScript
|alert()
  .id('{{ index .Tags "host"}}/mem_used')
  .message('{{ .ID }}:{{ index .Fields "stat" }}')
```

这是一个 alert node，里面的 id 和 message 属性方法中使用了字符串模板的语法。`index .Tags "host"` 表示索引 tag 字段 "host" 的值填充到字符串模板中，所以这里 `host` 也需要双引号。id 方法设置的值会在 message 方法中以 .ID 的方式被引用。

## Tick Node

- `eval`：支持传入多个 lambda 表达式对 data point 做转换，并将转换后的结果用 `As` 方法设置名称，默认情况下，eval 只会保留 `As` 设置的新字段，其余字段都将被丢弃，如果还希望保留原始的字段，请使用 `keep`，不管是否设置 `keep`，所有的 tag 字段都会被保留。
- `mean`：对 window 中的数据做聚合，求出过去一分钟内 cpu used 的平均值。
- `derivative`：计算导数，计算公式为：（current-previous）/（time_difference/unit）, 通过 `unit` 方法来设置时间单位
- `stateCount`：传入一个 lambda 表达式，对连续满足表达式的状态进行计数。注意**连续**二字，如果连续的 window 聚合的结果满足表达式，该 node 会将计数结果累加，如果中途某个结果不满足，计数结果将会被重置。
- `stats`：该节点传入一个时间，用来统计在一个给定时间间隔内 data point 的数量，使用 `align` 方法可以将给定的时间间隔对齐。比如给定一分钟，就是从 0s 到 60s。返回的结果字段名叫 `emitted`，可以在下个节点中使用。
- `difference`：计算传入的字段对应的值与上次的差值，返回的字段名叫 `difference`。
- `alert`：报警 node，其 `.message` 方法用于定义报警信息，`.crit` 方法表明报警的条件，`.critReset` 表明报警恢复的条件，`.stateChangesOnly` 传入一个时间，表示在该时间内仅仅发送状态不同的时间，`.post` 表明报警发送的地址，接收一个 http 协议。

## 报警分类

### host 报警

默认由 telegraf 提供的能力：

- cpu
- disk
- diskio
- load
- memory
- net
- netstat

需要自己写插件的：

- kernel

下面是一个 cpu 报警的 case，正好用来分析如何实现一个 tick 脚本来做报警：

```javaScript
var cpu = stream
  |from()
    .measurement('cpu')

cpu
  |where(lambda: "cpu" == 'cpu-total')
  |eval(lambda: 100.0 - "usage_idle")
    .as('used')
  |groupBy('host')
  |window()
    .period(1m)
    .every(1m)
    .align()
  |mean('used')
  |stateCount(lambda: "mean" > 90)
    .as('state_count_critical')
  |stateCount(lambda: "mean" < 90)
    .as('state_count_ok')
  |alert()
    .message('{{ index .Tags "host"}} alert')
    .crit(lambda: "state_count_critical" >= 5)
    .critReset(lambda: "state_count_ok" >= 30)
    .stateChangesOnly(24h)
    .post('http://monitor.example.com/alerts')
    // 这里可以定义任何接收报警的渠道，比如 email 等等。
```

上面的 tick 脚本的含义就是，每分钟聚合一次数据点，求出 `cpu used` 的平均值，判断该值是否大于 90（百分比），如果连续 5 此大于 90，则 post critical 级别的报警，如果连续 30 次小于 90，则重置 critical报警（会 post 恢复的报警）。

### log 报警

- access 日志：
    - 应用错误：针对 5xx 和 4xx 报警，按照 service 名称做 groupBy，每分钟 5xx 数量大于 100 即报警
    - 慢响应：针对 200 报警，按照 service 名称做 groupBy，每分钟日志响应时间大于 1 秒的数量大于 100 即报警
- accessOut 日志：同上
- service 日志：针对 error 级别报警，按照 service 和 category 做 groupBy，每分钟 error 日志数量大于 100 即报警
- slowquery 日志：按照 database 和 collection 做 groupBy，每分钟 slowquery 数量大于 20 条即报警

一个 service access 报警的例子：

```javaScript
var service string
var measurement = service + '.access'

var access =  stream
  |from()
    .measurement(measurement)

var access1m = access
  |from()
    .measurement(measurement)
  |default()
    .tag('service', service)
  // use eval node to delete all fields except 'responseTime'
  |eval(lambda: "responseTime")
    .as('responseTime')
  |groupBy('service')
  |window()
    .period(1m)
    .every(1m)
    .align()

var slowResponse = access1m
  |where(lambda: "responseTime" > 1000.0)
  |count('responseTime')

access
  |where(lambda: "responseStatus" =~ /^5.*/)
  |groupBy('host', '@namespace')
  |stats(1m)
  |difference('emitted')
  |stateCount(lambda: "difference" < 50)
    .as('state_count_ok')
  |alert()
    .message('{"name":"5xx","priority":"P1"}')
    .crit(lambda: "difference" > 100)
    .critReset(lambda: "state_count_ok" >= 30)
    .stateChangesOnly(1h)
    .post('http://monitor.example.com/alerts')

access
  |where(lambda: "responseStatus" =~ /^4.*/)
  |groupBy('host', '@namespace')
  |stats(1m)
  |difference('emitted')
  |stateCount(lambda: "difference" < 2500)
    .as('state_count_ok')
  |alert()
    .message('{"name":"4xx","priority":"P3"}')
    .crit(lambda: "difference" > 5000)
    .critReset(lambda: "state_count_ok" >= 30)
    .stateChangesOnly(1h)
    .post('http://monitor.example.com/alerts')

slowResponse
  |stateCount(lambda: "count" < 500)
    .as('state_count_ok')
  |alert()
    .message('{"name":"slowResponse","priority":"P1"}')
    .crit(lambda: "count" > 1000)
    .critReset(lambda: "state_count_ok" >= 30)
    .stateChangesOnly(1h)
    .post('http://monitor.example.com/alerts')

```

### k8s 报警

- pod：针对 pod 状态做报警，根据状态不同，设置不同的报警条件。
    - pod 状态为 pending 超过 5 分钟，说明可能 clusterautoscaler 出问题了，或者拉镜像很慢或者出问题了，需要干预。
    - pod 状态为 failed，直接报警，需要干预。
    - pod 状态为 running 但是 ready 字段为 false，说明 pod 长时间出于 notReady 状态，可能是健康检查出问题了，需要干预。
- node：
    - node 状态为 notReady，需要干预。
- certificate：
    - kubelet 证书过期
    - apiserver 证书过期
    - ca 证书过期
- clusterautoscaler：
    - ca 机器数量达到了最大值需要报警，因为再有新的 pod 创建可能导致无法新加机器，甚至需要排查当前 ca 机器满的原因，是否出现了什么 bug。
    - ca 机器连续一段时间不被释放需要报警，一直不被释放说明集群资源可能确实不够用了，应该加固定的机器而不是一直使用 ca。
- hpa：
    - 某个服务的 hpa 达到最大值并且一直保持了一段时间需要报警，可能是因为当前流量较高，需要注意。

### 其他分类报警

- 数据库
- 消息队列
- 域名
- 等等
- 站点可用性报警

## 参考

- [Kapacitor Node](https://docs.influxdata.com/kapacitor/v1.5/nodes)
- [Kapacitor Tick Examples](https://github.com/influxdata/kapacitor/tree/master/examples/telegraf)
