(window.webpackJsonp=window.webpackJsonp||[]).push([[15],{196:function(t,s,a){"use strict";a.r(s);var n=a(6),e=Object(n.a)({},(function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[a("h1",{attrs:{id:"mongodb-3-2-的原子性和事务"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#mongodb-3-2-的原子性和事务"}},[t._v("#")]),t._v(" MongoDB 3.2 的原子性和事务")]),t._v(" "),a("p",[t._v("在 MongoDB 中，一个写操作在单文档级别是原子的，即使操作修改了多个在单文档中的内嵌文档。所以问题来了，当一个单个写操作想要修改多个文档的时候，对于每个文档的修改都是原子的，但是从整个写操作来看，该操作不是原子的，并且还可能和其他的写操作交错执行。下面介绍了几种保持数据一致性的方式：")]),t._v(" "),a("h2",{attrs:{id:"isolated-操作符"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#isolated-操作符"}},[t._v("#")]),t._v(" $isolated 操作符")]),t._v(" "),a("p",[t._v("使用 "),a("code",[t._v("$isolated")]),t._v(" 操作符的话，一个修改多个文档的写操作一旦开始修改第一个文档的时候，能够阻止其他进程操作这些文档。这确保了其他的客户端直到整个写操作完成或者出错才能看到数据的改动。一定程度上实现了隔离性，但是 "),a("code",[t._v("$isolated")]),t._v(" 操作符并不能提供 "),a("code",[t._v("all or nothing")]),t._v(" 的原子性。一旦写操作中一个操作发生，错误发生之前的数据并不会回滚。")]),t._v(" "),a("p",[a("code",[t._v("$isolated")]),t._v(" 操作符在执行写操作的时候，会获取一个 collection 级别的排它锁，即使使用的是 "),a("code",[t._v("WiredTiger")]),t._v("。因为 "),a("code",[t._v("isolated")]),t._v(" 操作符将使用单线程来执行整个写操作。")]),t._v(" "),a("h2",{attrs:{id:"参考"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#参考"}},[t._v("#")]),t._v(" 参考")]),t._v(" "),a("ul",[a("li",[a("a",{attrs:{href:"https://docs.mongodb.com/v3.2/core/write-operations-atomicity/",target:"_blank",rel:"noopener noreferrer"}},[t._v("MongoDB 3.2"),a("OutboundLink")],1)])]),t._v(" "),a("h2",{attrs:{id:"两阶段提交"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#两阶段提交"}},[t._v("#")]),t._v(" 两阶段提交")]),t._v(" "),a("p",[t._v("因为单文档可以内嵌多个文档，所以单文档的原子性一定程度上可以满足很多特定的用例。对于那些必须像在单个事务中执行一系列写操作的情况，也就是 "),a("code",[t._v("多文档事务")]),t._v("，可以在应用层实现两阶段提交。")]),t._v(" "),a("h3",{attrs:{id:"多文档事务的要求"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#多文档事务的要求"}},[t._v("#")]),t._v(" 多文档事务的要求")]),t._v(" "),a("ul",[a("li",[t._v("原子性：如果一个操作失败了，在整个事务内，之前成功的操作必须回滚成之前的状态，也就是 "),a("code",[t._v("all or nothing")]),t._v("。")]),t._v(" "),a("li",[t._v("一致性：如果一个重大失败（例如网络，磁盘故障） 中断了事务，数据库必须能够恢复成一致的状态。")])]),t._v(" "),a("h3",{attrs:{id:"账户-ab-之间转账的例子"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#账户-ab-之间转账的例子"}},[t._v("#")]),t._v(" 账户 AB 之间转账的例子")]),t._v(" "),a("p",[t._v("考虑一个场景，你想从账户 A 转账到账户 B，在关系型数据库中，你可以在一个单语句中从 A 中减去资源并添加到 B 上面。但是在 mongoDB 中，这样做肯定是不行的，可以使用使用两阶段提交来实现类似的效果。")]),t._v(" "),a("p",[t._v("假设例子中涉及到的两个  collection 分别为：")]),t._v(" "),a("ul",[a("li",[t._v("accounts： 存储账户信息。")]),t._v(" "),a("li",[t._v("transactions：存储转账事务信息。")])]),t._v(" "),a("p",[t._v("初始化账户 A 和账户 B:")]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[t._v("db"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("accounts"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("insert")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("id"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"A"')]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" balance"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("1000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" pendingTransactions"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("id"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"B"')]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" balance"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("1000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" pendingTranscations"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br")])]),a("p",[t._v("初始化转账记录：")]),t._v(" "),a("p",[t._v("对于每次执行的转账记录，将包含改转账信息的文档插入到 "),a("code",[t._v("transactions")]),t._v(" 表中，文档包含下面的字段信息：")]),t._v(" "),a("ul",[a("li",[t._v("source， destination：引用 "),a("code",[t._v("accounts")]),t._v(" 表里的 _id。")]),t._v(" "),a("li",[t._v("value：指定转账的金额。")]),t._v(" "),a("li",[t._v("state：表示转账行为的当前状态，状态字段可选的值有 "),a("code",[t._v("initial")]),t._v("，"),a("code",[t._v("pending")]),t._v("，"),a("code",[t._v("applied")]),t._v("，"),a("code",[t._v("done")]),t._v("，"),a("code",[t._v("canceling")]),t._v("，"),a("code",[t._v("canceled")]),t._v("。")]),t._v(" "),a("li",[t._v("lastModified：表示最后更新的时间。")])]),t._v(" "),a("p",[t._v("假设账户 A 需要给账户 B 转账 100 块，首先向 "),a("code",[t._v("transactions")]),t._v(" 表中插入一条文档，状态为 "),a("code",[t._v("initial")]),t._v("，"),a("code",[t._v("lastModified")]),t._v(" 为当前时间：")]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[t._v("db"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("transactions"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("insert")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("_id"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" source"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"A"')]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" destination"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"B"')]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" value"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("100")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" state"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"initial"')]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" lastModified； "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("new")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Date")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br")])]),a("h3",{attrs:{id:"两阶段提交的成功应用步骤"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#两阶段提交的成功应用步骤"}},[t._v("#")]),t._v(" 两阶段提交的成功应用步骤")]),t._v(" "),a("ol",[a("li",[a("p",[t._v("检索 "),a("code",[t._v("transactions")]),t._v(" 表中 state 为 "),a("code",[t._v("initial")]),t._v(" 的记录：")]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("var")]),t._v(" t "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" db"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("transactions"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("findOne")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" state"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"initial"')]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br")])])]),t._v(" "),a("li",[a("p",[t._v("更新对应记录的 state 为 "),a("code",[t._v("pending")]),t._v("：")]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[t._v("db"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("transactions"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("update")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" _id"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" t"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("_id"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" state"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"initial"')]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    $"),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("set")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" state"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"pending"')]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n    $currentDate"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" lastModified"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token boolean"}},[t._v("true")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br"),a("span",{staticClass:"line-number"},[t._v("5")]),a("br"),a("span",{staticClass:"line-number"},[t._v("6")]),a("br"),a("span",{staticClass:"line-number"},[t._v("7")]),a("br")])]),a("p",[t._v("这一步需要检查返回结果，如果 "),a("code",[t._v("nMatched")]),t._v(" 和 "),a("code",[t._v("nModified")]),t._v(" 结果为 0， 请返回第一步重新启动该过程。")])]),t._v(" "),a("li",[a("p",[t._v("将该事务 t 添加到两个账户的 "),a("code",[t._v("pendingTransactions")]),t._v(" 中：")]),t._v(" "),a("ul",[a("li",[t._v("更新 source 账户：")])]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[t._v("db"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("accounts"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("update")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" _id"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" t"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("source"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" pendingTransactions"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" $ne"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" t"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("_id "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" $inc"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" balance"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("-")]),t._v("t"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("value "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" $push"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" pendingTransactions"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" t"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("_id "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br")])]),a("p",[t._v("注意 update 的查询条件中要使用 "),a("code",[t._v("$ne")]),t._v(" 排除掉当前 transaction 的 id，防止 push 进相同的 id，导致事务被执行两次。更新完成后需要检查 nMatched 和 nmodified 的结果都是否为 1。")]),t._v(" "),a("ul",[a("li",[t._v("更新 destination 账户：")])]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[t._v("db"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("accounts"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("update")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" _id"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" t"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("destination"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" pendingTransactions"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" $ne"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" t"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("_id "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" $inc"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" balance"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" t"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("value "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" $push"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" pendingTransactions"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" t"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("_id "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br")])]),a("p",[t._v("更新成功后检查 nMathed 和 nModified 结果。")])]),t._v(" "),a("li",[a("p",[t._v("更新事务 state 为 "),a("code",[t._v("applied")]),t._v("：")]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[t._v("db"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("transactions"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("update")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" _id"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" t"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("_id"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" state"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"pending"')]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    $"),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("set")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" state"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"applied"')]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n    $currentDate"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" lastModified"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token boolean"}},[t._v("true")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br"),a("span",{staticClass:"line-number"},[t._v("5")]),a("br"),a("span",{staticClass:"line-number"},[t._v("6")]),a("br"),a("span",{staticClass:"line-number"},[t._v("7")]),a("br")])])]),t._v(" "),a("li",[a("p",[t._v("从两个账户的 "),a("code",[t._v("pendingTransactions")]),t._v(" 中移除该事务 t :")]),t._v(" "),a("p",[t._v("从 accounts 表中的账户 A 和 B 中都移除应用的 transaction id：")]),t._v(" "),a("ul",[a("li",[a("p",[t._v("更新账户 A 的：")]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[t._v("db"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("accounts"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("update")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" _id"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" t"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("source"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" pendingTransactions"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" t"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("_id "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" $pull"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" pendingTransactions"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" t"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("_id "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br")])])]),t._v(" "),a("li",[a("p",[t._v("更新账户 B 的：")]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[t._v("db"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("accounts"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("update")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" _id"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" t"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("destination"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" pendingTransactions"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" t"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("_id "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" $pull"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" pendingTransactions"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" t"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("_id "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br")])])])]),t._v(" "),a("p",[t._v("两次更新结果中 "),a("code",[t._v("nMatched")]),t._v(" 和 "),a("code",[t._v("nModified")]),t._v(" 都应该返回 1。")])]),t._v(" "),a("li",[a("p",[t._v("更新 transaction 表中对应记录的 state 为 "),a("code",[t._v("done")]),t._v("：")]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[t._v("db"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("transactions"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("update")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" _id"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" t"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("_id"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" state"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"applied"')]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n        $"),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("set")]),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" state"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"done"')]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n        $currentDate"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" lastModified"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token boolean"}},[t._v("true")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br"),a("span",{staticClass:"line-number"},[t._v("5")]),a("br"),a("span",{staticClass:"line-number"},[t._v("6")]),a("br")])])])]),t._v(" "),a("h3",{attrs:{id:"如何从失败场景中恢复"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#如何从失败场景中恢复"}},[t._v("#")]),t._v(" 如何从失败场景中恢复")]),t._v(" "),a("p",[t._v("事务处理过程中最重要的部分不是上面的原型示例，而是当事务处理未成功完成时，可以从各种故障场景中恢复的可能性。本节概述了可能的故障，并提供了从此类事件中恢复的步骤。")]),t._v(" "),a("h4",{attrs:{id:"恢复操作"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#恢复操作"}},[t._v("#")]),t._v(" 恢复操作")]),t._v(" "),a("p",[t._v("两阶段提交模式允许运行序列的应用程序恢复事务并达到一致状态。在应用程序启动时（可能有规律地）运行恢复操作，以捕获所有未完成的事务。以下恢复过程使用lastModified日期作为未决事务是否需要恢复的指标；具体来说，如果挂起或已应用的事务在最近30分钟内未更新，则过程将确定这些事务需要恢复。您可以使用不同的条件进行此确定。")]),t._v(" "),a("h5",{attrs:{id:"从-pending-状态恢复"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#从-pending-状态恢复"}},[t._v("#")]),t._v(" 从 pending 状态恢复")]),t._v(" "),a("p",[t._v("指的是从 "),a("code",[t._v("事务状态更新为 pending")]),t._v(" 之后到 "),a("code",[t._v("事务状态更新成 applied")]),t._v(" 之前。")]),t._v(" "),a("ul",[a("li",[a("p",[t._v("首先以一个时间范围为基准，从 tansactions 表中选择范围内的处于 "),a("code",[t._v("pending")]),t._v(" 状态的记录：")]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("var")]),t._v(" dateThreshold "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("new")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Date")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\ndateThreshold"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("setMinutes")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("dateThreshold"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("getMinutes")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("-")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("30")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("var")]),t._v(" t "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" db"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("transactions"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("findOne")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" state"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"pending"')]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" lastModified"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" $lt"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" dateThreshold "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br")])])]),t._v(" "),a("li",[a("p",[t._v("然后应用上面的第三步，"),a("strong",[t._v("将该事务 t 添加到两个账户的 "),a("code",[t._v("pendingTransactions")]),t._v(" 中")]),t._v("。")])])]),t._v(" "),a("h5",{attrs:{id:"从-applied-状态恢复"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#从-applied-状态恢复"}},[t._v("#")]),t._v(" 从 applied 状态恢复")]),t._v(" "),a("p",[t._v("指的是从 "),a("code",[t._v("事务状态更新为 applied")]),t._v(" 之后到 "),a("code",[t._v("事务状态更新成 done")]),t._v(" 之前。")]),t._v(" "),a("ul",[a("li",[a("p",[t._v("首先以一个时间范围为基准，从 tansactions 表中选择范围内的处于 "),a("code",[t._v("pending")]),t._v(" 状态的记录：")]),t._v(" "),a("div",{staticClass:"language-js line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("var")]),t._v(" dateThreshold "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("new")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Date")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\ndateThreshold"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("setMinutes")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("dateThreshold"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("getMinutes")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("-")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("30")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("var")]),t._v(" t "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" db"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("transactions"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("findOne")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" state"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"applied"')]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" lastModified"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" $lt"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" dateThreshold "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br")])])]),t._v(" "),a("li",[a("p",[t._v("然后应用上面的第五步，"),a("strong",[t._v("将该事务 t 添加到两个账户的 "),a("code",[t._v("pendingTransactions")]),t._v(" 中")]),t._v("。")])])]),t._v(" "),a("h4",{attrs:{id:"rollback-操作"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#rollback-操作"}},[t._v("#")]),t._v(" Rollback 操作")]),t._v(" "),a("p",[t._v("由此可见在 MongoDB 3.2 中强行使用多文档事务有多累。。。")]),t._v(" "),a("p",[t._v("##　并发控制")]),t._v(" "),a("p",[t._v("如果想保证某个字段的值唯一，可以使用　"),a("code",[t._v("unique")]),t._v(" 索引。这样可以防止插入或者更新文档的时候创建出重复的值。")])])}),[],!1,null,null,null);s.default=e.exports}}]);