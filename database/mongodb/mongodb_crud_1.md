# MongoDB 3.2 的原子性和事务

在 MongoDB 中，一个写操作在单文档级别是原子的，即使操作修改了多个在单文档中的内嵌文档。所以问题来了，当一个单个写操作想要修改多个文档的时候，对于每个文档的修改都是原子的，但是从整个写操作来看，该操作不是原子的，并且还可能和其他的写操作交错执行。下面介绍了几种保持数据一致性的方式：

## $isolated 操作符

使用 `$isolated` 操作符的话，一个修改多个文档的写操作一旦开始修改第一个文档的时候，能够阻止其他进程操作这些文档。这确保了其他的客户端直到整个写操作完成或者出错才能看到数据的改动。一定程度上实现了隔离性，但是 `$isolated` 操作符并不能提供 `all or nothing` 的原子性。一旦写操作中一个操作发生，错误发生之前的数据并不会回滚。

`$isolated` 操作符在执行写操作的时候，会获取一个 collection 级别的排它锁，即使使用的是 `WiredTiger`。因为 `isolated` 操作符将使用单线程来执行整个写操作。

## 参考

- [MongoDB 3.2](https://docs.mongodb.com/v3.2/core/write-operations-atomicity/)

## 两阶段提交

因为单文档可以内嵌多个文档，所以单文档的原子性一定程度上可以满足很多特定的用例。对于那些必须像在单个事务中执行一系列写操作的情况，也就是 `多文档事务`，可以在应用层实现两阶段提交。

### 多文档事务的要求

- 原子性：如果一个操作失败了，在整个事务内，之前成功的操作必须回滚成之前的状态，也就是 `all or nothing`。
- 一致性：如果一个重大失败（例如网络，磁盘故障） 中断了事务，数据库必须能够恢复成一致的状态。

### 账户 AB 之间转账的例子

考虑一个场景，你想从账户 A 转账到账户 B，在关系型数据库中，你可以在一个单语句中从 A 中减去资源并添加到 B 上面。但是在 mongoDB 中，这样做肯定是不行的，可以使用使用两阶段提交来实现类似的效果。

假设例子中涉及到的两个  collection 分别为：

- accounts： 存储账户信息。
- transactions：存储转账事务信息。

初始化账户 A 和账户 B:

```js
db.accounts.insert([
    {id: "A", balance: 1000, pendingTransactions: []},
    {id: "B", balance: 1000, pendingTranscations: []},
])
```

初始化转账记录：

对于每次执行的转账记录，将包含改转账信息的文档插入到 `transactions` 表中，文档包含下面的字段信息：

- source， destination：引用 `accounts` 表里的 _id。
- value：指定转账的金额。
- state：表示转账行为的当前状态，状态字段可选的值有 `initial`，`pending`，`applied`，`done`，`canceling`，`canceled`。
- lastModified：表示最后更新的时间。

假设账户 A 需要给账户 B 转账 100 块，首先向 `transactions` 表中插入一条文档，状态为 `initial`，`lastModified` 为当前时间：

```js
db.transactions.insert(
    {_id: 1, source: "A", destination: "B", value: 100, state: "initial", lastModified； new Date() }
)
```

### 两阶段提交的成功应用步骤

1. 检索 `transactions` 表中 state 为 `initial` 的记录：

    ```js
    var t = db.transactions.findOne( { state: "initial" } )
    ```

2. 更新对应记录的 state 为 `pending`：

    ```js
    db.transactions.update(
        { _id: t._id, state: "initial" },
        {
        $set: { state: "pending" },
        $currentDate: { lastModified: true }
        }
    )
    ```

    这一步需要检查返回结果，如果 `nMatched` 和 `nModified` 结果为 0， 请返回第一步重新启动该过程。

3. 将该事务 t 添加到两个账户的 `pendingTransactions` 中：

    - 更新 source 账户：

    ```js
    db.accounts.update(
        { _id: t.source, pendingTransactions: { $ne: t._id } },
        { $inc: { balance: -t.value }, $push: { pendingTransactions: t._id } }
    )
    ```

    注意 update 的查询条件中要使用 `$ne` 排除掉当前 transaction 的 id，防止 push 进相同的 id，导致事务被执行两次。更新完成后需要检查 nMatched 和 nmodified 的结果都是否为 1。

    - 更新 destination 账户：

    ```js
    db.accounts.update(
        { _id: t.destination, pendingTransactions: { $ne: t._id } },
        { $inc: { balance: t.value }, $push: { pendingTransactions: t._id } }
    )
    ```

    更新成功后检查 nMathed 和 nModified 结果。

4. 更新事务 state 为 `applied`：

    ```js
    db.transactions.update(
    { _id: t._id, state: "pending" },
    {
        $set: { state: "applied" },
        $currentDate: { lastModified: true }
    }
    )
    ```

5. 从两个账户的 `pendingTransactions` 中移除该事务 t :

    从 accounts 表中的账户 A 和 B 中都移除应用的 transaction id：

    - 更新账户 A 的：

        ```js
        db.accounts.update(
            { _id: t.source, pendingTransactions: t._id },
            { $pull: { pendingTransactions: t._id } }
        )
        ```

    - 更新账户 B 的：

        ```js
        db.accounts.update(
            { _id: t.destination, pendingTransactions: t._id },
            { $pull: { pendingTransactions: t._id } }
        )
        ```

    两次更新结果中 `nMatched` 和 `nModified` 都应该返回 1。

6. 更新 transaction 表中对应记录的 state 为 `done`：

    ```js
    db.transactions.update(
        { _id: t._id, state: "applied" },
            $set: { state: "done" },
            $currentDate: { lastModified: true }
        }
    )
    ```

### 如何从失败场景中恢复

事务处理过程中最重要的部分不是上面的原型示例，而是当事务处理未成功完成时，可以从各种故障场景中恢复的可能性。本节概述了可能的故障，并提供了从此类事件中恢复的步骤。

#### 恢复操作

两阶段提交模式允许运行序列的应用程序恢复事务并达到一致状态。在应用程序启动时（可能有规律地）运行恢复操作，以捕获所有未完成的事务。以下恢复过程使用lastModified日期作为未决事务是否需要恢复的指标；具体来说，如果挂起或已应用的事务在最近30分钟内未更新，则过程将确定这些事务需要恢复。您可以使用不同的条件进行此确定。

##### 从 pending 状态恢复

指的是从 `事务状态更新为 pending` 之后到 `事务状态更新成 applied` 之前。

- 首先以一个时间范围为基准，从 tansactions 表中选择范围内的处于 `pending` 状态的记录：

    ```js
    var dateThreshold = new Date();
    dateThreshold.setMinutes(dateThreshold.getMinutes() - 30);

    var t = db.transactions.findOne( { state: "pending", lastModified: { $lt: dateThreshold }
    ```

- 然后应用上面的第三步，**将该事务 t 添加到两个账户的 `pendingTransactions` 中**。

##### 从 applied 状态恢复

指的是从 `事务状态更新为 applied` 之后到 `事务状态更新成 done` 之前。

- 首先以一个时间范围为基准，从 tansactions 表中选择范围内的处于 `pending` 状态的记录：

    ```js
    var dateThreshold = new Date();
    dateThreshold.setMinutes(dateThreshold.getMinutes() - 30);

    var t = db.transactions.findOne( { state: "applied", lastModified: { $lt: dateThreshold } } );
    ```

- 然后应用上面的第五步，**将该事务 t 添加到两个账户的 `pendingTransactions` 中**。

#### Rollback 操作

由此可见在 MongoDB 3.2 中强行使用多文档事务有多累。。。

##　并发控制

如果想保证某个字段的值唯一，可以使用　`unique` 索引。这样可以防止插入或者更新文档的时候创建出重复的值。