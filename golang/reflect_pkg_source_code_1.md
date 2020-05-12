# reflect 包 DeepEqual 函数源码解析

函数定义如下，reflect.DeepEqual 函数一般用于比较两个对象是否完全相等，支持任意类型的对象进比较(== 操作符做比较对一些类型是有限制的)。

```go
func DeepEqual(x, y interface{}) bool {
	if x == nil || y == nil {
		return x == y
	}
	v1 := ValueOf(x)
	v2 := ValueOf(y)
	if v1.Type() != v2.Type() {
		return false
	}
	return deepValueEqual(v1, v2, make(map[visit]bool), 0)
}
```

从上面的函数实现可以看出，比较两个对象是否相等是通过反射来完成的，其比较步骤如下：

- 首先将两个对象转换成了 `reflect.Value` 类型。
- 判断两个对象的类型是否一致，这是比较的前提，如果类型不同，直接返回 false。
- 如果类型相同，调用 `deepValueEqual` 方法来比较两个对象内部的元素是否相等。这一步在后续再介绍

## 判定各类型相等的条件

在函数上方占用了大量篇幅来介绍了该函数中判断对象相等的条件，几乎涵盖了所有的类型，整个 `deepValueEqual` 函数就是围绕这些约定来实现的。判断的条件如下：

- 不同类型的值永远不会相等。
- 对于数组来说，如果数组中的每个元素都深度相等，那么它也深度相等。
- 对于结构体来说，如果结构体中的每个字段都深度相等（包括导出的和未导出的字段），那么它也深度相等。
- 对于函数类型，如果它们的值都为 nil 那么是相等的，否则都被认定为不相等（相同函数也不相等）。
- 对于接口类型，如果它们底层持有的值深度相等，那么它们就相等。
- 对于 map 类型，必须当下面所有的条件都为 true 的时候才深度相等：
    - 它们都为 nil 或者都不为 nil。
    - 它们具有相同的长度。
    - 要么它们是同一个 map 对象，要么它们对应的 keys 指向的 values 是深度相等的。
- 对于指针类型，如果它们使用 == 操作符比较是相等的或者它们指向了一个深度相等的值，那么都认为它们深度相等。
- 对于 slice 类型，必须当下面所有的条件都为 true 的时候才深度相等：
    - 它们都为 nil 或者都不为 nil。
    - 它们有相同的长度。
    - 要么它们的第一个元素的指针地址相同（ &x[0] == &y[0]），要么它们对应的元素（直到长度限制）是深度相等的。（这里需要注意，不是底层数组的第一个元素，是切片的第一个元素对应在底层数组中的地址）
    - 注意：一个 non-nil empty slice 和一个 nil slice（例如 []byte{} 和 []byte(nil)） 是不相等的。
- 其他类型，比如 numbers, bools, strings, 和 channels 直接用 == 操作符来判断。
- 要注意不是所有的值都深度相等于自己，例如函数，以及嵌套包含这些值的结构体，数组等。
- 当 DeepEqual 遍历数据的值的时候可以会找到一个循环（比如自己嵌套自己），这种情况下通过了一个 `map[visit]bool` 标记是否 visit 结构体被访问过，如果访问过，直接返回相等。

## deepValueEqual 函数

函数定义如下，v1 和 v2 的意义不用多少，需要比较的两个对象；visited 这个 map 用来标记visit 结构体，检测是否出现循环引用；
depth 表示深度，如果对象嵌套很深，大于限定的阈值会导致 panic。

```go
func deepValueEqual(v1, v2 Value, visited map[visit]bool, depth int) bool

// 只有对象是 Map, Slice, Ptr, Interface 这种可能发生循环引用的类型才会使用到
type visit struct {
    // v1 的指针
    a1  unsafe.Pointer
    // v2 的指针
	a2  unsafe.Pointer
	typ Type
}
```

`deepValueEqual` 函数内部声明了 hard 方法，会检测 v1，v2 类型是否是 `Map, Slice, Ptr, Interface` 类型，因为只有这些类型才可能出现循环依赖。
如果是这些类型中的某一个，初始化 visit 结构体，如果该结构体在 `visited` 中已经存在了，说明循环依赖，跳出后续逻辑直接返回 true。

```go
	hard := func(v1, v2 Value) bool {
		switch v1.Kind() {
		case Map, Slice, Ptr, Interface:
			// Nil pointers cannot be cyclic. Avoid putting them in the visited map.
			return !v1.IsNil() && !v2.IsNil()
		}
		return false
	}

	if hard(v1, v2) {
		addr1 := v1.ptr
		addr2 := v2.ptr
		if uintptr(addr1) > uintptr(addr2) {
			// Canonicalize order to reduce number of entries in visited.
			// Assumes non-moving garbage collector.
			addr1, addr2 = addr2, addr1
		}

		// Short circuit if references are already seen.
		typ := v1.Type()
		v := visit{addr1, addr2, typ}
		if visited[v] {
			return true
		}

		// Remember for later.
		visited[v] = true
	}
```

接下来就是递归的按照约定来实现各种类型的判断条件了，代码实现很容易理解，以 Slice 为例：先判断 v1 和 v2 是否为 nil，再判断 v1 和 v2 是否长度相等，再判断 v1
和 v2 切片中第一个元素的指针地址否相等（具体可以参考 `Pointer()` 函数中 slice 部分的介绍），如果不相等，最后再递归的判断 slice 中的元素是否深度相等。

```go
	switch v1.Kind() {
	case Array:
		for i := 0; i < v1.Len(); i++ {
			if !deepValueEqual(v1.Index(i), v2.Index(i), visited, depth+1) {
				return false
			}
		}
		return true
	case Slice:
		if v1.IsNil() != v2.IsNil() {
			return false
		}
		if v1.Len() != v2.Len() {
			return false
		}
		if v1.Pointer() == v2.Pointer() {
			return true
		}
		for i := 0; i < v1.Len(); i++ {
			if !deepValueEqual(v1.Index(i), v2.Index(i), visited, depth+1) {
				return false
			}
		}
		return true
	case Interface:
		if v1.IsNil() || v2.IsNil() {
			return v1.IsNil() == v2.IsNil()
		}
		return deepValueEqual(v1.Elem(), v2.Elem(), visited, depth+1)
	case Ptr:
		if v1.Pointer() == v2.Pointer() {
			return true
		}
		return deepValueEqual(v1.Elem(), v2.Elem(), visited, depth+1)
	case Struct:
		for i, n := 0, v1.NumField(); i < n; i++ {
			if !deepValueEqual(v1.Field(i), v2.Field(i), visited, depth+1) {
				return false
			}
		}
		return true
	case Map:
		if v1.IsNil() != v2.IsNil() {
			return false
		}
		if v1.Len() != v2.Len() {
			return false
		}
		if v1.Pointer() == v2.Pointer() {
			return true
		}
		for _, k := range v1.MapKeys() {
			val1 := v1.MapIndex(k)
			val2 := v2.MapIndex(k)
			if !val1.IsValid() || !val2.IsValid() || !deepValueEqual(val1, val2, visited, depth+1) {
				return false
			}
		}
		return true
	case Func:
		if v1.IsNil() && v2.IsNil() {
			return true
		}
		// Can't do better than this:
		return false
	default:
		// Normal equality suffices
		return valueInterface(v1, false) == valueInterface(v2, false)
	}
```
## 参考

- [Go doc](https://golang.org/src/reflect/deepequal.go)