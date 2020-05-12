# shell 常用语法

## redirect

## pipeline

## process substitution

## Test, [ and [[

### Test , [ 特性

- `test` 和 `[` 都是是 bash 内建命令。test 命令返回 0 （True）或者 1（False），取决于对表达式的评估结果。两个命令是等价的，test expr 和 [ expr ] 作用相同。
- 两个命令用法参考：
    - http://cn.linux.vbird.org/linux_basic/0340bashshell-scripts_3.php
    - https://github.com/luisedware/Archives/blob/master/%E5%8D%9A%E5%AE%A2%E6%96%87%E7%AB%A0/Linux-Shell-%E5%9F%BA%E7%A1%80%E4%B9%8B%E6%9D%A1%E4%BB%B6%E5%88%A4%E6%96%AD%E8%AF%AD%E5%8F%A5.md

### [[ 特性

`[[` 是 bash 内建命令 `[` 的提升, 它具有多项增强功能，如果你编写的是以 bash 为目标的脚本，它是更好的选择。

- 不再需要疯狂地引用变量，即它会阻止 bash 的[字符分隔](http://mywiki.wooledge.org/WordSplitting)行为（`[` 不会，所以，其扩起来的变量必须加引号）举例：

```shell
# [ 是个命令，而 ] 仅仅是一个参数，用来表示结尾
if [ -f "$file" ]
# [[
if [[ -f $file ]]  
```

- 支持使用 !, && 和 || 用于布尔测试 和 使用 > 和 < 用于字符串比较。通常情况下，`<` 是 重定向，`&&` and `||` 用来连接多个命令，`( )` 用来生成子 shell。而 `[` 是一个常规命令， && , ||, <, > 这些符号不会作为命令行参数传递给常规命令。 `[[` 使得上述字符被特殊处理。

```shell
# 详细参考 http://mywiki.wooledge.org/BashFAQ/031
[[ a > b ]] || echo "a does not come after b"
[[ az < za ]] && echo "az comes before za"
[[ a = a ]] && echo "a equals a"
```

- 使用 =~ 操作符做正则匹配。举例：

```shell
# [...]
if [ "$answer" = y -o "$answer" = yes ]
# [[...]]
if [[ $answer =~ ^y(es)?$ ]]
```

### == vs =

- `=` 是 POSIX 标准，`==` 是 bash 扩展， 在 `[` 和 `[[` 中二者用法相同，个人推荐使用 `=`。

## 特殊变量
