# 数据降采样

降采样就是通过聚合等手段将时间窗口较小的高精度的数据转换成时间窗口较大的低精度的数据的过程。通过降采样，牺牲一点精度，依旧可以保留曲线的形状，减少存储压力。

监控数据的采集频率一般是相对较短的，比如 10s，因此每天会产生大量的数据，但是这些数据在保留一定时间后，它的实时性就没那么高了，长时间存储这些高精度的数据对存储会是很大的压力。一个很自然的方式就是对数据进行采样，对高精度的数据存较短的时间，对于低精度的数据可以保存的更久一些甚至是永久。

## inlfuxdata 架构下实现降采样的两种方式

以一个例子来介绍降采样的场景：

假设我们以每 10s 写入一个数据点来追踪餐厅通过电话和网站订购外卖的订单数量。我们把数据存在 `food_data` 数据库中，其 measurment 为 `orders`， fields 分别是 `phone` 和 `website`。就像下面这样：

```bash
name: orders
------------
time                           phone     website
2016-05-10T23:18:00Z     10        30
2016-05-10T23:18:10Z     12        39
2016-05-10T23:18:20Z     11        56
```

假设在长时间的运行中，我们只关心 30 分钟内通过通过收集和网站订购的平均数量，我们要对上面的数据实现以下几点要求：

- 自动将 10s 间隔的数据聚合成 30 分钟间隔的数据
- 自动删除两个小时以上的原始 10s 间隔的数据
- 自动删除超过 90 天的 30分钟间隔的数据

###　准备工作

- 创建数据库和 retention policy

```bash
# 创建数据库时，InfluxDB会自动生成一个叫做 autogen 的 RP，并作为数据库的默认 RP，autogen 这个 RP 会永远保留数据。在输入上面的命令之后，two_hours 会取代 autogen 作为food_data 的默认 RP。
CREATE DATABASE "food_data"
CREATE RETENTION POLICY "two_hours" ON "food_data" DURATION 2h REPLICATION 1 DEFAULT
# 创建一个保留 90d 数据的 RP
CREATE RETENTION POLICY "90_days" ON "food_data" DURATION 90d REPLICATION 1
```

### Continuous Query + Retention Poilcy

创建 CQ：

```bash
CREATE CONTINUOUS QUERY "cq_30m" ON "food_data" BEGIN
  SELECT mean("website") AS "mean_website",mean("phone") AS "mean_phone"
  INTO "90_days"."downsampled_orders"
  FROM "orders"
  GROUP BY time(30m)
END
```

上面创建了一个 cq 叫做 `ca_30m` 作用于 `food_data` 上。这个 CQ 告诉 influxdb 每隔 30分钟计算一次，从 `orders` 表中 group by 30 分钟的数据，计算 `phone` 和 `website` 的平均值，并将记录写入 `90_days.downsampled_orders` 表中，该表的 retention policy 是 90 天。注意某个表使用的不是默认的 retention policy，就需要在表名前显式的指定。

最后的结果如下：

```bash
> SELECT * FROM "orders" LIMIT 5
name: orders
---------
time                            phone  website
2016-05-13T23:00:00Z      10     30
2016-05-13T23:00:10Z      12     39
2016-05-13T23:00:20Z      11     56
2016-05-13T23:00:30Z      8      34
2016-05-13T23:00:40Z      17     32

> SELECT * FROM "90_days"."downsampled_orders" LIMIT 5
name: downsampled_orders
---------------------
time                            mean_phone  mean_website
2016-05-13T15:00:00Z      12          23
2016-05-13T15:30:00Z      13          32
2016-05-13T16:00:00Z      19          21
2016-05-13T16:30:00Z      3           26
2016-05-13T17:00:00Z      4           23
```

### 使用 kapacitor

使用 batch 模式：

```javaScript
batch
    |query(
        ```
        SELECT mean("website") AS "mean_website", mean("phone") AS "mean_phone" FROM "food_data"."two_hours"."orders"
        ```
    )
        .period(30m)
        .every(30m)
    |influxDBOut()
        .database('90_days')
        .retentionPolicy('downsampling_orders')
```

使用 stream 模式，这里需要注意，tick 脚本的 mean Node 无法处理多个字段，所以要分离出两个 stream 单独处理，再通过 join 将两个流连接，参考[kapacitor-stream-processing-multiple-fields](https://community.influxdata.com/t/kapacitor-stream-processing-multiple-fields/3240/11)：

```javaScript
var data = stream
    |from()
        .measurement('orders')
    |window()
        .period(30m)
        .every(30m)
var mean_website = data
    |mean('website')
        .as('mean_website')
var mean_phone = data
    |mean('phone')
        .as('mean_phone')
mean_website
    |join(mean_phone)
    |influxDBOut()
        .database('90_days')
        .retentionPolicy('downsampling_orders')
```

## 参考

- [downsampling_and_retention](https://jasper-zhang1.gitbooks.io/influxdb/content/Guide/downsampling_and_retention.html)
- [downsampling your data](https://www.youtube.com/watch?v=j3x0TohyGJY)