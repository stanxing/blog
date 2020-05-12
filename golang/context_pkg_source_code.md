# context 包源码解析

本文代码和测试均基于 golang 1.13.4。

golang 中，我们经常会有对于一个请求启动多个 goroutine 来进行处理，同时 goroutine 中可能又会启动其他 goroutine 去处理，但是，一旦请求需要终止，这些 goroutine 需要被通知退出，以避免溢出。context 包的设计就是用来在单个请求中的不同 goroutine 之间同步特定数据，以及设置取消，超时信号，当请求被终止的时候，通知所有的 goroutine 结束。

## context.Context 接口

context 包中的核心便是 context.Context 接口，定义了四个方法，从中基本也可以看出了 context 支持的用途：

- `Done()` 函数返回一个只读 channel，供 goroutine 从中获取值，如果拿到了值，说明 context 被取消，通知该 goroutine 应该退出
- `Err()` 函数返回 context 被取消的错误信息，是被取消还是超时，还是超过了 deadline 等。
- `Deadline()` 函数返回什么时间该 context 将被取消。
- `Value(key)` 函数返回注册到该 context 中的 key 对应的 value 信息。

```go
// A Context carries a deadline, cancelation signal, and request-scoped values
// across API boundaries. Its methods are safe for simultaneous use by multiple
// goroutines.
type Context interface {
    // Done returns a channel that is closed when this Context is canceled
    // or times out.
    Done() <-chan struct{}

    // Err indicates why this context was canceled, after the Done channel
    // is closed.
    Err() error

    // Deadline returns the time when this Context will be canceled, if any.
    Deadline() (deadline time.Time, ok bool)

    // Value returns the value associated with key or nil if none.
    Value(key interface{}) interface{}
}
```

## context 的树结构

context 的设计是一棵树，当声明一个 context 的时候都需要传入一个父 context，以此形成了树结构，当父 context 的行为发生变化时，比如执行取消函数，该 context 下的所有 子 context 都会执行取消（当然子 context 派生的 context 也会被取消），从而实现了通过 context 来跟踪控制所有相关联的 goroutines。既然是树结构，肯定会有 root 节点， context 包中 root 节点被设计成永远不会被取消，并且提供了两个现成的实现  `context.Background()` 和 `context.TODO()`，大部分情况下都应该用 `context.Background()` 作为 root 节点:

```go
// An emptyCtx is never canceled, has no values, and has no deadline. It is not
// struct{}, since vars of this type must have distinct addresses.
type emptyCtx int

func (*emptyCtx) Deadline() (deadline time.Time, ok bool) {
	return
}

func (*emptyCtx) Done() <-chan struct{} {
	return nil
}

func (*emptyCtx) Err() error {
	return nil
}

func (*emptyCtx) Value(key interface{}) interface{} {
	return nil
}

func (e *emptyCtx) String() string {
	switch e {
	case background:
		return "context.Background"
	case todo:
		return "context.TODO"
	}
	return "unknown empty Context"
}

var (
	background = new(emptyCtx)
	todo       = new(emptyCtx)
)

func Background() Context {
	return background
}

func TODO() Context {
	return todo
}
```

### context 包提供的四个功能

下面是 4 个 `with` 开头函数，代表了 context 提供的四个功能，每个函数最后都返回一个 `Context` 接口，因此这四类 Context 可以彼此任意作为父子 context 来继承，形成链式调用，以实现复杂的需求。下面会详细分析四类 context 的实现。

```go
// 
func WithCancel(parent Context) (ctx Context, cancel CancelFunc)
func WithDeadline(parent Context, deadline time.Time) (Context, CancelFunc)
func WithTimeout(parent Context, timeout time.Duration) (Context, CancelFunc)
func WithValue(parent Context, key, val interface{}) Context
```

## context.WithCancel

`context.WithCancel` 函数传入一个父 context 并基于此返回了一个子 Context 接口和一个 cancel 函数，当调用 cancel 函数时，将取消 context，控制所有传入该 context 的 groutines 结束。下面分析代码实现：

- 第一步使用 `newCancelCtx` 生成了一个 `cancelCtx` 类型的结构体，该结构体中内嵌了 Context 接口类型，即传入的父 Context。使用 muetx 锁机制确保了类型安全，`done` channel 在 context 被取消的时候 close 用来通知 goroutine 结束。最后 children 虽然是 map 类型，实际上是一个实现了 `canceler` 接口的 Set，用来存储子 context 中实现了 `canceler` 接口的 context，以便在父 context 收到取消指令后，执行子 context 的 cancel 函数。

```go
// A canceler is a context type that can be canceled directly. The
// implementations are *cancelCtx and *timerCtx.
type canceler interface {
	cancel(removeFromParent bool, err error)
	Done() <-chan struct{}
}
// A cancelCtx can be canceled. When canceled, it also cancels any children
// that implement canceler.
type cancelCtx struct {
	Context

	mu       sync.Mutex            // protects following fields
	done     chan struct{}         // created lazily, closed by first cancel call
	children map[canceler]struct{} // set to nil by the first cancel call
	err      error                 // set to non-nil by the first cancel call
}

type CancelFunc func()
func WithCancel(parent Context) (ctx Context, cancel CancelFunc) {
	c := newCancelCtx(parent)
	propagateCancel(parent, &c)
	return &c, func() { c.cancel(true, Canceled) }
}

// newCancelCtx returns an initialized cancelCtx.
func newCancelCtx(parent Context) cancelCtx {
	return cancelCtx{Context: parent}
}
```

- 第二步是执行 `propagateCancel(parent)` 函数将该 context 注册到其父 context 的 children 字段中，这一步中判断了 4 种情况：
    - 如果 parent.Done() == nil，即其 `parent` 是 `context.Background` 这种默认实现，直接返回，无需注册。
    - 判断 `parent` 的类型是否是 `*cancelCtx` 类型，目前有三种类型 `*cancelCtx`、`*timerCtx` 或者 `*valueCtx`。除了 `*valueCtx`, 其余两种内部都包含 `cancelCtx`。注意这里 `parentCancelCtx` 函数会一直的往上找，直到根 context 或者最近的包含 cancelCtx 结构体的父 context。
    - 如果是该类型并且 `p.err != nil`，说明父 context 已经执行取消执行，此时该创建出的 context 已经没有意义，需要立即执行 cancel 函数。
    - 如果是该类型并且父 context 没有取消，将创建的 cancelCtx 加入到父 context 的 children 中，以此父 context 便有了管理该 context 的能力。
    - 如果不是该类型，比如说 backgroundCtx => valueCtx => cancelCtx 这条链就查不到满足的 context，这种情况会起一个 goroutine 来接收 parent 的 done 信号，如果收到信号，执行 `child.cancel(false, parent.Err())` 并退出 goroutine，如果收到自己主动取消的 done 信号，退出 goroutine。

```go
// propagateCancel arranges for child to be canceled when parent is.
func propagateCancel(parent Context, child canceler) {
	if parent.Done() == nil {
		return // parent is never canceled
	}
	if p, ok := parentCancelCtx(parent); ok {
		p.mu.Lock()
		if p.err != nil {
			// parent has already been canceled
			child.cancel(false, p.err)
		} else {
			if p.children == nil {
				p.children = make(map[canceler]struct{})
			}
			p.children[child] = struct{}{}
		}
		p.mu.Unlock()
	} else {
		go func() {
			select {
			case <-parent.Done():
				child.cancel(false, parent.Err())
			case <-child.Done():
			}
		}()
	}
}
// parentCancelCtx follows a chain of parent references until it finds a
// *cancelCtx. This function understands how each of the concrete types in this
// package represents its parent.
func parentCancelCtx(parent Context) (*cancelCtx, bool) {
	for {
		switch c := parent.(type) {
		case *cancelCtx:
			return c, true
		case *timerCtx:
            return &c.cancelCtx, true
        // 遇到 valueCtx 继续往上查找
		case *valueCtx:
			parent = c.Context
		default:
			return nil, false
		}
	}
}
```

- 第三步返回了一个 `func() { c.cancel(true, Canceled) }` cancelFunc 类型的函数，我们来分析下 cancel 函数做的事情：

    - 这是一个闭包封装了 cancelCtx 中的 cancel 函数。该函数在执行的时候会设置锁，主要做了三件事情：
        - 关闭掉 `c.done` channel，让监听该 context 的 goroutine 退出。 
        - 然后 for 循环遍历 `c.children` 中，分别执行 `child.cancel(false, err)` 函数递归的关闭掉了子 context 的 done channel，从而实现了取消信号的传递，之后将 `c.children` 置为 nil。注意代码中的注释，执行这一步的时候，不仅会持有该 context 的锁，子 context 的锁也会被持有。
        - 最后，如果该 context 是主动关闭，将从其 parent 中移除掉该 context。

```go
// cancel closes c.done, cancels each of c's children, and, if
// removeFromParent is true, removes c from its parent's children.
func (c *cancelCtx) cancel(removeFromParent bool, err error) {
	if err == nil {
		panic("context: internal error: missing cancel error")
	}
	c.mu.Lock()
	if c.err != nil {
		c.mu.Unlock()
		return // already canceled
	}
	c.err = err
	if c.done == nil {
		c.done = closedchan
	} else {
		close(c.done)
	}
	for child := range c.children {
		// NOTE: acquiring the child's lock while holding parent's lock.
		child.cancel(false, err)
	}
	c.children = nil
	c.mu.Unlock()

	if removeFromParent {
		removeChild(c.Context, c)
	}
}
```

- 最后顺便分析下 `Done()` 函数的实现:

`Done()` 函数实际上就是初始化该 context 的 done channel，然后返回给调用方。

```go
func (c *cancelCtx) Done() <-chan struct{} {
	c.mu.Lock()
	if c.done == nil {
		c.done = make(chan struct{})
	}
	d := c.done
	c.mu.Unlock()
	return d
}
```

## context.WithValue

`context.WithValue` 函数携带一个 key-value 的信息，并只会返回一个 Context 接口，而且永远不会被取消。其核心是一个 Value 函数，通过 key 来获取 value，如果不匹配，递归的检查其父 context 的 value 方法中有没有存储该值，这里实际上有个问题，如果 父 context 是 valueCtx，自然可以往上找，如果两个 valueCtx 中间被 cancelCtx 隔开，那么便不能一直往上找了，因为 cancelCtx 的 Value 函数返回了 nil。例如 valueCtx => cancelCtx => valueCtx 这种情况。

```go
func WithValue(parent Context, key, val interface{}) Context {
	if key == nil {
		panic("nil key")
	}
	if !reflectlite.TypeOf(key).Comparable() {
		panic("key is not comparable")
	}
	return &valueCtx{parent, key, val}
}

// A valueCtx carries a key-value pair. It implements Value for that key and
// delegates all other calls to the embedded Context.
type valueCtx struct {
	Context
	key, val interface{}
}

func (c *valueCtx) String() string {
	return contextName(c.Context) + ".WithValue(type " +
		reflectlite.TypeOf(c.key).String() +
		", val " + stringify(c.val) + ")"
}

func (c *valueCtx) Value(key interface{}) interface{} {
	if c.key == key {
		return c.val
	}
	return c.Context.Value(key)
}
```

## context.WithTimeout 和 context.WithDeadline

这两个放在一块介绍是因为本质上这两个是一样的，都是 timerCtx 结构体实现的。只不过一个是过时间间隔取消，一个是过具体时间取消。通过下面的代码也可以看出来了，所以只对 `WithDeadline` 做介绍。

`WithDeadline` 传入两个参数分别是 父 context 和 deadline 时间，返回 `timerCtx` 结构体。该结构体内嵌了 cancelCtx（因为总归是要取消的嘛），一个 timer 定时器以及 deadline 时间。

`WithDeadline` 函数的具体实现如下：

- 先检查了 `parent.Deadline()` 是否存在，如果存在并且 deadline 时间要在当前 context 的 deadline 之前，直接以 `withCancel` 创建 context。因为父 context 的 deadline 更早，当父 context 执行的时候会关闭子 context，子 context 再设置时间已经没有意义了。

- 初始化 `timerCtx` 结构体，内嵌 cancelCtx 结构体，在初始化 `newCancelCtx` 的时候传入了 parent，所以实际上继承关系为 `parent => cancelCtx => timerCtx`。然后执行 `propagateCancel` 函数（上面已经介绍过）将创建好的 context 注册进 parent 的 children 中。

- 检查 deadline 是否已经过了，如果过了，直接执行 `c.cancel(true, DeadlineExceeded)`，依旧返回了 context 和 cancel 函数，下次再调用 cancel 函数会直接返回，因为 cancelCtx.err 已经不再为空。

- 如果时间没过，初始化一个定时器 timer， 在定时器时间到的时候执行 `c.cancel(true, DeadlineExceeded)` 函数。

- 最后还是会返回 context 和 cancel 函数，允许在时间没到的时候手动调用函数结束 context。

- 最后注意 cancel 函数的实现，主要的逻辑还是调用了 `cancelCtx.cancel` 函数，但也做了一些额外的工作，比如说关闭定时器。
```go
type timerCtx struct {
	cancelCtx
	timer *time.Timer // Under cancelCtx.mu.

	deadline time.Time
}

func WithTimeout(parent Context, timeout time.Duration) (Context, CancelFunc) {
	return WithDeadline(parent, time.Now().Add(timeout))
}

func WithDeadline(parent Context, d time.Time) (Context, CancelFunc) {
	if cur, ok := parent.Deadline(); ok && cur.Before(d) {
		// The current deadline is already sooner than the new one.
		return WithCancel(parent)
	}
	c := &timerCtx{
		cancelCtx: newCancelCtx(parent),
		deadline:  d,
	}
	propagateCancel(parent, c)
	dur := time.Until(d)
	if dur <= 0 {
		c.cancel(true, DeadlineExceeded) // deadline has already passed
		return c, func() { c.cancel(false, Canceled) }
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.err == nil {
		c.timer = time.AfterFunc(dur, func() {
			c.cancel(true, DeadlineExceeded)
		})
	}
	return c, func() { c.cancel(true, Canceled) }
}

func (c *timerCtx) cancel(removeFromParent bool, err error) {
	c.cancelCtx.cancel(false, err)
	if removeFromParent {
		// Remove this timerCtx from its parent cancelCtx's children.
		removeChild(c.cancelCtx.Context, c)
	}
	c.mu.Lock()
	if c.timer != nil {
		c.timer.Stop()
		c.timer = nil
	}
	c.mu.Unlock()
}
```

## context 的最佳实践

至此，context 包就介绍完了，[go 官方文档](https://golang.org/pkg/context/)中也给出了 context 包的一些最佳实践：

- 不要在一个结构体中使用 context，相反的，应该作为函数的第一个参数将 context 显式的传入，标准命名是 `ctx`。
- 不要传入一个空的 Context，如果不确定使用哪个 context，请使用 `context.TODO()`。
- 使用 value Context 的时候，仅仅将请求范围内的数据传传入，不要将函数的可选参数也传入。
- 可以将相同的 context 传给不同的 goroutine，context 由多个 goroutine 同步使用是安全的。
