# Logstash 性能优化

## 背景

[Logstash](https://www.elastic.co/cn/logstash) 是 elastic 公司开源的实时数据收集引擎，能够动态的收集日志数据并对其内容进行转换和解析，并输出到特定的目的地。Logstash 是著名的开源日志收集分析解决方案 ELK 架构中负责日志收集和处理的部分。

[Journalbeat](https://github.com/mheese/journalbeat) 是一个开源项目，其利用了 elastic 公司提供的 [libbeat](https://www.elastic.co/cn/beats) 框架（一个轻量级的数据采集器框架），实现了将 jounald 中的日志发送到对应的后端，包括 Logstash 等。

我司 K8S 集群的日志解决方案使用了类似 ELK 的架构：使用 Journalbeat 作为日志采集器，将机器上的源日志数据发送到 Logstash 后端，Logstash 作为日志处理引擎，对日志进行解析处理，生成符合日志规范的格式发送给阿里云日志服务 SLS 和 InfluxDB，分别用来对日志进行存储和查询，以及基于 InfluxDB 对日志做监控报警。

随着业务的发展，日志量越来越大，日志延迟的现象也频频发生，研发经常抱怨一个服务执行后往往在半个小时甚至更久才能在日志查询平台中看到日志，严重影响了研发的效率。本文正是基于此问题记录了在 K8S 平台下为日志收集性能的优化所做的努力，经过优化后，之前的单个 Logstash pod（2 个 CPU 3G 内存） 的日志处理速率从 600 events/s 提高到 4000 events/s。

## 优化思路

### 监控先行

横跨多个组件的性能优化是非常困难的事情，难点就在于整个收集过程是串行的，要判断出瓶颈来自哪个组件，就要一个组件一个组件的来分析，还要能够从宏观上保证单一组件的优化对整体性能产生的影响是可以量化的。比如我们上面横跨 Jounalbeat、Logstash、阿里云日志服务、InfluxDB 这么多组件，每个组件处理效率慢的话，都可能导致日志的延迟。而且优化了某个组件后，要能真实看到反应在日志收集速率上的提升。所以，优化的时候首先能够搭建出一套量收集速率的监控，这样可以极大的方便我们排查性能问题。下面是我们的监控搭建思路：

- Journalbeat：Journalbeat 配置中默认会 30s 输出一次 metric，记录了过去 30s 发送了多少条日志，多少字节数等等信息。但是这个数据尚未提供好的 API 供监控使用，需要修改一些内部的源码以支持 API 的方式暴露，方便我们做监控数据埋点，在 garafana 中画出发送速率的曲线。不过最新的官方 Jounalbeat 版本已经支持了 API，还有大幅度的性能优化，我们当时由于该项目存在 [bug1：Journald rotation 的时候会导致 Journalbeat 停止写入](https://github.com/elastic/beats/issues/9533) 和 [bug2：重复发送日志](https://github.com/elastic/beats/issues/11505) 的原因没有采用，现在应该均已修复（未测试）。

- Logstash：Logstash 是重点要监控的，因为在整个收集链路中，Logstash 由于要做大量的数据处理逻辑，是最耗费 CPU 的地方，也最有可能成为瓶颈。好在 Logstash 主动提供了监控的 API 供性能分析，详情请参考[这里](https://www.elastic.co/guide/en/logstash/current/node-stats-api.html#pipeline-stats)。但是 Logstash 貌似并没有详细的文档介绍这些 metric，这里我选几个重点的 metric 介绍：

    - [jvm](https://www.elastic.co/guide/en/logstash/current/node-stats-api.html#jvm-stats)：需要监控 CPU 使用率和堆内存的使用率，以及 GC 的使用情况。

    - [events](https://www.elastic.co/guide/en/logstash/current/node-stats-api.html#event-stats)：该 metric 非常重要，`in`，`filtered`，`out` 分别展示了当前 Logstash 在不同的阶段分别处理了多少数据。`duration_in_millis` 是指 Logstash worker 线程从 queue 中拿到一批输入数据开始到处理并输出到指定后端后这一过程的总耗时。所以根据这个参数即可计算速率 `v（events/s） = out / duration_in_millis * 1000`。指的注意的是，根据[该讨论](https://discuss.elastic.co/t/duration-in-millis-shows-too-high-values/108563) 的描述，Logstash 同时会有多个 worker 并行处理，所以该时间是所有批处理耗时的和，并不会直接和时钟时间相关联。`queue_push_duration_in_millis` 参数的含义请参考[这个讨论](https://discuss.elastic.co/t/-node-stats-duration-in-millis-vs-queue-push-duration-in-millis/90000)，是指写入到 Logstash queue 中所等待的时间总和。如果该值很大，远大于 `duration_in_millis`，说明 Logstash 的输入插件速率很快，而 filter/output 的处理很慢，导致等待时间非常的长，这时候要重点注意优化后面两个插件。

        ```js
        "events" : {
            "in" : 293658,
            "filtered" : 293658,
            "out" : 293658,
            "duration_in_millis" : 2324391,
            "queue_push_duration_in_millis" : 343816
        }
        ```

    - [pipelines](https://www.elastic.co/guide/en/logstash/current/node-stats-api.html#pipeline-stats)：该 API 的返回结果中对监控数据精细化到了每个插件的耗时，参考如下的例子。其参数含义与上面的介绍相同，所以我们可以很轻松的算出每个插件在处理一个 event 的耗时。

        ```js
        "plugins": {
            "inputs": [
                {
                    "id": "beats",
                    "events": {
                    "out": 1188268,
                    "queue_push_duration_in_millis": 46097
                    },
                    "current_connections": 26,
                    "name": "beats",
                    "peak_connections": 26
                }
            ],
            "filters": [
                {
                    "id": "set_@metadata_service_field_from_comm",
                    "events": {
                    "duration_in_millis": 13925,
                    "in": 1188267,
                    "out": 1188267
                    },
                    "name": "mutate"
                },
            ...
            ],
            "outputs": [
                {
                    "id": "logservice",
                    "events": {
                    "duration_in_millis": 160058,
                    "in": 1101868,
                    "out": 1101189
                    },
                    "name": "logservice"
                }
            ],
        }
        ```

    - [hot threads](https://www.elastic.co/guide/en/logstash/current/hot-threads-api.html)：该 API 中会返回当前 Logstash 中的繁忙线程。
    - 其他返回的 metric 都可作为参考来辅助性能分析，请参考文档介绍。

- 阿里云日志服务 SLS：日志最终是否延迟都是体现在能不能从该服务中查到的，所以阿里云日志的写入速度也应该能监控起来。由于阿里云日志服务本身没有暴露任何 metric 出来，我们选择一个取巧的方式，那就是每隔 60s 计算一次日志的增量（比如从 0 点开始到 60s 前和 60s 后分别计算结果求差值）。这样也可以大致来判断阿里云的写入速率是否出现了瓶颈。

接下来就是通过编码实现将整套完整的监控体系搭建起来，这样就可以轻松的从图表中发现日志收集速率的变化，判断性能问题的原因。

### 控制变量

根据我们的测试结果，Journalbeat 单核心日志采集速率在 10000 左右还是可以做到的，而且我们 Logstash 的处理速率大概只有不到 1000。所以优化重点放在了 Logstash 上，在测试 Logstash 的时候，只要保持其他组件的配置不变即可，注意多次测试，避免太大的误差。

### Logstash 优化要点

- 选择合适的 Logstash 版本，Logstash 版本在迭代过程中包含了大量的性能优化，要多关注下 change log，选择更新的版本可能会有事半功倍的效果。

- 确保 GC 不是 Logsatsh CPU 高的原因，Logstash 在处理数据时会消耗大量 CPU，要关注 Logstash JVM 相关的监控图标以及 Hot Threads，判断当前 CPU 是否都用在了该用的地方，如果频繁 GC，请调整 JVM 及内存相关参数再测试。

- 当前确定前两个要点后，前期优化重点还是要放在 filter 插件中日志业务逻辑的处理上，这是最容易的产生瓶颈的：
    - 首先要保证给每个 filter 插件都携带一个可读的 id，比如 `set_@metadata_field_from_comm`，方便能够快速定位到具体的插件代码上，默认是一个随机字符串，完全不可读，更不用说找到对应的逻辑了。
    - 根据监控返回的插件处理事件的耗时来分析哪些插件需要优化，下面是我自己写的一个依据监控 API 来分析 filter 插件耗时的脚本。如果发现某个插件耗时很长，就要想办法看能不能优化它，降低它的执行耗时：

        ```python
        for filter in filters:
            if 'events' not in filter.keys():
                continue
            id = filter['id']
            inEvents = filter['events']['in']
            cost = filter['events']['duration_in_millis']
            if inEvents == 0 or cost == 0:
                continue
            ratePerMillis = round(inEvents / cost, 2)
            ratePerEvent = round(cost / inEvents, 4)
            filterCost = collections.OrderedDict()
            filterCost['id'] = id
            filterCost['in'] = inEvents
            filterCost['duration_in_millis'] = cost
            filterCost['percentage'] = str(round(cost / eventsMillis, 2) * 100) + '%'
            filterCost['events/ms'] = ratePerMillis
            filterCost['ms/event'] = ratePerEvent
            filtersCost.append(filterCost)
        ```

    - 一般来说 filter 中可能存在性能问题的地方：
        - 不够严格的正则匹配，正则尽量要能匹配到开头和结尾，以便不满足条件的快速匹配失败，可以极大提高性能。请参考[killing-your-logstash-performance-with-grok](https://medium.com/@momchil.dev/killing-your-logstash-performance-with-grok-f5f23ae47956)。
        - 日志脱敏逻辑，一般都要递归的比较每个字段，集中处理可能会带来比较大的性能问题，可以考虑在查询的时候做脱敏，分散脱敏压力。
        - 将一些公共的逻辑尽量提前，不要在每个地方做一遍。

- 调整[pipeline.workers 和 pipeline.batch.size](https://www.elastic.co/guide/en/logstash/6.7/tuning-logstash.html) 的大小，Logstash 内存中的 events 数量等于 `workers * batchSize`。如果发现 CPU 未饱和，说明可能由于在等待 output 磁盘 IO 的返回，每个线程会等待数据写入完成后才去拿下一批日志，所以增大 batch size 和 workers 数量有助于提高并行处理的效率，当然这会导致在内存中的日志数量增加，需要注意内存使用率是否合理。要根据测试结果选择合理的值，太大的 workers 数量反而会导致性能下降。

- 调整 Logstash output 插件中的写入参数，重点有以下几个：
    - `flush_size`：表示缓存的一批数据量到达多少时写入后端存储，设置一个合适的值可以最大化的在写入和处理达到一个平衡。
    - `max_retries`：当写入失败的时候的最大重试次数，太多的重试会导致 Logstash 阻塞一直等待达到相应的重试次数，在同一批数据写入多个 output 之间是同步的，假设 InfluxDB 挂了，重试次数设置的又很高，直接会导致写入另一个后端也阻塞非常长的时间。

以上就是我在调优 Logstash 性能时总结的一些经验，希望能给后来的读者带来一些启发。
