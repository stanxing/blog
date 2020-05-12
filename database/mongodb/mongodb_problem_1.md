# 记一次 MongoDB secondary 节点 block 所有读请求的事故

## 问题描述

- 问题版本：MongoDB 3.2.19 (预计在 3.7 之前都会存在这个问题)
- 问题描述：为了方便对索引的自动化管理，我们实现了一个服务专门用来同步项目中定义的索引到 mongodb 中。支持对索引的自动增删操作。开始一切都是美好的，但是在部署到 production 后发生了一次事故，索引服务对一个大表（数据量在千万级别）执行了创建索引的操作，待 primary 节点执行完后，索引服务返回，并开始执行下一个删除索引的操作(恰好也是这个大表)，就是这套操作导致 secondary 节点被阻塞直到索引创建完成才恢复，期间 secondary 节点无法进行任何读请求。

## 时间线

- 02-19 21:05 开始在 primary 节点执行 collection 表的索引创建。
- 02-19 21:52 primary 节点索引创建完成，secondary 节点同步 oplog 后开始自动创建索引。
- 02-19 21:52 primary 节点索引创建完成后立即执行了删除 collection 表中的一个索引，基本上立即返回。
- 02-19 22:53 收到报警排查发现 secondary 节点不响应任何读请求，但此时数据库可以正常连接。
- 02-19 22:46 secondary 节点索引创建完成，开始正常接受读请求。

## 排查

- 刚开始发现问题后百思不得其解，觉得是 mongodb 的 bug 但是又不知道该用什么关键词来翻 mongodb 的 issue 列表。而且第一时间没有发现是删除操作导致的锁库，以为是超大表创建索引的 bug。但是重新手动执行 mongodb 后台创建索引的命令测试了几遍都未能重现，所以排除了是创建索引的问题。

- 再次翻看那段时间时间的日志，发现 primary 节点记录了在后台创建完索引后又执行了 dropIndex 的操作，由于 oplog 的同步机制，此时 secondary 节点的索引创建仍然还在进行中，此时执行 dropIndex 操作会不会导致锁库？

- 带着这个问题再次搜了 mongodb 的 issue 列表，终于发现了几个行为一样的 issue。例如[SERVER-25841](https://jira.mongodb.org/browse/SERVER-25841)，[SERVER-21307](https://jira.mongodb.org/browse/SERVER-21307), 基本就是我遇到的问题了。issue 里记录了在 3.7.3 修复了 secondary 节点读阻塞的问题（没有解决复制写的问题），完全修复在 4.3.4 版本。

## 问题原因

上面的 issue 中都没有解释造成该问题的原因，所以我就继续搜了下去，直到在 [Secondary节点为何阻塞请求近一个小时？](https://mongoing.com/archives/2955) 和 [MongoDB Secondary 延时高（同步锁）问题分析](https://mongoing.com/archives/3568)这量篇博客中看到 `Lock::ParallelBatchWriterMode` 锁的介绍：secondary 节点在重放 oplog 的时候会加一把特殊的锁，叫做 `Lock::ParallelBatchWriterMode` 锁，简称 `PBWM` 锁。该锁是一把全局写锁，会阻塞所有的读请求，直到这批 oplog 全部重放完成。这么做的原因是避免让reader 看到中间状态，只有等一批 oplog 全部应用成功才让客户端可读，避免出现脏读的问题。 secondary 节点重放后台创建索引的操作只会对 DB 加意向写锁（IX），会放在后台线程中做，只会阻塞 reader 很短的时间（毫秒级别）。后面又对同一个 DB 发起了删除索引的操作，oplog 开始重放后，删除索引需要对 DB 加互斥锁（X）。但此刻该 DB 已经被加了意向写锁（IX），互斥锁只能一直等待后台创建索引完成才能获取到 DB 资源，由于 oplog 重放一直阻塞着，`PBWM` 锁也一直释放不掉，所以从这个时间点开始，整个 secondary 节点就被阻塞了，直到后台索引创建完成。

## 总结

如果需要执行创建索引并删除索引的操作，一定要注意检查 secondary 节点中存在的 op，避免存在同一 DB 的创建索引和删除索引的操作同时存在这种情况。
