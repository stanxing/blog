# journalbeat 性能测试

## 测试准备

- logs-mocker 服务，快速产生日志并由 docker driver 写入到 journald，产生的日志基本是没有差别的，单条日志大小在 1132 字节左右。

```shell
# 详情参考 logs-mocker 文件夹
docker run -d --env "TOTAL=2000000" nodejs-logs-mocker:latest
```

```js
function outputAccessLog(count) {
    let access = `{
        "type" : "access",
        "method" : "GET",
        "url" : "/mocker",
        "remoteAddr" : "127.0.0.1",
        "responseStatus" : 200,
        "responseTime" : 0.01,
        "upstreamResponseTime" : 0.01,
        "timeUnit" : "s",
        "referr" : "http//referrr",
        "userAgent" : "agent",
        "body": "1",
        "responseBodySize" : ${count},
        "reqId": "reqId"
    }`
    console.log(format(access))
}

function format(str) {
    str = str.replace(/\ +/g, "")
    str = str.replace(/[ ]/g, "")
    return str.replace(/[\r\n]/g, "")
}

function start() {
    var total = process.env.TOTAL || 1000000
    var count = 0;
    const startTime = new Date().getTime();
    while (true) {
        outputAccessLog(count);
        count ++;
        if (count > total) {
            break;
        }
    }
    const endTime = new Date().getTime();
    console.log('time: ', startTime, endTime);
    console.log('interval:', endTime - startTime, 'ms');
    console.log('count:', count);
}

start();
```

- [journalbeat](https://github.com/mheese/journalbeat)，读取 journald 的日志并输出到后端 （文件，console等），后续称其为 journalbeat-mheese。

- ~~elastic 官方 [journalbeat](https://github.com/elastic/beats/blob/master/journalbeat)，因此把它也作为一个备选方案，测试下性能，后续称其为 journalbeat-elastic。~~, 由于发现了 https://github.com/elastic/beats/issues/9533 这个bug，在 linux systemd 版本 < 233 的机器上，当 journald rotate 日志后会停止收集，暂时不测试了。

### 测试机器

- 本机：4Core 8G, Intel(R) Core(TM) i5-4590 CPU @ 3.30GHz

- 阿里云ECS：8Core 32G, Intel(R) Xeon(R) Platinum 8163 CPU @ 2.50GHz

#### 场景1 （单独测试 journald 的写入速度）

journald 的写入速度没有监控的 metrics，但通过几轮测试发现，基本上标准输出结束的时间跟 journald 写入完成的时间的相同的（依据来源于观察到当 docker 容器的标准输出日志打印完成后，journald 的 cpu 使用率也刚好为0）。所以，测试方法为 `docker inspect ${containerId}` 去查看容器启动和终止的时间差。

本机结果：

- 向 journald 写入 100w 条日志，时间花费 60 秒, cpu 稳定在 90% - 99%，写入速度在 16666 条 /s。
- 向 journald 写入 200w 条日志，时间花费 129 秒, cpu 稳定在 90% - 99%，写入速度在 15503 条 /s。

从时间来看，journald 的写入速度还是比较稳定的。

阿里云结果：

- 向 journald 写入 100w 条日志，时间花费 100秒, cpu 稳定在 90% - 99%, 写入速度在 10000 条 /s。
- 向 journald 写入 200w 条日志，时间花费 210 秒, cpu 稳定在 90% - 99%, 写入速度在 9523 条 /s。

在写入过程中，journald 的 cpu 一直是 90%-99%，基本上达到极限了（systemd-journald 服务应该是 cpu 最大使用一个核，测试这么久没发现超过 100% 的）。写入速度在 10000 条/s。相比本机有差距的原因应该是单核的性能问题，本机的主频更大一些。

#### 场景2（单独测试 journalbeat 的读取速度）

logs-mocker 先写 200w 日志，待写入到 journald 之后，再启动 journalbeat 去收集。

本机结果：

- journalbeat cpu 稳定在 190% - 207%， 30s 输出 41w 条 events, 13666 条/s，14.8MB/s; 同时 systemd-journald 的 cpu 基本稳定在 0%。(从 journald 读取日志不耗 cpu？)

阿里云结果：

- journalbeat cpu 稳定在 260% - 270%， 30s 输出 49w 条，16333 条/s，17.6MB/s；同时 systemd-journald 的 cpu 基本稳定在 0%。

journalbeat 可以用到接近 3个核心。不限 cpu 的情况下，多核心还是有优势的。

#### 场景3（测试同时读写）

logs-mocker 写 200w 日志，同时 journalbeat 读日志。

本机结果：

- journalbeat cpu 稳定在 140% - 155%， 30s 输出 32w 条, 10666 条/s，9.7MB/s; 同时 systemd-journald 的 cpu 基本稳定在 90%-99%。
- 容器一共运行了 138 秒。大致算出 journald 写入速度为 14492 条 /s。

阿里云结果：

- journalbeat cpu 稳定在 165% - 185%， 30s 输出 29w 条, 9600 条/s，单条日志 1132 字节，9.7MB/s; 同时 systemd-journald 的 cpu 基本稳定在 97-99%。
- 容器一共运行了 227 秒。大致算出 journald 写入速度为 8810 条 /s。

#### 场景4（测试写入到 console 的速度）

本机结果：

- 边读边写时，journalbeat cpu 稳定在 110% - 120%， 30s 输出 18w 条 events, 6000 条/s，同时 systemd-journald 的 cpu 基本稳定在 40%-50%，cpu 没有使用很多，应该是IO慢导致的，（按理说写到标准输出应该更快才对，毕竟相当与写入内存？）
- 先写再读时，journalbeat cpu 稳定在 160% - 170%， 30s 输出 30w 条 events, 10000 条/s，同时 systemd-journald 的 cpu 基本稳定在 0%。

两种测试看起来写入 console 的速度相对而言都不理想。
