# MongoDB 索引类型

索引是提升查询性能非常重要的一个手段。MongoDB 索引的底层实现使用了 B-Tree 的数据结构。在索引中存储特定的字段的值或者一组字段的值，支持按照字段的值排序。

## 默认的 _id 索引

mongodb 在集合创建的时候就会默认生成一个 `_id` 字段的唯一索引，这个索引阻止客户端插入两条 `_id` 一样的文档，整个索引无法被 drop。

## 单字段索引

即索引中的字段是文档中的一个字段，一般单字段索引的　value　中，`1` 指定按升序对项目进行排序的索引，`-1` 指定按降序对项目进行排序的索引。对于单字段索引和排序操作，索引键的排序顺序（即升序或降序）无关紧要，因为MongoDB可以沿任一方向遍历索引。

```js
// 注意，这种方式会在前台创建索引，会阻塞　mongodb 的读写操作。可以使用 background : ture 选项设置后台创建索引。
db.records.createIndex({score: 1})
```

### 在嵌套字段中创建索引

```js

{
  "_id": ObjectId("570c04a4ad233577f97dc459"),
  "score": 1034,
  "location": { state: "NY", city: "New York" }
}
// 如上文档所述，如果要查询 `location.state` 字段的值，应该建立如下索引：
db.records.createIndex( { "location.state": 1 } )
// 可以支持如下的查询：
db.records.find( { "location.state": "CA" } )
```

### 在嵌套文档中创建索引

```js
{
  "_id": ObjectId("570c04a4ad233577f97dc459"),
  "score": 1034,
  "location": { state: "NY", city: "New York" }
}
// 还是上面的例子，嵌套文档指的是整个 location 字段，可以创建如下索引：
db.records.createIndex( { location: 1 } )
// 上面的索引可以支持对嵌套文档的查询，注意跟上面的区分
//  这个例子仍然需要注意的一点是，下面这个查询条件不会查到上面的文档，原因是执行相等匹配的时候，不仅会检查字段的值是否相等，还会匹配字段的顺序是否相同，显然顺序并不相同。
db.records.find( { location: { city: "New York", state: "NY" } } )
```

### 注意事项

- 一些驱动程序可能会使用NumberLong（1）而不是1来指定索引。这对结果索引没有任何影响。

##　复合索引

复合索引指的是将多个字段组合到一起创建索引，这样可以加速匹配多个字段的查询。

### 限制

- mongodb 限制复合索引最多指定 32 个字段。
- 创建复合索引不得是哈希索引类型。

### 复合索引的字段顺序和字段排序顺序

在一个复合索引里，字段顺序是非常重要的。因为在索引中包含的文档引用会首先按照第一个字段的顺序来排序，满足第一个字段后再按照第二个字段的值来排序，以此类推这样子。

在单字段索引中，字段的排序顺序是不重要的，因为 mongodb 可以从索引的任意一头来遍历。但是对于复合索引来说，复合索引中字段的排序顺序可能决定了查询条件中的排序操作是否能够命中索引。

比如下面一条查询命令，先按照 username 升序，再按照 date 降序，以此来得到查询结果：

```js
db.events.find().sort( { username: 1, date: -1 } )
```

我们可以创建如下索引：

```js
// 该索引可以正确命中，因为字段排序的顺序和索引中指定的顺序完全一致
db.events.createIndex( { "username" : 1, "date" : -1 } )
```

但是我们**不能创建**如下索引：

```js
// 该索引无法命中，因为索引是先按照 username 升序排序的，再按照 date 降序，索引顺序跟要查询的顺序并不匹配，无法直接从索引中遍历得到对应的文档引用，
// 只能全表扫描，然后在内存排序，如果数据量很大触发 mongodb 的内存排序限制，一般是 32MB，操作就会报错。
db.events.find().sort( { username: 1, date: 1 } )
```

多字段排序的要求：

- 对于索引 `{ a: 1, b: 1 }`， 可以支持在 `{ a: 1, b: 1 }` 上的排序，但是不能支持 `{ b: 1, a: 1 }` 的排序。
- 对于索引 `{ a: 1, b: -1 }`， 可以支持在 `{ a: -1, b: 1 }`（相当于反向遍历） 或者 `{ a: 1, b: -1 }` 上的排序，但是不支持 `{ a: -1, b: -1 }` 或者 `{a: 1, b: 1}` 上的排序。

### 复合索引的前缀匹配

索引前缀指的是索引字段的子集。对于如下的索引：

```js
{ "item": 1, "location": 1, "stock": 1 }
```

索引前缀包括如下两条：

```js
// 一定要注意，不包括 { location: 1} 或者 { stock： 1 }
{ item: 1 }
{ item: 1, location: 1 }
```

所以上面的索引实际上可以支持三种字段组合的情况：

- the `item` field,
- the `item` field and the `location` field,
- the `item` field and the `location` field and the `stock` field.

mongodb 也可以支持在 `item` 和 `stock` 字段的查询，因为 `item` 字段对应了一个索引前缀，但是这个索引的效率核能不是最优的，更好的方式是建立 `item` 和 `stock` 字段的复合索引。

因此，如果你的集合中既有 `{a： 1， b: 1}` 和 `{a: 1}` 索引，而且这两个索引都不包含 sparse 索引或者 unique 索引的约束，那么可以删掉 `{ a：1 }` 索引以节省存储空间，由于前缀匹配规则的存在，该索引的用例一定能在另一个索引中完全使用。

### 在索引前缀中的排序

### 在非前缀的索引子集中排序

## 多键索引

为了索引包含数组值的字段，MongoDB 为数组中的每个元素创建一个索引键。这些多键索引支持对数组字段的有效查询。可以在既包含标量值（例如字符串，数字）又包含嵌套文档的数组上构造多键索引。

如果索引字段是数组，MongoDB 都会自动创建一个多键索引，无需显式指定多键类型。

### 基本数组类型

对于如下的基本数组类型，创建多键索引后，索引包含 2， 5， 9 三个 key，并且都指向同一个文档。

```js
// db.survey.createIndex( { ratings: 1 } )
{ _id: 1, item: "ABC", ratings: [ 2, 5, 9 ] }
```

### 嵌套文档的数组类型

对于如下的嵌套文档的数组类型

```js
// db.inventory.createIndex( { "stock.size": 1, "stock.quantity": 1 } )
{
  _id: 1,
  item: "abc",
  stock: [
    { size: "S", color: "red", quantity: 25 },
    { size: "S", color: "blue", quantity: 10 },
    { size: "M", color: "blue", quantity: 50 }
  ]
}
{
  _id: 2,
  item: "def",
  stock: [
    { size: "S", color: "blue", quantity: 20 },
    { size: "M", color: "blue", quantity: 5 },
    { size: "M", color: "black", quantity: 10 },
    { size: "L", color: "red", quantity: 2 }
  ]
}
```

### 限制

- 对于一个复合多键索引，每个被索引的文档最多有一个被索引的字段是数组。例如如下的文档，不能在集合上创建复合多键索引 `{a：1，b：1}`，因为 a 和 b 字段都是数组。

  ```js
  { _id: 1, a: [ 1, 2 ], b: [ 1, 2 ], category: "AB - both arrays" }
  ```

- 哈希索引不能是多键索引。

- 多键索引不能覆盖一个查询。

- 查询作为一个整体的数组

当查询过滤器为整个数组指定完全匹配时，MongoDB可以使用多键索引查找查询数组的第一个元素，但不能使用多键索引扫描来查找整个数组。相反，在使用多键索引查找查询数组的第一个元素之后，MongoDB检索关联的文档并过滤其数组与查询中的数组匹配的文档。例如下面的例子：

```js
{ _id: 5, type: "food", item: "aaa", ratings: [ 5, 8, 9 ] }
{ _id: 6, type: "food", item: "bbb", ratings: [ 5, 9 ] }
{ _id: 7, type: "food", item: "ccc", ratings: [ 9, 5, 8 ] }
{ _id: 8, type: "food", item: "ddd", ratings: [ 9, 5 ] }
{ _id: 9, type: "food", item: "eee", ratings: [ 5, 9, 5 ] }
```

该 collection 有如下的多键索引：

```js
db.inventory.createIndex( { ratings: 1 } )
```

假设有如下的查询：

```js
db.inventory.find( { ratings: [ 5, 9 ] } )
```

MongoDB 可以使用多键索引来查找在 Ratings 数组中任何值为 5 的文档。然后，MongoDB 检索这些文档并过滤其 ratings 数组等于查询数组 [5、9] 的文档。

## 文本索引

## 2dsphere 索引

## 哈希索引

## 索引选项

###　TTL 索引

TTL索引是特殊的单字段索引，并且字段类型必须是 date 类型或者包含有 date 类型的数组，MongoDB 可以使用它在一定时间后或在特定时钟时间自动从集合中删除文档。 数据到期对于某些类型的信息非常有用，例如机器生成的事件数据，日志和会话信息，这些信息只需要在数据库中持续有限的时间。

### Unique 索引

唯一索引可确保索引字段不存储重复值; 即强制索引字段的唯一性。默认情况下，MongoDB在创建集合期间在_id字段上创建唯一索引。

### partial 索引

### sparse 索引
