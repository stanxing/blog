# zsh 和 bash 的不同行为汇总

## 对于 var="foo bar" 为什么 zsh 执行 `for foo in $var` 结果只会循环一次,输出是 "foo bar" 而不是两个词分别输出？

对于 bash 来说，结果会循环两次，分别输出两个单词，但是 zsh 的默认行为不是这样，它会将字符串看成一个整体，这不是 bug。如果需要保持跟 bash 一样的行为，可以通过设置 `setopt shwordsplit` 来实现。

参考[这里](http://zsh.sourceforge.net/FAQ/zshfaq03.html)。
