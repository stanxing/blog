# flag 包源码解析

本文代码和测试均基于 golang 1.13.4。

## 用法

flag 包的主要用途是用来解析命令行参数。根据文档中的介绍，使用方式也很简单，例如定义一个命令行参数 `log-level`, 类型是 int，实现代码如下：

```go
// 通过下面命令即可传入命令行参数
// go run main.go --log-level=2

import "flag"

func main() {
    // flag.Int 的三个参数含义分别是：命令行参数名称，命令行参数默认值，命令行使用帮助
    logLevel := flag.Int("log-level", 1, "help message for log level")
}
```

这里值得注意的是，代码 `flag.Int()` 的返回值是一个指针，实际上包里所有定义参数类型的方法都返回的是指针，所以如果需要后面的代码中使用 `logLevel`，应该使用 `*logLevel` 来获取该变量的值。不过 flag 包中也提供了第二种方式来定义命令行参数，代码如下：

```go
var logLevel int
// 参数含义同上，只不过函数增加了一个参数存放要定义的变量的指针
// 这行代码会将命令行参数解析到的值或者默认值绑定到变量 logLevel 上
flag.IntVar(&flagVar, "log-level", 1, "help message for log level")
```

在定义完所有的参数后，使用 `flag.Parse()` 即可将所有的参数解析到对应的变量里，当然在不报错的情况下，报错的情况另行分析。

在命令行中，`flag` 包支持以下几种命令参数写法的解析：

```shell
-flag / --flag // 只支持 boolean 类型，意味着 -flag=true
-flag=x / --flag=x
-flag x / --flag x // 这种类型不允许 boolean 类型使用
```

需要注意的是：

- 命令行参数之前使用一个中划线或者两个中划线的形式是等价的
- `-flag x` 这种形式不支持 boolean 类型，根据文档中的介绍，如果想要设置，应该显式的使用 `-flag=false` 来设置。
- flag 解析停止在第一个非 `-` 开头的参数或者在终端终止符 `--` 之后结束。
- `1, 0, t, f, T, F, true, false, TRUE, FALSE, True, False` 都可以作为 boolean 类型。

### 为什么 boolean 类型不支持 `--flag x` 的形式

当读文档看到整个限制时，第一眼是感到疑惑，首先看 godoc 中的解释：

```
-flag x  // non-boolean flags only

One or two minus signs may be used; they are equivalent. The last form is not permitted for boolean flags because the meaning of the command

cmd -x *

where * is a Unix shell wildcard, will change if there is a file called 0, false, etc. You must use the -flag=false form to turn off a boolean flag.
```

官方中写到原因是因为一个命令 `cmd -x *` 中的最末尾的参数可能是一个文件，假设整个文件名称叫做 `false` 和 `0`，那么就可能造成解析错误。官方这个解释给的挺牵强，我并没有看懂，恰好在 [go 官方 issue ](https://github.com/golang/go/issues/22961)中搜到了相关的讨论，拿出来做个分享：

- 如果 boolean 类型总是需要设置一个值，那么就要写成 `cmd -boolflag true *` 或者 `cmd -boolflag=true *` 这种样式，但是这种样式不是人们所习惯的，人们习惯直接 `-boolflag` 就代表 `true`。
- 但是同时要支持 `-boolflag` 和 `-boolflag x` 的话，`-boolflag` 到底是代表 `true` 还是 `x`，就要看 `x` 的值，如果它是个 bool，那么就代表 `x`，如果不是，它就代表 `true`。这样是会有歧义的而且是危险的。
- 对于非 boolean 类型来说，`-nonboolflag x` 后面肯定要跟一个值，所以不存在歧义。
- issue 中还提供了一个非常好的例子来解释，比如 `ls -l false`，它会列出叫做 false 文件的属性，而不是设置 -l 的值为 false。

该 issue 后面还讨论了很多，我这里只截取了官方对这种行为的解释，我个人认为是可以理解的，毕竟 golang 要作为语言平台来兼容所有的情况，而不是应用程序层面。

## 数据结构

### Flag struct

Flag 整个结构体定义如下，它代表着一个命令行参数实例，其中 `Name`, `Usage` 很好理解，注意 `DefValue` 说的的默认值并不是函数 `flag.Int()`中传入的那个默认值，是指绑定变量的实际值的字符串形式。最重要的便是 `Value` 这个数据结构，其类型是一个接口。`Flag` 这个结构体便是通过这个接口做到了存储任何实现了 `Value` 接口的数据类型的值。

```go
// A Flag represents the state of a flag.
type Flag struct {
	Name     string // name as it appears on command line
	Usage    string // help message
	Value    Value  // value as set
	DefValue string // default value (as text); for usage message
}

// Value is the interface to the dynamic value stored in a flag.
// (The default value is represented as a string.)
//
// If a Value has an IsBoolFlag() bool method returning true,
// the command-line parser makes -name equivalent to -name=true
// rather than using the next command-line argument.
//
// Set is called once, in command line order, for each flag present.
// The flag package may call the String method with a zero-valued receiver,
// such as a nil pointer.
type Value interface {
	String() string
	Set(string) error
}
```

`Value` 接口很简单，只有 `String()` 和 `Set()` 两个方法，通过看一组例子就明白 flag 包是如何做到的，并且据此我们该如何实现自定义的参数类型。

下面这段代码是 flag 包中绑定 int 类型变量的实现，首先定义了 int 类型的别名 `intValue`，主要是为了对其实现 `Value` 的接口方法，这样 intValue 类型的值便能存储到 `Flag` 中。注意，这里是`intValue 指针` 实现了接口，并不是 `intValue` 值类型实现的。`String()` 方法的实现很简单，就是将该 int 变量转换成字符串，实际用在了打印帮助的信息时候；`Set()` 方法是将命令行参数字符串解析成 int 类型，并和给定的变量绑定，完成赋值的目的。

```go
// -- int Value
type intValue int

func (i *intValue) Set(s string) error {
	v, err := strconv.ParseInt(s, 0, strconv.IntSize)
	if err != nil {
		err = numError(err)
	}
	*i = intValue(v)
	return err
}

func (i *intValue) Get() interface{} { return int(*i) }

func (i *intValue) String() string { return strconv.Itoa(int(*i)) }
```

### FlagSet struct

顾名思义，`FlagSet` 就是一个存储所有命令行参数的集合，其数据结构如下：

```go
// A FlagSet represents a set of defined flags. The zero value of a FlagSet
// has no name and has ContinueOnError error handling.
type FlagSet struct {
	// Usage is the function called when an error occurs while parsing flags.
	// The field is a function (not a method) that may be changed to point to
	// a custom error handler. What happens after Usage is called depends
	// on the ErrorHandling setting; for the command line, this defaults
	// to ExitOnError, which exits the program after calling Usage.
	Usage func()

	name          string
	parsed        bool
	actual        map[string]*Flag
	formal        map[string]*Flag
	args          []string // arguments after flags
	errorHandling ErrorHandling
	output        io.Writer // nil means stderr; use out() accessor
}

// These constants cause FlagSet.Parse to behave as described if the parse fails.
const (
	ContinueOnError ErrorHandling = iota // Return a descriptive error.
	ExitOnError                          // Call os.Exit(2).
	PanicOnError                         // Call panic with a descriptive error.
)
```

接下来对照着结构体解释下各字段的含义：
- `Usage` 是一个 function 类型，意思是当解析报错的时候，用来打印报错信息，具体的实现可以参考文章后面。
- `name` 代表该 `FlagSet` 的名称，值为 `os.Args[0]` 的结果，即执行文件的完整路径。
- `parsed` 标识是否被解析
- `actual` 类型是一个 Flag 集合，代表实际从命令行参数中解析出来的参数集合。
- `formal` 类型也是一个 Flag 集合，代表代码中定义的默认的参数集合。（一般实际的参数会小于或等于默认定义的参数）
- `errorHandling` 其类型实际是个枚举值，参见上面代码描述，默认的 FlagSet 中该值为 `ExitOnError`
- `output`

### 解析过程

以解析一个 int 类型为例，当我们在代码中写下下面两行代码时，便完成了命令行参数 `log-level` 和代码中的 int 变量 `logLevel` 的绑定。我们通过源码来分析下 flag 包是怎么实现的：

```go
import "flag"
logLevel := flag.Int("log-level", 1, "help message for log level")
flag.Parse()
```

- 首先，在 `import "flag"` 包的过程中，执行了包中的变量声明和 `init()` 函数。`CommandLine` 变量被实例化为了一个 `FlagSet` 实例。

```go
// CommandLine is the default set of command-line flags, parsed from os.Args.
// The top-level functions such as BoolVar, Arg, and so on are wrappers for the
// methods of CommandLine.
var CommandLine = NewFlagSet(os.Args[0], ExitOnError)

// NewFlagSet returns a new, empty flag set with the specified name and
// error handling property. If the name is not empty, it will be printed
// in the default usage message and in error messages.
func NewFlagSet(name string, errorHandling ErrorHandling) *FlagSet {
	f := &FlagSet{
		name:          name,
		errorHandling: errorHandling,
	}
	f.Usage = f.defaultUsage
	return f
}

func init() {
	// Override generic FlagSet default Usage with call to global Usage.
	// Note: This is not CommandLine.Usage = Usage,
	// because we want any eventual call to use any updated value of Usage,
	// not the value it has when this line is run.
	CommandLine.Usage = commandLineUsage
}
```

- 执行 `flag.Int()` 方法时，调用了 `CommandLine.Int()` 方法，整个方法很简单，就是使用 `new` 关键词分配内存空间，创建了一个 int 类型的零值，返回指针 `p`， 又调用了 `f.IntVar()` 使用 `newIntValue` 函数将默认值和 p 指针绑定， 注意 int 被强转成了 intValue，此时 p 是指向默认值的指针。

```go
// Int defines an int flag with specified name, default value, and usage string.
// The return value is the address of an int variable that stores the value of the flag.
func Int(name string, value int, usage string) *int {
	return CommandLine.Int(name, value, usage)
}

// Int defines an int flag with specified name, default value, and usage string.
// The return value is the address of an int variable that stores the value of the flag.
func (f *FlagSet) Int(name string, value int, usage string) *int {
	p := new(int)
	f.IntVar(p, name, value, usage)
	return p
}

// IntVar defines an int flag with specified name, default value, and usage string.
// The argument p points to an int variable in which to store the value of the flag.
func (f *FlagSet) IntVar(p *int, name string, value int, usage string) {
	f.Var(newIntValue(value, p), name, usage)
}

func newIntValue(val int, p *int) *intValue {
	*p = val
	return (*intValue)(p)
}
```

- 接着又调用了 `f.Var()` 函数，将该 int 类型的值存入 `Flag` 实例中，其中 `Flag` 实例中的 `DefValue` 存入了默认值的字符串表示。
其次检查命令行参数名称是否在 `f.formal` 整个 map 中存在，如果存在，报错；否则将该 `Flag` 实例插入到 `f.formal` 中。至此，初始化 int 变量默认值执行完毕。

```go
// Var defines a flag with the specified name and usage string. The type and
// value of the flag are represented by the first argument, of type Value, which
// typically holds a user-defined implementation of Value. For instance, the
// caller could create a flag that turns a comma-separated string into a slice
// of strings by giving the slice the methods of Value; in particular, Set would
// decompose the comma-separated string into the slice.
func (f *FlagSet) Var(value Value, name string, usage string) {
	// Remember the default value as a string; it won't change.
	flag := &Flag{name, usage, value, value.String()}
	_, alreadythere := f.formal[name]
	if alreadythere {
		var msg string
		if f.name == "" {
			msg = fmt.Sprintf("flag redefined: %s", name)
		} else {
			msg = fmt.Sprintf("%s flag redefined: %s", f.name, name)
		}
		fmt.Fprintln(f.Output(), msg)
		panic(msg) // Happens only if flags are declared with identical names
	}
	if f.formal == nil {
		f.formal = make(map[string]*Flag)
	}
	f.formal[name] = flag
}
```
- 调用 `flag.Parse()` 后，就开始了解析命令行参数的值绑定到变量的过程，也是按照顺序解释代码。这一步调用了 `CommandLine.Parse()` 方法, 其中 `os.Args[1:]` 即为执行文件后面剩下的参数信息。

```go
// Parse parses the command-line flags from os.Args[1:]. Must be called
// after all flags are defined and before flags are accessed by the program.
func Parse() {
	// Ignore errors; CommandLine is set for ExitOnError.
	CommandLine.Parse(os.Args[1:])
}
```

- `CommandLine.Parse()` 方法使用 for 循环分别解析 arguments 参数传入的值，核心方法便是 `f.parseOne()`。`f.parsed = true f.args = arguments` 这两步分别赋值。
如果遇到错误，那么就根据 `f.errorHandling` 设置的值来判断该退出还是该继续，默认是 `ExitOnError`。

```go
// Parse parses flag definitions from the argument list, which should not
// include the command name. Must be called after all flags in the FlagSet
// are defined and before flags are accessed by the program.
// The return value will be ErrHelp if -help or -h were set but not defined.
func (f *FlagSet) Parse(arguments []string) error {
	f.parsed = true
	f.args = arguments
	for {
		seen, err := f.parseOne()
		if seen {
			continue
		}
		if err == nil {
			break
		}
		switch f.errorHandling {
		case ContinueOnError:
			return err
		case ExitOnError:
			os.Exit(2)
		case PanicOnError:
			panic(err)
		}
	}
	return nil
}
```

- `f.ParseOne()` 比较复杂，继续按步骤分析代码：
	- 首先取 `s = f.args[0]` 为第一段参数，如果 s 长度小于 2 或者第一个字符不是 `-`， 直接退出，这种情况说明已经遍历参数到了最尾端，需要跳出参数解析了。
	- 不满足上述情况的 s 说明是个有效的命令行参数，如果 s 的第2个字符也是 `-`， 说明整个参数开头是 `--`，如果整个 s 就等于 `--`，说明这解析到了终端的终止符，需要跳出解析了。
	- `name := s[numMinuses:]`，去掉 `-` 或者 `--` 前缀后，如果 name 长度为 0 或者第一位字符还是个 `-` 或者是个 `=`，这是非法的，跳出解析，并且抛错。
	- `f.args = f.args[1:]` 这一步保留了后面的参数供下次循环解析。
	- 如果 `name` 中包含 `=`，假设 `=` 在字符串中的序号是 i，那么将 name[0：i] 作为 name，把 name[i+1:] 作为 value，解析成功。（注意这里 value 可能为 boolean 值）
	- `flag, alreadythere := m[name]`，去 f.formal 中检查有没有这个 `name`，如果不存在，说明在命令行参数中提供了，可是代码中却没有定义。这里要分两种情况：
		- 如果代码中没定义的这个 name 是 `help` 或者 `h`，那么打印帮助信息，并抛错 errHelp。
		- 如果不属于这两个，直接抛错，flag 未定义。
	- 到目前为止如果没抛错的话，现在解析出来的命令行参数 name 一定存在，value 不一定存在，如果参数是 boolean 类型，那么可以分两种情况：
		- 没有 value，那么调用 `Set()` 方法将 boolean 设置为 `true`，
		- 有 value 的话，如果 value 符合 boolean 定义，那么调用 `Set()` 方法设置值，不符合抛错，无效的 boolean 类型。
	- 如果不是 boolean 类型，那么也分两种情况：
		- 有 value 的话，调用 `Set()` 方法将 value 设置进入对应的变量中
		- 没有 value 的话，由于一定需要有一个值，所以从 f.args 中读取下一个元素作为值设置到变量中。代码为：`value, f.args = f.args[0], f.args[1:]`
	- `f.actual[name] = flag`，将实际解析到的并 flag 参数存入 `f.actual` 中。注意，实际上 flag 对象是一个指针， `a.formal` 中也发生了更改。至此解析结束。

```go
// parseOne parses one flag. It reports whether a flag was seen.
func (f *FlagSet) parseOne() (bool, error) {
	if len(f.args) == 0 {
		return false, nil
	}
	s := f.args[0]
	if len(s) < 2 || s[0] != '-' {
		return false, nil
	}
	numMinuses := 1
	if s[1] == '-' {
		numMinuses++
		if len(s) == 2 { // "--" terminates the flags
			f.args = f.args[1:]
			return false, nil
		}
	}
	name := s[numMinuses:]
	if len(name) == 0 || name[0] == '-' || name[0] == '=' {
		return false, f.failf("bad flag syntax: %s", s)
	}

	// it's a flag. does it have an argument?
	f.args = f.args[1:]
	hasValue := false
	value := ""
	for i := 1; i < len(name); i++ { // equals cannot be first
		if name[i] == '=' {
			value = name[i+1:]
			hasValue = true
			name = name[0:i]
			break
		}
	}
	m := f.formal
	flag, alreadythere := m[name] // BUG
	if !alreadythere {
		if name == "help" || name == "h" { // special case for nice help message.
			f.usage()
			return false, ErrHelp
		}
		return false, f.failf("flag provided but not defined: -%s", name)
	}

	if fv, ok := flag.Value.(boolFlag); ok && fv.IsBoolFlag() { // special case: doesn't need an arg
		if hasValue {
			if err := fv.Set(value); err != nil {
				return false, f.failf("invalid boolean value %q for -%s: %v", value, name, err)
			}
		} else {
			if err := fv.Set("true"); err != nil {
				return false, f.failf("invalid boolean flag %s: %v", name, err)
			}
		}
	} else {
		// It must have a value, which might be the next argument.
		if !hasValue && len(f.args) > 0 {
			// value is the next arg
			hasValue = true
			value, f.args = f.args[0], f.args[1:]
		}
		if !hasValue {
			return false, f.failf("flag needs an argument: -%s", name)
		}
		if err := flag.Value.Set(value); err != nil {
			return false, f.failf("invalid value %q for flag -%s: %v", value, name, err)
		}
	}
	if f.actual == nil {
		f.actual = make(map[string]*Flag)
	}
	f.actual[name] = flag
	return true, nil
}
```

## 结尾

至此，flag 包源码基本就分析完了，从中其实可以学到不少东西，比如采用接口以极高的可扩展性来实现存储任意类型，除了包里定义的，根据这套规则可以实现任意结构体和参数的绑定关系。
这部分代码就不实现了，不过有官方文档中提供了的[自定义类型 URLValue 的例子](https://godoc.org/flag#example-Value)参考。