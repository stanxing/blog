# 如何实现一个不堆叠的 setInterval

nodejs 原生的 setInterval 有一个很大的问题是，其按照一定间隔执行函数时不会考虑上一个函数返回，这样如果函数在间隔期间没有执行完毕，就可能造成函数执行的相互堆叠。对于一些不允许并发的定时任务来说，这个方案是不可行的。

## 利用 setTimeOut 来实现一个不堆叠的 setInterval

想要实现这个方法有几个关键问题要考虑：

- 函数执行不能重叠，那意味着必须在函数执行完成后再设置下一次函数的执行时间，可以使用 `setTimeout`。
- 要考虑如何关闭 interval？对于 原生的 `setInterval`，nodejs 提供了 `clearInterval` 的函数，这里就要自己实现了。其实原理也不复杂，闭包返回一个 `clear` 函数即可解决，当调用函数时使用 `clearTimeout` 关闭当前设置的定时器，并且使用一个标识位来控制当前函数执行完成后，不会再继续 `setTimeout`。

完整代码如下：

```js
// 使用了 es6 的语法
export default {
  setInterval: (func, ms) => {
    let shouldStop = false;
    let timeout = {};
    const next = async () => {
      try {
        await func();
      } catch (err) {
        console.log('Failed to execute callback function in setInterval');
      } finally {
        if (!shouldStop) {
          timeout = setTimeout(next, ms);
        }
      }
    };
    timeout = setTimeout(next, ms);
    return { clear: () => {
      shouldStop = true;
      clearTimeout(timeout);
    } };
  },
}
```
