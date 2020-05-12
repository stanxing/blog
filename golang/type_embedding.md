# 详解 Go 的类型内嵌

类型内嵌（type embedding） 是 go 语言实现 OOP （Object Orientd Programing）原理的重要特性。本文是 [Type Embedding](https://go101.org/article/type-embedding.html) 的译文。国内很少资料有如此详细的介绍 golang 的类型内嵌机制，看完后觉得受益匪浅。

Go 的结构体类型可以包含很多个字段，每个字段是由一个字段名称和一个字段值的类型构成的。事实上，一个结构体字段还能只包含一个字段名称，这种声明结构体字段的方式被称为类型内嵌。本文将详细的解释类型内嵌这种机制的目的和详细的使用方式。

## 类型内嵌是什么样的？

下面是一个例子用来展示类型内嵌：

```go
package main

import "net/http"

func main() {
	type P = *bool
	type M = map[int]int
	var x struct {
		string // a defined non-pointer type
		error  // a defined interface type
		*int   // a non-defined pointer type
		P      // an alias of a non-defined pointer type
		M      // an alias of a non-defined type

		http.Header // a defined map type
	}
	x.string = "Go"
	x.error = nil
	x.int = new(int)
	x.P = new(bool)
	x.M = make(M)
	x.Header = http.Header{}
}
```

在上面的例子中，在 x 结构体中一共有 6 种类型被内嵌进去，每种类型的嵌入都形成了一个嵌入式字段。

嵌入的字段也被称为匿名字段。但是每个被嵌入的字段都会有一个指定的字段名称。一般是由嵌入字段的非限定类型名称充当字段名字。例如，上面六种嵌入字段的字段名称分别为 `string`, `error`, `int`, `P`, `M` 和 `Header`。

## 哪些类型可以被内嵌？

在官方的 Go 规范文档（go1.14）中是这样描述的：

> An embedded field must be specified as a type name T or as a pointer to a non-interface type name *T, and T itself may not be a pointer type.

中文翻译就是一个内嵌的字段必须是一个被声明为类型 `T` 或者一个非接口类型的指针类型 `*T`，其中 `T` 是类型名，并且 `T` 本身不是一个指针类型 。这个描述在 Go 1.9 之前是完全正确的，但是现在显得有些过时和不太准确了。比如上面那个例子中，这个描述没有包括对 `类型别名 P` 这种情况的涵盖。这里，本文试图使用一个更精确的描述：

- 一个类型名 `T` 能够被内嵌并作为一个内嵌字段，除非 `T` 代表了一个已定义的指针类型或者一个基类型是指针或者接口类型的指针类型
- 