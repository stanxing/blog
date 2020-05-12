# journald

ubuntu 16.04+ 版本采用了 systemd 管理作为系统初始化软件，它是一系列工具的集合，其中系统日志管理模块使用的是 `systemd-journald` 服务。由于工作中的系统基础架构的日志收集这一块功能使用了 journald 服务，这篇文章记录下对该服务的介绍和踩过的坑。

## journald 介绍

- journald 是启动在机器中的一个 daemon 进程，这个服务设计的初衷是为了克服现有 syslog 服务的日志内容容器伪造和日志格式不统一的问题，journald 使用二进制格式来存储日志信息，因此日志信息很难被伪造，同时 journald 提供了 journalctl 命令行工具来查看日志信息。
- 日志默认存储在 /run/log/journal/ 中，要想永久保存可以创建 /var/log/journal 目录，并且执行 systemd-tmpfiles --create --prefix /var/log/journal。
- journald 可以接受 SIGUSR1（等同 journalctl --flush，将 /run/ 中的日志写到 /var/ 中）、SIGUSR2（等同 journalctl --rotate，立即 rotate 日志）、SIGRTMIN+1（等同 journalctl --sync,立即将 cache 中的日志刷写到磁盘中）信号。

## syslog 缺点

- syslog 的日志格式非常宽松，没有定义结构化的日志格式，也无法索引，使得日志的阅读变得困难。
- syslog 日志项目保存的元数据很有限，缺少一些关键信息，比如服务名、授权进程或者稳定的时间戳。
- syslog 的 rotate 只是基于时间的，无法基于磁盘使用量实现 rotate。
- syslog 没有访问控制。
- syslog 所记录的日志相对单一，与其他日志系统（wtmp, lastlog, audit 等）一起组成了机器上完整的日志系统。
- Syslog 不处理系统启动早期和关机晚期的日志。

### journald 优点

- journald 可以记录二进制的文件，不容易被伪造，并且添加了索引，便于搜索。
- journald 会为每个登录用户创建独立的日志文件，使用 ACL 实现访问控制，保证每个用户可以访问自己的日志文件。
- journald 记录了更多的元数据。
- journald 可以调整输出格式，依据各种字段信息，筛选想要的日志。
- journald 仍然使用 syslog(3) 收集系统日志，并且支持将日志转发到不同的日志服务中。

### journald.conf 介绍

默认配置文件了路径为 `/etc/systemd/journald.conf`，由于配置项众多，具体的请参考[官方文档](https://www.freedesktop.org/software/systemd/man/journalctl.html#)或[中文译本](http://www.jinbuguo.com/systemd/journald.conf.html#)，下面仅列举在生产环境中遇到的一些值得注意的配置项目：

- `Storage`：日志存储方式，默认 auto （当 /var/log/journal 不存在的时候存储在 /run/log/journal），可选值有：volatile(/run/log/journal)和 presistent (会创建 /var/log/journal)。
- `RateLimitIntervalSec` 和 `RateLimitBurst`：用来限制日志的生成速率。RateLimitIntervalSec= 用于设置一个时间段长度，默认值是30秒。 RateLimitBurst= 用于设置一个正整数，表示消息条数，默认值是10000条。表示在 RateLimitIntervalSec= 时间段内，每个服务最多允许产生 RateLimitBurst= 数量(条数)的日志。在同一个时间段内，超出数量限制的日志将被丢弃，直到下一个时间段才能再次开始记录。对于所有被丢弃的日志消息，仅用一条类似"xxx条消息被丢弃"的消息来代替。这个限制是针对每个服务的限制，一个服务超限并不会影响到另一个服务的日志记录。如果 docker 的 log driver 使用的是 journald，这里很容易就超了，因此，可以将 RateLimitBurst 设置为 `0`，表示不受限制。
- `SystemMaxUse` 和 `RuntimeMaxUse`：限制日志文件的大小上限。以 "System" 开头的选项用于限制磁盘使用量，也就是 /var/log/journal 的使用量。以 "Runtime" 开头的选项用于限制内存使用量，也就是 /run/log/journal 的使用量。`SystemMaxUse` 与 `RuntimeMaxUse` 的默认值是10%空间与4G空间两者中的较小者。
- `ForwardToSyslog` 和 `ForwardToKMsg`：ForwardToSyslog 表示是否将接收到的日志消息转发给传统的 syslog 守护进程，默认值为"no"。ForwardToKMsg= 表示是否将接收到的日志消息转发给内核日志缓冲区(kmsg)，默认值为"no"。

## journalctl 介绍

journalctl 用于检索有 journald 收集的日志，这里主要介绍一些常用的 journalctl 命令，当作工具来使用。

### journalctl 命令使用

- journalctl -a 完整显示所有字段内容，即使其中包含非打印字符或者字段内容超长。 默认情况下，包含非打印字符的字段将被缩写为"blob data"(二进制数据)。
- journalctl -f 类似 tail -f，监控日志输出。
- journalctl -e 跳转到日志文件末尾。
- journalctl -n, --lines= 限制显示最新的日志行数。
- journalctl -r 反转日志行的输出顺序， 也就是最先显示最新的日志。
- journalctl -o 选择输出格式。可选的几个重要的值如下（全部的请参考文档）：
    - short，这是默认值，其输出格式与传统的 syslog 文件的格式相似， 每条日志一行。
    - json，将日志项格式化为 JSON 对象，并用换行符分隔(也就是每条日志一行）。
    - json-pretty，将日志项按照JSON数据结构格式化，但是每个字段一行，以便于人类阅读。
    - cat， 仅显示日志的实际内容， 而不显示与此日志相关的 任何元数据(包括时间戳)。
- journalctl --list-boots 列出每次启动的序号。
- journalctl -b [ID] 显示特定启动的日志，0表示最近一次，-1表示上一次，1表示最早的一次启动。
- journalctl -x, --catalog 输出日志的一些说明信息。
- journalctl -k 输出内核日志。
- journalctl -t, --identifier=SYSLOG_IDENTIFIER 输出指定 syslog 标志符的日志。
- journalctl -u 输出特定unit的日志。
- journalctl -p 输出指定优先级的日志。可选的值有："emerg" (0), "alert" (1), "crit" (2), "err" (3), "warning" (4), "notice" (5), "info" (6), "debug" (7)
- journalctl -c, --cursor 从指定cursor开始读取日志。
- journalctl -S, --since, -U, --until 输出从 since 到 until 这个时间段的日志，设为 "now" 以表示当前时间。
- journalctl -F --field 显示所有日志中指定字段的所有可能值。[译者注]类似于SQL语句："SELECT DISTINCT 指定字段 FROM 全部日志"。
- journalctl -N --fields 输出所有日志字段的名称。
- journalctl --header 此选项并不用于显示日志内容， 而是用于显示 日志文件内部的头信息(类似于元数据)。
- journalctl --disk-usage 所有日志文件的磁盘占用总量。
- journalctl --sync --flush 将缓存或者 /var/run/log/journal 的日志写入磁盘。
- journalctl --rotate 立即执行日志轮转。
- journalctl --vacuum-size=200M 删除归档日志，使得磁盘占用保留到 200MB
- journalctl --vacuum-time=1d 删除一天前的全部日志
- journalctl --verify 验证 jounal 内部日志的一致性（不是很懂什么意思）
    - [在这篇文章中](http://ju.outofmemory.cn/entry/343962) 记录了一个使用它的具体的案例

备注：
    journalctl 后可以直接跟日志中的字段名称来过滤，其字段名称请使用 `journalctl -o jsonpretty` 来查看

### journalctl 例子

- journalctl --since "14:10" --until "14:11" 输出特定时间段的日志。
- journalctl --since "2020-02-20 14:10" --until "2020-02-20 14:11" 输出带日期时间段的日志。
- journalctl --vacuum-size=500M 保留500M日志文件，其他按时间删除最早的。
- journalctl --vacuum-time=1days 删除一天前的日志文件。
- journalctl -o json-pretty  _SYSTEMD_UNIT=docker.service _PID=1021 输出按照 `_SYSTEMD_UNIT` 和 `_PID` 字段过滤的日志。
- journalctl -o json-pretty _SYSTEMD_UNIT=docker.service  _SYSTEMD_UNIT=kubelet.service 当同一字段多次出现时，输出满足其中任意一个条件的日志。
- journalctl -o json-pretty -u docker.service -u kubelet.service 与上面搜索条件等价。

## 参考文档

- [金步国](http://www.jinbuguo.com/systemd/journalctl.html)
