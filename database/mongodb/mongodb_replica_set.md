# MongoDB 复制集

## 作用

- 实现服务高可用。
    - 数据写入时能迅速将数据复制到另一个独立节点上。
    - 在接受写入的节点发生故障的时候会自动选举出一个新的替代节点。

- 在实现高可用的同时，还能实现一些附加作用：

    - 数据分发：将数据从一个区域复制到另一个区域，减少另一个区域的延迟。
    - 读写分离：不同类型的压力分别在不同的节点上执行。
    - 异地容灾：节点可以分布在不同的可用区，在数据中心故障的时候可以快速的切换到异地。

## 搭建

一个典型的复制集由 3 个及 3 个以上具有投票权的节点组成，包括：

- 一个 primary 节点： 接收写操作和选举时投票
- 两个或者多个 secondary 节点：复制主节点上的新数据和选举时投票。
- arbiter 节点，也叫投票节点，不存储数据，只用来投票，一般用在只有偶数个数据节点的情况下，为了构成奇数个节点来满足投票大多数的要求，不推荐使用。

## 数据是如何复制的？

- 当一个修改操作，无论是插入，删除或者更新操作，到达主节点时，它对数据的操作将被记录下来，这些记录存在 local 数据库的 oplog 表中。
- secondary 节点通过在主节点上打开一个 tailable 游标不断获取进入主节点的 oplog，并且在自己的数据库中回放，以保持跟主节点数据的一致。

## 选举流程

- 具有投票权的节点之间亮亮发送心跳。
- 当 5 次心跳未收到回复的时候判断为节点失联
- 如果失联的是主节点，从节点会发起选举，选出新的主节点。
- 如果失联的是从节点则不会产生新的选举。
- 基于 RAFT 一致性算法实现，选举成功的必要条件是大多数的投票节点存活。
- 复制集中最多可以有 50 个节点，但是投票节点最多只能有 7 个。

## 影响选举的因素

- 整个集群中必须有大多数节点存活

- 被选举为主节点的节点必须：
    - 能够与多数节点建立连接
    - 具有较新的 oplog
    - 具有较高的优先级

## 复制集的选项

- 是否具有投票权，
- 优先级： priority， 优先级越高，越容易成为主节点，优先级为 0 的节点无法成为主节点
- 隐藏： hidden，复制数据，但对应用不可见。隐藏节点可以具有投票权，但优先级必须为 0，也就是说不会被选为主节点。
- 延迟： slaveDelay，复制 n 秒之前的数据，保持与主节点的时间差。

## 注意事项

- 正常的复制集节点都可能成为主节点，因为硬件配置最好是一样的。
- 为保证节点不会同时宕机，各节点不应该部署在同一个机器或者同一个区域。
- 复制集的软件版本必须一致，避免出现一些奇怪的问题。
- 增加节点可以扩展系统的读性能，但是不能扩展系统的写性能。