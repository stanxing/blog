# 关于 map 类型的思考

## map 变量是一个指针类型吗？如果是，为什么声明不是 *map[T]T 呢？

众所周知，golang 的函数中是没有引用传递的，只有值传递，例如下面的代码：

```go
package main

import "fmt"

func fn(m map[int]int) {
        m = make(map[int]int)
}

func main() {
        var m map[int]int
        fn(m)
        fmt.Println(m == nil)
}
```
运行结果会返回 true，这个例子证明了函数是值传递，函数内的 m 并不会干扰函数外层的 m。

但是如果函数中传入一个已经初始化好的 map 类型(不初始化好的话添加元素会报错)，并且执行了添加元素的操作，实际上会反映到函数调用外层的 map 变量中的，继续看代码:

```go
package main

import "fmt"

func fn(m map[int]int) {
	m[1] = 1
}

func main() {
	m := make(map[int]int)
	fn(m)
	fmt.Println(m)
}
```
运行结果会返回 `map[1:1]`，显然m 的值被插入了，说明传入的 m 应该是一个指针变量，否则无法共享底层的数据结构。所以问题来了，map 到底是一个什么类型呢？如果是指针，为什么其声明的类型不是 `*map[string]string` 呢？（众所周知，go 中的指针类型变量表示都会在前面加 * 号）

## 解答


当我们写 `m := make(map[int]int)` 这行代码的时候，编译器实际上调用的是 [runtime.makemap](https://golang.org/src/runtime/map.go#L303)，其函数声明如下：

```go
// makemap implements Go map creation for make(map[k]v, hint).
// If the compiler has determined that the map or the first bucket
// can be created on the stack, h and/or bucket may be non-nil.
// If h != nil, the map can be created directly in h.
// If h.buckets != nil, bucket pointed to can be used as the first bucket.
func makemap(t *maptype, hint int, h *hmap) *hmap {
```

所以，代码实际返回的是一个指向 `runtime.hmap` 结构体的指针，我们无法从 go 代码中看到这一点，但是可以通过比较值的大小与 uintptr 的大小是一致的，等于机器的字长：

```go
package main

import (
	"fmt"
	"unsafe"
)

func main() {
	var m map[int]int
	var p uintptr
	fmt.Println(unsafe.Sizeof(m), unsafe.Sizeof(p)) // 8 8 (linux/amd64)
}
```

再看下面的一个例子：

```go
package main

import "fmt"

func fn(m map[int]int) {
	fmt.Printf("%p, %p\n", m, &m)
}

func main() {
	m := make(map[int]int)
	fmt.Printf("%p, %p\n", m, &m)
	fn(m)
}

// 返回结果：
// 0xc00008c150, 0xc00000e028
// 0xc00008c150, 0xc00000e038
```
从代码的返回结果可以看到，在函数内外，m 变量里面存的内存地址都指向的是同一个地址，同时 &m （m变量本身的内存地址）并不相同，这也说明了 m 是一个指针，go 函数值传递的特征。

那么问题来了，为什么不用 `make(map[T]T)` 不返回 `*map[T]T` 表示呢？下面参考的文章中有提到这个问题：

> Ian Taylor answered this recently in a [golang-nuts](https://groups.google.com/forum/#!msg/golang-nuts/SjuhSYDITm4/jnrp7rRxDQAJ) thread
> In the very early days what we call maps now were written as pointers, so you wrote *map[int]int. We moved away from that when we realized that no one ever wrote `map` without writing `*map`.

意思是，一开始是设计成返回 `*map[int]int` 指针的，但是后来意识到，没有人使用 map 的时候不是用作指针的，所以就简写了。

可以说是将类型从 `*map[int]int` 重命名为 `map[int]int`，尽管由于类型看起来不像指针而令人困惑，但比不能取消引用的指针形状的值更容易混淆。

## 参考

- [maps and channels are references, right?](https://dave.cheney.net/2017/04/29/there-is-no-pass-by-reference-in-go)
- [If a map isn’t a reference variable, what is it?](https://dave.cheney.net/2017/04/30/if-a-map-isnt-a-reference-variable-what-is-it)