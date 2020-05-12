# 读 Effective Go 总结

官方文档 [Effective Go](https://golang.org/doc/effective_go.html#introduction) 介绍了 Go 语言编程的基本特性，以及如何编写清晰，具有 GO 惯用风格的代码技巧。详细的语言规范还是要阅读[Go Language Specification](https://golang.org/ref/spec)。

本篇文章只是总结下里面提到的一些值得注意的细节和方式，完整的中文翻译请参考[这里](https://www.kancloud.cn/kancloud/effective/72199)。

## 格式化

在 go 代码格式化方面，我觉得其实最重要的就是保持一致，不需要花太多时间纠结在这上面，go 提供了 `gofmt` 工具，各种 IDE 都有对应的 golint 插件可以安装，只要整个项目团队内风格一致即可。

文章中介绍了默认 `gofmt` 工具的一些细节：

- 使用 `Tab` 缩进。
- Go 没有行长度限制。如果觉得一行太长，可以折成几行，并且额外的使用一个 `Tab` 缩进
- Go 相比 Java 和 C，很少需要括号，控制结构的语法不需要括号。而且操作符优先级是通过空格来表明含义的，如下：

```go
x<<8 + y<<16
```

## 注释

go 提供了 `/* */` 块注释和 `//` 行注释这两种方式。块注释一般作为程序 package 的注释，但也可以用于代码中。

`godoc`，一个 server 程序，用来处理 go 源文件，抽取源文件中的注释内容作为文档。因此注释的质量决定了 `godoc` 产生的文档的质量。每个程序包都应该有一个包注释，一个位于 `package xxx` 代码之前的块注释。对于有多个文件的包，包注释只需要出现在一个文件中即可。包注释应该介绍该程序包，并且提供与整个包相关的信息。它将首先出现在 `godoc` 页面上。

值得注意的是，注释是普通文件，不是 HTML，`godoc` 可能不会重新格式化注释，所以要确保注释使用了正确的拼写，标点，以及语句结构，将较长的行进行折叠等等。

在程序包里，任何位于顶层声明之前的注释都会作为该声明的文档注释。程序中每一个被导出的名字都应该有一个文档注释。

###　包名

当一个程序包被导入，包名便可以用来访问它的内容。比如 `import bytes` 之后，导入的程序包中便可以使用 `bytes.Buffer`。因此，这意味着包名要 **简短**、**简洁**、**可读性好**。按照惯例，包名应该使用 **小写**、**一个单词的名字**、**不要使用下划线或者驼峰**。其次，不用担心包名会有冲突，程序包名只是导入的默认名字，不需要在所有源代码中是唯一的，如果发生了冲突，导入的包可以在 `import` 的时候指定一个其他的名字来引用。

另一个约定是，程序包名是其源目录的基础目录名，比如，在 `src/pkg/encoding/base64` 中的程序包，是作为 `encoding/base64` 来导入的，但是默认导入的其包名是 `base64`，而不是 `encoding_base64` 或者 `encodingBase64`。程序包的导入者将使用该名字来引用包中的内容，因此在程序包中被导出的名字可以利用这个事实来避免上下文语义混乱。比如说在 `bufio` 包中有一个带缓冲的读入类型叫做 `Reader`，而不是 `BufReader`。因为用户在导入后调用其使用的是 `bufio.Reader`, 名字很清晰。它不会跟 `io.Reader` 冲突或者是让人感到歧义。同样的，如果导入的包中只有一个被到处的结构体，例如 `ring.Ring`, 那么其创建新实例的函数应该叫做 `New` 而不是 `NewRing`，因为在被导入后，用户看到的是 `ring.New`, 这同样不会造成语义不明确。

还有个小例子是 `once.Do`, `once.Do(setup)` 很好读，写成 `once.DoOrWaitUntilDone(setup)` 并不会改善。长的名字并一定会使得事物更加易读。具有帮助性的文档注释往往会比格外长的名字更有用。

### Get 方法

Go 不提供对 Get 和 Set 方法的自动支持。所以可以自己写相应的方法，但是，在 Get 方法的名字中加上 `Get` 是不符合语言习惯的，并且也没有必要。如果你有一个字段叫做 `owner`（首字母小写，不被导出），则 Get 方法应该叫做 `Owner`（首字母大写），而不是 `GetOwner`。Set 方法如果需要的话可以叫做 `SetOwner`，这些名字都很好读。

```go
owner := obj.Owner()
if owner != user {
    obj.SetOwner(user)
}
```

### 接口名

按照约定，单个方法的接口名使用方法名加上 `er` 后缀来命名，或者构造一个动名词，例如 `Reader`、`Writer`、`Formatter`、`CloseNotifier` 等等。有些特定的名字具有规范的签名和含义，为了避免混淆，不要为你的方法使用这些名字，除非它们具有相同的签名和含义。反过来说，如果你实现了一个方法跟这些众所周知的类型具有相同的含义，那应该使用相同的命名。特定的方法名称有 `Read`、`Write`、`Close`、`Flush`、`String` 等等。比如，转换成字符串的方法起名就应该是 `String()` 而不是 `ToString()`。

### 驼峰

按照约定，go 应该使用 **驼峰** (MixedCaps 或者 mixedCaps) 而不是下划线来书写多个单词的命名。

## 分号

类似于 C， Go 的语法规范是使用分号来终结语句的。但是与 C 不同的是，这些分号并不会在源码中出现。词法分析器会在扫描是使用简单的规则自动插入分号，因此源码文件中大部分是没有分号的。
规则是这样的，如果在换行之前的最后一个符号为一个标识符（包括像 int 和 float 这样的单词），一个基本的文字，例如数字或者字符串常量，或者如下的一个符号：

```go
break continue fallthrough return ++ == ) }
```

则 词法分析器总是会在符号之后插入一个分号。

一般来说，GO 程序只在 for 循环字句中使用分号用来分开初始化，条件和继续执行语句。分号也用于在一行中分开多条语句。
分号的插入规则导致的一个结果是，不能将控制结构的左大括号放在下一行。如果这样做，则会在大括号之前插入一个分号，这将带来一个意料之外的情况。

## 控制结构

### If

if 可以接受一个初始化语句，所以常见的写法如下：

```go
if err := file.Chmod(0664); err != nil {
    return err
}
```

### 重新声明和重新赋值

`:=` 是 go 中特有的短声明方式，在下面的代码中：

```go
f, err := os.Open(name)
...
d, err := f.Stat()
```

第一个语句声明了两个变量 `f` 和 `err`。经过一系列逻辑后，看起来像是又声明了 `d` 和 `err`。`err` 在两条语句中都出现了，这种重复是合法的： `err` 在第一条语句中被声明，而在第二条语句中只是被重新赋值。这意味着使用之前已经被声明过的 `err` 变量，只是给它赋了一个新的值。

在 `:=` 的声明中，变量 v 即使被声明过，也可以出现，但是前提是：

- 该声明和 `v` 已经有的声明在相同的作用域中（如果 v 已经在外面的作用域被声明了，则该声明会创建一个新的变量，而不是对原有的变量重新赋值）。
- 初始化中相应的值是可以被赋值给 v 的。
- 声明中至少有其他的一个变量被声明为一个新的变量。

针对第二条做个解释， 看如下代码：

```go
func test() int, int {
    return 0, 1
}
f, err := os.Open(name)

// 这一行是会报错的，err 在重新赋值的时候编译器检测到类型不是最开始初始化的 error 类型
result, err := test()
```

### For

go 的 for 循环统一了 for 和 while，而且没有 do-while 循环。有三种形式可用，只有第一种需要一个分号：

```go
// like C
for init; codition; post {

}

// 类似 while
for condition {

}

// 类似 for (;;)
for {

}
```

如果是在数组，切片，字符串 或者 map 上进行循环，或者从 channel 中进行读取，还可以使用 range 关键字来管理循环：

```go

for key, value := range oldMap {
    newMap[key] = value
}
```

如果只需要 range 的 key（第一项），则可以丢弃第二项：

```go
for key := range m {
    if key.expired() {
        delete(m, key)
    }
}
```

如果只需要 range 中的 value（第二项），可以使用空白标识符来丢弃第一个：

```go
sum := 0
for _, value := range array {
    sum += value
}
```

对于字符串， range 可以做更多的事情，通过解析 `UTF-8` 来拆分出 unicode 字符集中对应的码点（code point）。对于字符串中的汉字等一般都是两个或者两个以上的字节来存储的。通过此种方式可以轻松的找到一个字符对应的起始位置。错误的编码会消耗一个字节，产生一个替代的 `rune` U+FFFD。`rune` 是 Go 中的术语，用于指定一个 unicode 码点。对于下面的代码:

```go
// \x80 是一个非法的 UTF-8 编码，转换成二进制是 10000000 （8位），UTF-8 对于单字节不允许是 1开头的。
for pos, char := range "日本\x80語" {
    fmt.Printf("character %#U starts at byte position %d\n", char, pos)
}
```
输出结果为：

```go
// 可见，日占用了三个字节存储（指的是使用 UTF-8 的编码存储方式）
character U+65E5 '日' starts at byte position 0
character U+672C '本' starts at byte position 3
character U+FFFD '�' starts at byte position 6
character U+8A9E '語' starts at byte position 7
```

补充对于 unicode 和 UTF-8 的介绍：[字符编码笔记-阮一峰](http://www.ruanyifeng.com/blog/2007/10/ascii_unicode_and_utf-8.html)

### Switch

`switch` 后如果没有表达式，则默认对 `true` 匹配，因此，可以将 if-else-if-else 用 switch 改写。case 是按照从上到下的顺序进行求值，直到找到匹配的。case 还支持用逗号分隔的列表，例如：

```go
func shouldEscape(c byte) bool {
    switch c {
    case ' ', '?', '&', '=', '#', '+', '%':
        return true
    }
    return false
}
```

一个对字节切片进行比较的例子：

```go
// 按照字典序比较两个字节切片
// The result will be 0 if a == b, -1 if a < b, and +1 if a > b
func Compare(a, b []byte) int {
    for i := 0; i < len(a) && i < len(b); i++ {
        switch {
        case a[i] > b[i]:
            return 1
        case a[i] < b[i]:
            return 0
        }
    }
    switch {
    case len(a) > len(b):
        return 1
    case len(a) < len(b):
        return -1
    }
    return 0
}
```

### Type Switch

`switch` 可以用来获得一个接口变量的动态类型。switch 会使用类型断言的语法，在括号中使用关键字 (type)。举例如下：

```go
var t interface{}
t = functionOfSomeType()

switch t := t.(type) {
case bool:
    fmt.Printf("boolean %t\n", t)
}
case int:
    fmt.Printf("integer %t\n", t)
default:
    fmt.Printf("unexported type %T", t)
```

## 函数

### 多返回值

### 命名结果参数

### Defer

Go 的 `defer` 语句用来安排一个函数调用（延迟执行的函数）, 将在执行 defer 的函数的返回之前立即被调用。这是一种非常有效的处理方式当需要函数在返回的时候释放一些资源（比如关闭一个文件，解除锁等等）。

延迟一个函数调用，例如关闭一个文件有两个优点：第一，它保证你在函数结束时不会忘记关掉这个文件；第二， defer 语句写在打开文件的旁边，这比写在函数结尾结构更加清晰。

执行延迟函数（deferred function）的参数被评估是在 defer 语句执行的时候，而不是函数调用阶段。看下面的例子：

```go
// 这个例子将输出 4 3 2 1 0

for i := 0; i < 5; i++ {
    defer fmt.Printf("%d", i)
}
```

`defer` 函数是以后进先出（LIFO）的顺序被执行的， 所以上面例子的输出是 `4 3 2 1 0`。 `defer` 的一个更合理的例子是使用一个简单的方式来实现函数执行过程的追踪。下面是一个简单的例子：

```go
func trace(s string) {fmt.Println("entering:", s)}
func untrace(s string) {fmt.Println("leaving:", s)}

func a() {
    trace("a")
    defer untrace("a")
    // do something
}
```

实际上基于**延迟函数的参数评估是发生在 defer 语句的执行阶段而不是调用阶段** 这一事实，我们实现的更加优雅：

```go
func trace(s string) string {
    fmt.Println("entering:", s)
    return s
}

func untrace(s string) {
    fmt.Println("leaving:", s)
}

func a() {
    defer untrace(trace("a"))
    // do something
    fmt.Println("in a")
}

func b() {
    defer untrace(trace("b"))
    // do something
    fmt.Println("in b")
    a()
}

func main() {
    b()
}
```

输出结果为：

```
entering: b
in b
entering: a
in a
leaving: a
leaving: b
```

在 `panic` 和 `recover` 章节可以看到 `defer` 的另一个强大的用途。

## 数据

### 使用 new 分配内存

Go 有两个分配原语，内建函数 `new` 和 `make`。它们所做的事情有所不同，并且用于不同的类型。先说 `new`，它是一个分配内存的内建函数，但是不像其他语言的 `new`，它并不初始化内存，只是将其置零。也就是时候 new(T) 会为 T 类型分配一个被置零的存储，并且返回它的指针，一个类型为 *T 的值。也就是说，其返回一个指向新分配的T 类型的零值的指针。

由于 new 返回的内存是被置零的，这会有助于你将数据结构设计成每个类型的零值都可以使用，而不需要进一步初始化。这意味着，数据结构的用户可以使用 new 来创建数据，并且正确使用。例如 `bytes.Buffer` 的文档中说道，`Buffer` 的零值是一个可以使用的空缓存。类似的， `sync.Mutex` 没有显示的构造器和 `Init` 方法，`sync.Mutex` 的零值被定义位一个未锁定的互斥锁。

### 构造器和组合字面量

有时候零值不够好，那就需要一个初始化构造器，完成一些默认字段的初始化。

组合字面量可以用于简化类型的初始化，例如下面 *File 的初始化：

```go
func NewFile(fd int, name string) *File {
    if fd < 0 {
        return nil
    }
    f := File{fd, name, nil, 0}
    return &f
}
```

注意，函数里面 f 是一个局部变量，返回该变量的指针在 Go 里面是没有问题的，在函数返回之后，f 关键的存储依旧存在。实际上，使用组合字面量的地址也会在求值的时候（&f）分配一个新的实例，所以，可以将最后两行合并起来：

```go
return &File{fd, name, nil, 0}
```

使用只填入值的方式初始化要求每个值都必须存在，而且顺序固定。也可以通过 `field : value` 的形式，这样就不必初始化所有值，也不必按照固定的顺序。如果什么值都不传，new(File) 实际上与 `&File{}` 等价。

### 使用 make 分配内存

内建函数 make(T, args) 与 new(T) 用途不一样。它只用来创建 slice，map 和 channel，并且返回一个初始化的（不是零值），类型为 T 的值。之所以有所不同，是因为这三个类型背后象征着对使用前必须初始化的数据结构的引用。例如，slice 是一个包含 指向数组的指针，长度以及容量。在这些项被初始化之前，slice 都是 nil。所以，对于 slice，map 和 channel 来说，make 的作用就是初始化内部数据结构，并准备好可用的值。比如：

```go
make([]int, 10, 100)
```
代表分配一个长度为 100 的 int 数组，然后创建一个长度为 10， 容量为 100 的 slice，并指向数组的前 10 个元素。new([]int) 返回一个指向新分配的，被置零的 slice 结构体，即指向 nil 的值指针。

下面的例子展示了 `new` 和 `make` 的区别：

```go
// slice 的零值为 nil，所以 *p = nil, p 为指向 nil 的指针
var p *[]int = new([]int)
var v []int = make([]int, 100)

// Unnecessarily complex:
var p *[]int = new([]int)
*p = make([]int, 100, 100)

// Idiomatic:
v := make([]int, 100)

```

记住，`make` 只用于 map， slice 和 channel，并且不返回指针。要想获得一个显示的指针，使用 `new` 进行分配，或者显式的使用一个变量的地址。

### 数组

数组会固定元素的个数，是切片的底层基础，在规划内存的精细布局上很有用。数组有以下几个特点：

- 数组是值。将一个数组赋值给另一个变量会拷贝所有的元素。
- 注意在函数中传递一个数组，将收到一个数组的拷贝而不是它的指针。
- 数组的大小是其类型的一部分，类型 [10]int 和 [20]int 是不同的。

因此，如果需要在函数参数中使用数组，可以显式的传递一个指针：

```go
func Sum(a *[3]float64) (sum float64) {
    for _, V := range *a {
        sum += v
    }
    return
}

array := [...]float64{7.0, 8.5, 9.1}
x := Sum(&array)
```

### 切片

切片对数组封装，提供了一个更加通用的接口。除了像转换矩阵这样的程序，Go 中大多数都是通过切片而不是数组来完成的。
切片持有对底层数组的引用，如果将一个切片赋值给另一个，二者都引用了相同的底层数组。如果函数接收一个切片做参数，那么对切片的元素所做的改动，对于调用者是可见的，好比是传递了一个底层数组的指针。因此，下面的 `Read` 函数可以接收一个切片做参数，而不是一个指针和一个计数；切片的长度已经设定了要读取数组的上限。例如 `os` 包中 `File` 类型的 `Read` 方法：

```go
func (file *File) Read(buf []byte) (n int, err error)
```

该方法返回读取的字节数和一个错误值。读取一个大的缓冲 buf(100)的前 32 个字节可以这么写：

```go
buf := make([]byte, 100)
n, err := f.Read(buf[0:32]) 
```

切片只要符合底层数组的限制，切片的长度就可以进行改变。切片的容量，可以通过内建函数 `cap()` 来访问，可以告知切片的最大长度。下面的 `Append` 函数可以用来给切片添加数据，如果长度超过了切片容量的限制，切片将重新扩容，返回一个新的切片。代码如下：


```go
func Append(slice, data []byte) []byte {
    l := len(slice)
    if l + len(data) > cap(slice) {
        newSlice := make([]byte, ((l+len(data))*2)
        // copy
        copy(newSlice, slice)
        slice = newSlice
    }
    slice = slice[0:l+len(data)]
    copy(slice[l:], data)
    return slice
}
```

注意，最后必须返回 `slice`， 虽然 `Append` 可以修改 slice 中的元素，但是 slice 本身（持有 pointer,length,capacity 的运行时数据结构）还是按照值传递的。

### 二维切片

二维切片主要需要掌握其声明方式，先声明外层切片，然后 for 循环遍历声明内层切片，举例如下：

```go
picture := make([][]uint8, Ysize)
for i := range picture {
    picture[i] := make([]uint8, Xsize)
}
```

或者还可以转换成一维切片来使用，内层的所有切片引用一个底层切片，声明方式如下：

```go
picture := make([][]uint8, Ysize)
pixels := make([]uint8, Xsize*Ysize)
for i := range picture {
	picture[i], pixels = pixels[:XSize], pixels[XSize:]
}
```
### map

map 即为 散列表，其将一个类型（key）与另一个类型（value）相关联在一起。key 可以是任意定义了等于操作符的类型，例如整数，浮点数，字符串，接口（只要其动态类型支持等于操作）。切片不能作为 map 的key，因为没有定义等于操作（还有 func，map）。

map 的一些技巧：

```go
// 判断 map 中的 key 是否存在
_, present := timeZone[tz]
// 从 map 中删除某个 key
delete(timeZone, "PDT") 
```

### printing

### append

对于内建函数 append 的定义如下：

```go
func append(slice []T, elements ...T) []T
```

T 是一个占位符，代表任意给定类型。实际上，在 Go 中无法编写一个由调用者确定类型 T 的函数，这就是 append 变成内置函数的原因，它需要编译器的支持。

其实现大致与上面 `Append` 函数的实现相同，所以也必须返回一个 slice，因为底层数组可能会改变。

## 初始化

### 常量

Go 中的常量是在编译时被创建，即使被定义在函数中作为局部变量也是如此，其类型只能是数字，布尔，字符（rune），字符串。由于编译的限制，定义的表达式必须是能被编译器求值的常量表达式。例如 1 <<3 是常量表达式，但是 math.Sin(math.Pi/4)不是，因为函数调用 math.Sin 需要在运行时才发生。

```go
type ByteSize float64

const (
    _           = iota // ignore first value by assigning to blank identifier
    KB ByteSize = 1 << (10 * iota)
    MB
    GB
    TB
    PB
    EB
    ZB
    YB
)

// 可以将方法附加在用户定义的类型上，下面例子实现了自动化识别字节单位打印
func (b ByteSize) String() string {
    switch {
    case b >= YB:
        return fmt.Sprintf("%.2fYB", b/YB)
    case b >= ZB:
        return fmt.Sprintf("%.2fZB", b/ZB)
    case b >= EB:
        return fmt.Sprintf("%.2fEB", b/EB)
    case b >= PB:
        return fmt.Sprintf("%.2fPB", b/PB)
    case b >= TB:
        return fmt.Sprintf("%.2fTB", b/TB)
    case b >= GB:
        return fmt.Sprintf("%.2fGB", b/GB)
    case b >= MB:
        return fmt.Sprintf("%.2fMB", b/MB)
    case b >= KB:
        return fmt.Sprintf("%.2fKB", b/KB)
    }
    return fmt.Sprintf("%.2fB", b)
}

```
### 变量

变量可以跟常量一样的初始化，不过初始值可以为运行时计算的通用表达式。

```go
var (
    home   = os.Getenv("HOME")
    user   = os.Getenv("USER")
    gopath = os.Getenv("GOPATH")
)
```

### init 函数

每个源文件都可以定义自己的不带参数的 `init` 函数，用来初始化一些状态，实际上每个文件也可以有多个 `init` 函数。`init` 函数的一个常用方式是在真正执行前进行验证或者修复程序状态的正确性。

```go
func init() {
    if user == "" {
        log.Fatal("$USER not set")
    }
    if home == "" {
        home = "/home/" + user
    }
    if gopath == "" {
        gopath = home + "/go"
    }
    // gopath may be overridden by --gopath flag on command line.
    flag.StringVar(&gopath, "gopath", gopath, "override default GOPATH")
}
```

## 方法

任何命名类型（除了指针和接口）都可以定义方法，接收者（reciever）不必是一个结构体。

```go
type bird *string
// 定义这个方法编译器会报错：invalid receiver *bird (pointer or interface type)
func (b *bird) fly() {

}
```

以之前的 `ByteSlice` 为例，为其定义一个 `Append` 方法，为此，先声明一个用于绑定该方法的命名类型，然后将该类型的值作为方法的接收者，代码如下：

```go
type ByteSlice []byte
func (s ByteSlice) Append(data []byte) []byte {
    // 代码跟上面的 Append 方法相同
}
```
运行后会发现，这样还是需要返回更新后的切片，不然无法更新 slice 本身。因为 receiver 的类型是值类型，当使用 `s.Append(data)` 的时候，b 依旧是值传递，跟函数参数传递没什么区别。可以重新定义方法，这次将方法定义在指针上，代码如下：

```go
func (p *ByteSlice) Append(data []byte) {
    // *p 拿到指针对应的值，赋值给 slice
    slice := *p
    // 代码跟上面的 Append 方法相同

    // 操作完成后，将 slice 的指针赋值给 p
    *p = slice
}
```
如果将函数修改成标准方法 `Write` 的样子，如下：

```go
func (p *ByteSlice) Write(data []byte) (n int, err error) {
    slice := *p
    // Again as above.
    *p = slice
    return len(data), nil
}
```

那么 *ByteSlice 便会满足标准接口 io.Writer。我们可以很方便的将变量写入该类型中，代码如下：

```go
var b ByteSlice
fmt.Fprintf(&b, "This hour has %d days\n", 7)
```

注意，这里传递的是 ByteSlice 的地址，是因为只有 `*ByteSlice` 实现了 `io.Writer` 接口。上述代码会将 `This hour has 7 days\n` 这句字符串写入 b 这个变量中。在字节切片上使用 Write 的思想，是实现 `bytes.Buffer` 的核心。

总结一下，关于接收者对指针和值的规则是：值方法可以在指针和值上面调用，而指针方法只能在指针上调用。这是因为指针方法可以修改接收者，使用拷贝的值来调用，将会导致那些修改被丢弃。

## 接口和其他类型

### 接口

Go 中 的接口为指定对象的行为提供了一种方式，如果某个类型实现了接口的这组方法，那么它就实现了这个接口。

一个类型可以实现多个接口，举个例子，一个集合如果实现了 `sort.Interface` 接口，其中包含 `Len()`,`Less(i, j int)`, `Swap(i, j int)` ，那么它就可以通过程序包 `sort` 中的程序来进行排序，同时，它还可以实现 `String()` 方法，有一个自定义的 `formatter`。下面的 `Sequence` 实现了这些方法：

```go
type Sequence []int

func (s Sequence) Len() int {
    return len(s)
}

func (s Sequence) Less(i, j int) bool {
    return s[i] < s[j]
}

func (s Sequence) Swap(i, j int) {
    s[i], s[j] = s[j], s[i]
}

func (s Sequence) String() string {
    sort.Sort(s)
    str := "["
    for i, elem := range s {
        if i > 0 {
            str += " "
        }
        str += fmt.Sprint(elem)
    }
    return str + "]"
}
```

### 类型转换

`Sequence` 的 String 方法重复了 `Sprint` 对切片所做的工作，如果我们在调用 `Sprint` 之前，将 `Sequence` 转换成普通的 `[]int`, 那么就可以直接共享底层的 String() 实现:

```go
func (s Sequence) String() string {
    sort.Sort(s)
    return fmt.Sprint([]int(s))
}
```

如果我们忽略类型名字，这两个类型（`Sequence` 和 `[]int`） 是相同的，所以在它们之间的转换是合法的，该转换不会创建新的值，只不过是暂时使得现有的值具有一个新的类型。（有其他的合法转换，像整数转成浮点数是会创建一个新值的）将表达式的类型进行转换来访问不同的方法集合，这在 Go 中是常见的一种用法。例如，我们可以使用已有类型 `sort.IntSlice` 来将整个例子简化成这样：

```go
type Sequence []int

func (s Sequence) String() string {
    sort.IntSlice(s).sort()
    return fmt.Sprint([]int(s))
}
```

现在，`Sequence` 并没有实现多个接口（排序和打印），相反的，我们利用了能够将数据项转换成多个类型 （`Sequence`，`sort.IntSlice`, `[]int`） 的能力，每个类型完成工作的一部分。这在实际中不常见，但是非常有效。

### 接口转换和类型断言

`type switch` 是转换的一种形式，它接收一个接口，遍历 switch 上的每个 case，将其转换成符合的类型。下面是个简单的例子：

```go
type Stringer interface {
    String() string
}

var value interface{} // Value provided by caller.
switch str := value.(type) {
case string:
    return str
case Stringer:
    return str.String()
}
```

`value` 是一个 interface{}， 可以存储任意类型。switch 中的 第一个 case 判断该类型是否能转换成 `string`， 如果可以，直接返回。第二个 case 检查存储的类型是否能转成一个 `Stringer` 接口，如果可以，调用其 `String()` 方法。

如果我们只关注是否仅仅为一种类型，可以使用 `value.(typeName)`，例如：

```go
str := value.(string)
```
但是，如果这个值不是 `string` 类型，上面的代码将 panic 产生一个运行时错误。为了保证能正确判断，可以使用 `comma, ok` 的语法去测试，这便是类型断言：

```go
str, ok := value.(string)
if ok {
    fmt.Printf("string value is: %q\n", str)
} else {
    fmt.Printf("value is not a string\n")
}
```
如果类型断言失败，`str`将仍然存在并且属于字符串类型，但是它的值为零值（一个空字符串）。

### 概述

如果一个类型只是用来实现接口，并且除了该接口以外没有其他被导出的方法，那就不需要导出整个类型。只导出接口即可清楚的表明其重要的是行为，而不是实现。它还避免了需要在通用方法的每个实例上重复写文档。在这种情形下，构造器应该返回一个接口而不是实现。比如这个例子：在 hash 库中，`crc32.NewIEEE` 和 `adler32.New` 两个构造函数都返回了其接口类型 `hash.Hash32`。在Go程序中将 `CRC-32` 算法替换为 `Adler-32` 只需更改构造函数调用即可；其余代码不受算法更改的影响。

### 接口和方法

几乎所有的类型都可以附加方法，所以，几乎所有的类型都可以实现一个接口。http 包中定义了 `Handler` 接口，所有实现该接口的对象都可以处理 http 请求。

```go
type Handler interface {
    ServeHTTP(ResponseWriter, *Request)
}
```
`ResponseWriter` 也是一个接口，提供一组方法返回对客户端的响应，`*Request` 是一个结构体指针。

下面是一个对页面访问次数计数的处理函数，将 `ctr` 对象注册到 http 的路由中就实现了对 `/` 访问的处理逻辑：

```go
import "net/http"
// Simple counter server.
type Counter struct {
    n int
}

func (ctr *Counter) ServeHTTP(w http.ResponseWriter, req *http.Request) {
    ctr.n++
    fmt.Fprintf(w, "counter = %d\n", ctr.n)
}

ctr := new(Counter)
http.Handle("/counter", ctr)
```
但是为什么要使得 `Counter` 作为一个结构体呢，实际上一个 int 就够了(注意 receiver 需要是一个指针，以便可以做增加操作)，代码如下：

```go
type Counter int

func (ctr *Counter) ServeHTTP(w http.ResponseWriter, req *http.Request) {
    *ctr++
    fmt.Fprintf(w, "counter = %d\n", *ctr)
}
```

如果你的程序具有某个内部状态，当页面被访问时需要被告知，那么该如何？可以将一个 `channel` 绑定到网页上。

```go
// A channel that sends a notification on each visit.
// (Probably want the channel to be buffered.)
type Chan chan *http.Request

func (ch Chan) ServeHTTP(w http.ResponseWriter, req *http.Request) {
    ch <- req
    fmt.Fprint(w, "notification sent")
}
```

最后，比方说我们想在/args上展现我们唤起服务二进制时所使用的参数。这很容易编写一个函数来打印参数。

```go
func ArgServer() {
    fmt.Println(os.Args)
}
```

我们该如何转换成 http 服务呢？我们可以定义一个 `ArgServer` 的，就像上面的做法一样。不过有一种更干净的方式，那就是定义一个函数类型，并为其编写方法：

```go
// The HandlerFunc type is an adapter to allow the use of
// ordinary functions as HTTP handlers.  If f is a function
// with the appropriate signature, HandlerFunc(f) is a
// Handler object that calls f.
type HandlerFunc func(ResponseWriter, *Request)

// ServeHTTP calls f(c, req).
func (f HandlerFunc) ServeHTTP(w ResponseWriter, req *Request) {
    f(w, req)
}
```

`HandlerFunc` 为一个类型，其具有一个方法 `ServeHTTP`，所以该类型值可以为 HTTP 请求提供服务。看下该方法的实现：接收者为一个函数 `f`，并且在 `ServeHTTP` 方法中调用了f。这看起来可能有些怪异，但是这与接收者为 `channel`，方法在 `channel` 上进行发送数据并无差别。

要将 `ArgServer` 放到 HTTP 服务中，需要定义该函数符合 HandlerFunc 类型：

```go
func ArgServer(w http.ResponseWriter, req *http.Request) {
    fmt.Fprintln(w, os.Args)
}
```

`ArgServer` 现在具有和 `HandlerFunc` 相同的签名，所以其可以被转换为那个类型，然后访问它的方法，就像我们将 `Sequence` 转换为 `IntSlice`，来访问 `IntSlice.Sort` 一样：

```go
http.Handle("/args", http.HandlerFunc(ArgServer))
```

当有人访问页面 `/args` 时，在该页上注册的 `handler` 就具有值 `ArgServer`和类型 `HandlerFunc`。HTTP 服务将会调用该类型的方法 `ServeHTTP`，将 `ArgServer` 作为接收者，其将转而调用 `ArgServer`（通过在 `HandlerFunc.ServeHTTP` 内部调用f(c, req)）。然后参数就被显示出来了。

## 空白标识符

主要用途在两个方面：

- 
- 导入一个包如果未被使用的话会导致编译错误，但是有时候导入这个包只是为了调用内部的 init 函数，不需要使用它内部的变量，这时候可以给包的名字置为空白标识符。

### 在多赋值语句中使用空白标识符

在多赋值语句中，如果某个值不需要被使用，可以将其置为 `_`。

### 未使用的 imports 和变量

如果在程序中导入了一个包或者声明了一个变量却没有使用的话，会导致编译错误。因为导入未使用的包不仅会使得程序体积变大，而且降低变异效率。初始化一个变量却不使用，轻则造成对计算的浪费，重则导致一些 bug。但当程序处于开发阶段的时候，会存在暂时没有被使用或导入的包和变量，如果为了程序编译通过而将它们删除，那么后续开发需要使用的时候，又得重新添加，这非常麻烦。空白标识符可以为上述场景提供解决方案。

比如下面的一个例子：

```go
package main

import (
    "fmt"
    "io"
    "log"
    "os"
)

var _ = fmt.Printf // For debugging; delete when done.
var _ io.Reader    // For debugging; delete when done.

func main() {
    fd, err := os.Open("test.go")
    if err != nil {
        log.Fatal(err)
    }
    // TODO: use fd.
    _ = fd
}
```

### import 的副作用

有时候，导入一个包仅仅是为了引入它的副作用，而不是真正使用它们。例如， `net/http/pprof` 包会在其导入阶段调用 `init` 函数，该函数注册 http handler 来提供调试信息。这个包中的确还有其他可以导出的 API，但是大部分情况下不需要使用。所以，这种为了实现仅为副作用而导入包的操作，可以在导入语句中使用空白标识符`_`来进行重命名，代码如下：

```go
import _ "net/http/pprof"
```

这一种非常干净的导入包的方式，由于在当前文件中，被导入的包是匿名的，因此你无法访问包内的任何符号。

### 接口检查

在 Go 中，一个类型不需要明确的声明它实现了某个接口，只要它实现了该接口所定义的全部方法即可。在实际中，多数接口的类型转换和检查都是在编译阶段静态完成的。例如将 `*os.File` 类型传入一个接受 `io.Reader` 类型参数的函数中，只有在 `*os.File` 实现了 `io.Reader` 接口才行。

但是也有一些接口检查是发生在运行时的。一个例子是来自 `encoding/json` 包内定义的 `Marshaler` 接口。当 JSON 编码器接收到一个实现了 `Marshaler` 接口的参数时，就调用该参数的 marshaling 方法来代替标准方法处理 JSON 编码。编码器利用类型断言机制在运行时做类型检查：

```go
m, ok := val.(json.Marshaler)
```
假设我们只想知道某个类型是否实现了某个接口，而实际上并不需要使用这个接口本身，那么可以使用空白标识符来忽略类型断言的返回值：

```go
if _, ok := val.(json.Marshaler); ok {
    fmt.Printf("value %v of type %T implements json.Marshaler\n", val, val)
}
```

## 类型内嵌

## 并发

### 通过通信来共享

由于需要考虑很多繁琐的细节以保证对共享变量的正确访问，使得并发变成在很多情况下都会变得异常复杂。Go 语言鼓励采用一种不同的方法，即把共享变量通过 channel 相互传递（事实上，并没有真正在不同的线程间共享数据）。在任意时刻，仅有一个 goroutine 可以访问某一个变量。数据竞争问题在设计上就被规避了。这就是 GO 的并发设计原则：不要以共享内存的方式来通信，应该通过通信来共享内存。（CSP 模型）

### goroutines

goroutine 非常轻量，在多个并发的 goroutine 间资源是共享的。创建的开销不会比栈空间的分配的开销大多少。
举例如下：

```go

go list.Sort()  // run list.Sort concurrently; don't wait for it.

func Announce(message string, delay time.Duration) {
    go func() {
        time.Sleep(delay)
        fmt.Println(message)
    }()  // Note the parentheses - must call the function.
}
```
### channels

channel 也是通过 make 来分配的，其返回值实际上是指向底层数据结构的一个引用。如果在创建channel时提供一个可选的整型参数，会设置该channel的缓冲区大小。该值缺省为0，用来构建默认的`无缓冲channel`，也称为`同步channel`。

```go
ci := make(chan int) // unbuffered channel of intergers
cj := make(chan int, 0) // unbuffered channel of intergers
cs := make(chan *os.File, 100) // // buffered channel of pointers to Files
```

`无缓冲 channel` 使得`通信--值的交换--和同步禁止组合`，共同保证了两个 groutine 的运行处于可控的状态。

下面的例子通过 channel 可以让发起操作的 goroutine 等待排序操作的完成。表示 channel 的流向用一个左箭头 `<-`

```go
c := make(chan int)
go func () {
    list.sort()
    c <- 1
}
doSomethingForAwhile()
<-c
```
因为是无缓冲 channel，接收方会一直阻塞到数据到来，发送方也会一直阻塞到接收方将数据取走。如果是有缓存 channel，发送方会一直阻塞知道数据被拷贝到缓冲区；如果缓冲区已满，则发送方只能在接收方取走数据后才能从阻塞状态恢复。

一个带缓冲的 channel 可以像一个信号量一样被使用。举个限制吞吐率的例子。在这个例子中，即将进来的请求被传递给 `handle` 函数，该函数将发送一个值进入 channel，处理完成后，再从 channel 中取出一个值。channel 的容量限制了并发进程的数量。实现代码如下：

```go
var sem := make(chan int, MaxOutstanding)

func handle(r *Request) {
    sem <- 1
    process(r)
    <-sem
}

func Serve(queue chan *Request) {
    for {
        req := <-queue
        go handle(req)
    }
}
```
一旦 MaxOutstanding 达到上线，goroutine 将阻塞，直到有请求被处理完成。但是这个设计有个问题，它会为每个请求都创建一个 goroutine，一旦有大量的请求瞬间进来，将会创建大量的 goroutine，虽然只有 MaxOutstanding goroutine 处在运行中，但是仍然可能会消耗大量的资源。所以应该控制 goroutine 数量的创建，修改后的代码如下：

```go
func Serve(queue chan *Request) {
    for req := range queue {
        sem <- 1
        go func() {
            process(req)
            <-sem
        }()
    }
}
```

这一版就好很多了，但是还有个 bug 是由于 for 循环中的变量 `req` 在每次迭代过程中是被共享的。因此我们需要确保 `req` 在每个 goroutine 中是唯一的。可以通过将这个值作为 goroutine 的参数来传递：

```go
func Serve(queue chan *Request) {
    for req := range queue {
        sem <- 1
        for func(req *Request) {
            process(req)
            <-sem
        }(req)
    }
}
```

也可以使用一个同名变量来保存该值, `req := req` 虽然看起来很奇怪，但是在 go 中是合法的而且惯用的：

```go
func Serve(queue chan *Request) {
    for req := range queue {
        req := req // Create new instance of req for the goroutine.
        sem <- 1
        go func() {
            process(req)
            <-sem
        }()
    }
}
```

另外一种有效的管理资源的方式是启动固定处理 `handle` 函数的 goroutine 数。每个 Goroutine 都直接从 queue 中读取请求，这个固定的数值就是同时指定 `process` 的最大并发数。 代码如下：

```go
func handle(queue chan *Request) {
    for r := range queue {
        process(r)
    }
}

func Serve(clientRequest chan *Request, quit chan bool) {
    for i := 0; i < MaxOutstanding; i++ {
        go handle(clientRequest)
    }
    <-quit
}
```

### channels 中使用 channel

Go 中一个最重要的特点是 channel 是一流的类型，能够跟其他类型一样被分配，被传递。一个常见的用途是用来实现安全的并行的多路复用（demultiplexing）。

还是上面的例子，定义 Request 的结构体如下：

```go

type Request struct {
    args []int
    f func([]int) int
    resultChan chan int
}
```
客户端提供了一个方法和参数，以及一个 channel 用来接收响应

```go
func sum(a []int) (s int) {
    for _, v := range a {
        s += v
    }
    return
}

request := &Request{[]int{3, 4, 5}, sum, make(chan int)}
clientRequests <- request
fmt.Printf("answer: %d\n", <-request.resultChan)
```
在服务端，处理函数仅仅是运行函数，然后将值返回：

```go
func handle(queue chan *Request) {
    for req := range queue {
        req.resultChan <- req.f(req.args)
    }
}
```
这就是一个限制速率，并行，而且无阻塞的 rpc 系统的框架原型。

### 并行

 channel + goroutine 的另一个应用是CPU多核心计算的并行化，如果一个计算可以被划分为可以独立执行的块，那么它就是可以并行的，每个块完成够，使用一个 channel 发送信号通知。

 举个例子，需要在一个 Vector 中并行的计算其 items，理想状态下，对每个 items 的操作都是独立的。

 ```go
type Vector []float64

// Apply the operation to v[i], v[i+1] ... up to v[n-1].
func (v Vector) DoSome(i, n int, u Vector, c chan int) {
    for ; i < n; i++ {
        v[i] += u.Op(v[i])
    }
    c <- 1    // signal that this piece is done
}
```
我们按照 CPU 核心数来启动 goroutine 的数量，它们可以以任意顺序完成，这无关紧要。在启动所有 goroutine 之后，我们通过排空 channel 来确定所有的 goroutine 都运行完成，代码如下：

```go
const numCPU = 4 // number of CPU cores

func (v Vector) DoAll(u Vector) {
    c := make(chan int, numCPU)  // Buffering optional but sensible.
    for i := 0; i < numCPU; i++ {
        go v.DoSome(i*len(v)/numCPU, (i+1)*len(v)/numCPU, u, c)
    }
    // Drain the channel.
    for i := 0; i < numCPU; i++ {
        <-c    // wait for one task to complete
    }
    // All done.
}
```

### leaky buffer

名字不知道该怎么翻译，就保持原名了，很多人翻译成缓冲区泄露明显是错的。实际上是一个可重用的缓冲区模型。它是从 rpc 框架抽象出来的一个例子。客户端从某些源（可能是网络）循环接收数据，为了避免频繁的分配释放内存缓冲，程序在内部实现了一个空闲链表，并用一个 Buffer 指针型的 channel 将其封装。当该 channel 为空的时候，程序为其 new 一个新的 buffer 对象，一旦缓冲就绪，它就会被 `serverChan` 发送给服务端。

客户端代码：

```go
var freeList = make(chan *Buffer, 100)
var serverChan = make(chan *Buffer)

func client() {
    for {
        var b *Buffer
        // Grab a buffer if available; allocate if not.
        select {
        case b = <-freeList:
            // Got one; nothing more to do.
        default:
            // None free, so allocate a new one.
            b = new(Buffer)
        }
        load(b)              // Read next message from the net.
        serverChan <- b      // Send to server.
    }
}
```

服务端代码：

```go
func server() {
    for {
        b := <-serverChan    // Wait for work.
        process(b)
        // Reuse buffer if there's room.
        select {
        case freeList <- b:
            // Buffer on free list; nothing more to do.
        default:
            // Free list full, just carry on.
        }
    }
}
```
客户端会尝试从空闲链表freeList中获取Buffer对象；如果没有可用对象，则分配一个新的。服务器端会将用完的Buffer对象 b 加入到空闲链表freeList中，如果链表已满，则将b丢弃，垃圾收集器会在未来某个时刻自动回收对应的内存单元。

## 错误处理

错误 error 是一个内置的接口, 只要实现了该接口，均可将其当做是 `error` 对象。这使得可以定义任意的结构体来描述错误，提供更详细的上下文，非常方便。

```go
type error interface {
    Error() string
}
```

下面的例子来自标准包，定义了 `PathError` 结构体用来描述文件路径错误
```go
// PathError records an error and the operation and
// file path that caused it.
type PathError struct {
    Op string    // "open", "unlink", etc.
    Path string  // The associated file.
    Err error    // Returned by the system call.
}

func (e *PathError) Error() string {
    return e.Op + " " + e.Path + ": " + e.Err.Error()
}
```

调用 `Error()` 方法后的返回的结果如下：

```go
open /etc/passwx: no such file or directory
```

### panic

内建函数 `panic` 用来床架一个运行时错误并结束当前程序。该函数接受一个任意类型的参数，并在程序挂掉之前打印该参数内容，通常我们会选择一个字符串作为参数。在实际的 library 函数设计中，应该尽量避免使用 panic，如果程序错误可以以某种方式绕过，那么最好还是继续执行而不是整个程序退出。不过还是有一些反例的，比如说一些 library 确实没办法正确的完成初始化，那么 `panic` 是合理的。比如下面这种代码：

```go
var user = os.Getenv("USER")

func init() {
    if user == "" {
        panic("no value for $USER")
    }
}
```

### recover

对于一些隐式的运行时错误，如果切片索引越界，类型断言错误等情形下， `panic` 方法就会被调用，它将立即中断当前函数的执行，并展开当前 goroutine 的调用栈，依次执行之前注册的 defer 函数。当栈展开操作到达该 goroutine的栈顶端的时候，程序将终止。但这是仍然可以使用 go 内建的 `recover` 函数重新获得 goroutine 的控制权，并将程序恢复到正常执行的状态。

调用 `recover` 方法会终止栈展开操作并返回之前传递给 `panic` 方法的那个参数。由于在栈展开过程中，只有 `defer` 型函数会被执行，因此 `recover` 的调用必须置于 `defer` 函数内才有效。

在下面的示例应用中，调用recover方法会终止server中失败的那个Goroutine，但server中其它的Goroutine将继续执行，不受影响。

```go
func server(workChan <-chan *work) {
    for work := range workChan {
        go safelyDo(work)
    }
}
func safelyDo(work *Work) {
    defer func() {
        if err := recover(); err != nil {
            log.Println("work failed:", err)
        }
    }()
    do(work)
}
```

在这里例子中，如果`do(work)`调用发生了 panic，则其结果将被记录且发生错误的那个 Goroutine 将干净的退出，不会干扰其他 Goroutine。你不需要在 defer 指示的闭包中做别的操作，仅需调用 recover 方法，它将帮你搞定一切。

让我们来看下面这个例子，它是 `regexp` 包的一个简化版本，它通过调用 `panic` 并传递一个局部错误类型来报告“解析错误”（Parse Error）。下面的代码包括了 Error 类型定义，error 处理方法以及 Compile 函数:

```go
// Error is the type of a parse error; it satisfies the error interface.
type Error string
func (e Error) Error() string {
    return string(e)
}

// error is a method of *Regexp that reports parsing errors by
// panicking with an Error.
func (regexp *Regexp) error(err string) {
    panic(Error(err))
}

// Compile returns a parsed representation of the regular expression.
func Compile(str string) (regexp *Regexp, err error) {
    regexp = new(Regexp)
    // doParse will panic if there is a parse error.
    defer func() {
        if e := recover(); e != nil {
            regexp = nil    // Clear return value.
            err = e.(Error) // Will re-panic if not a parse error.
        }
    }()
    return regexp.doParse(str), nil
}
```

如果 `doParse` 方法触发 `panic`，错误恢复代码会将返回值置为 `nil`，因为 `defer` 函数可以修改命名的返回值变量；然后，错误恢复代码会对返回的错误类型进行类型断言，判断其是否属于 `Error` 类型。如果类型断言失败，则会引发运行时错误，并继续进行栈展开，最后终止程序，这个过程将不再会被中断。类型检查失败可能意味着程序中还有其他部分触发了 `panic`，如某处存在索引越界访问等，因此，即使我们已经使用了 `panic` 和 `recover` 机制来处理解析错误，程序依然会异常终止。

有了上面的错误处理过程，调用 `error` 方法（由于它是一个类型的绑定的方法，因而即使与内建类型 error 同名，也不会带来什么问题，甚至是一直更加自然的用法）使得“解析错误”的报告更加方便，无需费心去考虑手工处理栈展开过程的复杂问题。

```go
if pos == 0 {
    re.error("'*' illegal at start of expression")
}
```

上面这种模式的妙处在于，它完全被封装在模块的内部，`Parse` 方法将其内部对 `panic` 的调用隐藏在 `error` 之中；而不会将 `panic` 信息暴露给外部使用者。这是一个设计良好且值得学习的编程技巧。

顺便说一下，当确实有错误发生时，我们习惯采取的`重新触发panic`（re-panic）的方法会改变 `panic` 的值。但新旧错误信息都会出现在崩溃报告中，引发错误的原始点仍然可以找到。所以，通常这种简单的重新触发 `panic` 的机制就足够了。所有这些错误最终导致了程序的崩溃，但是如果只想显示最初的错误信息的话，你就需要稍微多写一些代码来过滤掉那些由重新触发引入的多余信息。

## 一个 web server 的例子　
