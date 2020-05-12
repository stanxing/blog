# encoding/json 源码解析

JSON（JavaScript Object Notation）是一种基于文本的数据交换格式。在 web 应用中会经常使用。其最重要的两个方法分别是序列化和反序列化。不同的编程语言只要按照 JSON 规范实现了这两个方法便可以做到一致的数据交换。序列化的意思就是将语言对应的对象转换成为文本字符串（JSON 是基于文本的协议）。反序列化的意思就是将文本字符串转换成为语言中对应的对象，供语言解析并处理。

## 用法

### 编码（序列化）

```go
func Marshal(v interface{}) ([]byte, error)
```

json 库中提供了 Marshal 方法供将一个任意类型的对象序列化成 json 文本字符串（字节切片）。下面是一个基础用法的例子：

```go
type Message struct {
    Name string
    Body string
    Time int64
}
m := Message{"Alice", "Hello", 1294706395881547000}
b, err := json.Marshal(m)
// b == []byte(`{"Name":"Alice","Body":"Hello","Time":1294706395881547000}`)
```

#### 注意事项

- JSON 规范中明确规定只支持 string 类型作为 key，所以 go 中的 map 类型必须是 map[string]T
- channel, complex, function 类型不能被编码（JSON 规范中不支持这些类型）
- 不支持循环结构，这样会导致在编码中陷入死循环。
- 指针将被编码成它指向的值，如果指向 nil，将被编码成 null。

### 解码（反序列化）

```go
func Unmarshal(data []byte, v interface{}) error
```

json 库中提供了 Unmarshal 方法用来反序列化 json 数据。需要传入两个参数，第一个为 json 数据，第二为要映射的类型（结构体）指针。下面是一个简单的例子：

```go
var m Message
err := json.Unmarshal(b, &m)
// 调用方法后，m 中各字段被成功赋值就像下面的结构一样：
// m = Message{
//     Name: "Alice",
//     Body: "Hello",
//     Time: 1294706395881547000,
// }
```

#### Unmarshal 函数是如何识别被编码中的数据对应的是结构体中的哪些字段呢？

对于一个被给定的 json key `Foo`， Unmarshal 将按照下面的优先级顺序查找：

- 一个被导出的字段，并且包含 `Foo` tag。
- 一个被导出的字段，名称为 `Foo`。
- 一个被导出的字段，名称为 `F00` 或者 `Fo0` 或者大小写不敏感的匹配，比如 `foo`。

#### 如果 json 数据与传入的结构体字段不匹配会发生什么呢？

例如下面这个例子：

```go
b := []byte(`{"Name":"Bob","Food":"Pickle"}`)
var m Message
err := json.Unmarshal(b, &m)
```
Unmarshal 只会解码在目标类型中可以找到的字段。在这种情况下，将仅填充 m 的 Name 字段，而 Food 字段将被忽略。当您希望从大型 JSON Blob中仅选择几个特定字段时，此行为特别有用。这也意味着目标结构中任何未导出的字段都不会受到 Unmarshal 的影响。

#### 如果事先不知道 JOSN 数据具体的类型怎么办呢？

此时， interface{} 便可以派上用场了。该接口可以包含任意类型，因为每个 go 类型都实现了至少 0 个方法，所以都满足空接口。如果底层类型不知道，便可以使用类型断言来判断是否满足某个类型，比如这样：

```go
switch v := i.(type) {
case int:
    fmt.Println("twice i is", v*2)
case float64:
    fmt.Println("the reciprocal of i is", 1/v)
case string:
    h := len(v) / 2
    fmt.Println("i swapped by halves is", v[h:]+v[:h])
default:
    // i isn't one of the types above
}
```

json 包使用 `map[string] interface {}` 和 `[]interface {}` 值存储任意 JSON 对象和数组；它将任何有效的 JSON 元素映射进一个纯 interface{} 值中。默认具体的 Go 类型和 JSON 类型的映射关系是：

- bool for JSON booleans
- float64 for JSON numbers
- string for JSON strings
- nil for JSON null

考虑下面一个例子：

```go
b := []byte(`{"Name":"Wednesday","Age":6,"Parents":["Gomez","Morticia"]}`)
var f interface{}
err := json.Unmarshal(b, &f)
```
此时 f 将会被映射为下面的结构：

```go
f = map[string]interface{}{
    "Name": "Wednesday",
    "Age":  6,
    "Parents": []interface{}{
        "Gomez",
        "Morticia",
    },
}
```
所以当要访问数据的时候，就要使用类型断言来判断值对应的具体类型，这样，可以做到使用未知的 JSON 数据，同时仍然享有类型安全的好处。如下：

```go
m := f.(map[string]interface{})
for k, v := range m {
    switch vv := v.(type) {
    case string:
        fmt.Println(k, "is string", vv)
    case float64:
        fmt.Println(k, "is float64", vv)
    case []interface{}:
        fmt.Println(k, "is an array:")
        for i, u := range vv {
            fmt.Println(i, u)
        }
    default:
        fmt.Println(k, "is of a type I don't know how to handle")
    }
}
```

#### 结构体中有引用类型，在解码的时候会发生什么？

考虑下面的例子，这段代码可以正常工作，`Parents` 本来是一个未初始化的 slice，但是仍然能正确拿到值，是因为初始化的工作由 Unmarshal 函数做了。不仅这些，对于指针，切片，map 都会自动初始化。

```go
type FamilyMember struct {
    Name    string
    Age     int
    Parents []string
}

var m FamilyMember
err := json.Unmarshal(b, &m)
```

考虑第二个例子，如果结构体中的某个字段是指针怎么办：

```go
type Bar struct {
    Name string
    Age int
}
type Foo struct {
    Bar *Bar
}

b1 := []byte(`{"Bar":{"Name":"Wednesday","Age":6}}`)
b2 := []byte("")

var m1 Foo
var m2 Foo
err := json.Unmarshal(b1, &m1)
err = json.Unmarshal(b2, &m2)
fmt.Printf("m1: %#+v, m1.Bar: %#+v\n", m1, m1.Bar)
// m1: main.Foo{Bar:(*main.Bar)(0xc00000c1a0)}, m1.Bar: &main.Bar{Name:"Wednesday", Age:6}
fmt.Printf("m2: %#+v, m2.Bar: %#+v\n", m2, m2.Bar)
// m2: main.Foo{Bar:(*main.Bar)(nil)}, m2.Bar: (*main.Bar)(nil)
m3 := Foo struct {}
b, err := json.Marshal(m3)
fmt.Printf("b3: %s\n", b3)
// b3: {"Bar":null}
```

答案也很明显, 当 json 数据中字段不存在时，结构体中映射的 Bar 值为 nil，如果存在，会创建对应的结构体实例。同样也测试了下对于指针的 Marshal 方法，当指针为 nil 的时候，编码为 null。



## 参考

- [Go blog](https://blog.golang.org/json)
- [Go Doc](https://golang.org/pkg/encoding/json/)