# shell 编码规范

一直觉得 linux shell 的语法很乱，各种书写规范以及兼容性很容易给开发者带来困惑，因此遵循一套 shell 语法标准是非常有必要的，本文是对 [google shell style gudie](https://google.github.io/styleguide/shell.xml) 的翻译和补充：

## 背景

### 哪种 shell 应该被使用

- `Bash` 是可执行文件被允许的唯一 shell 脚本语言，可执行文件必须以 `#!/bin/bash` 和 最少的 flag 作为开始。使用 `set` 去设置 `shell` 选项以便于你以 `bash <script_name>` 调用脚本的时候不会中断它的功能。
- 将所有的可执行脚本限制为 bash 为我们提供了一种安装在我们所有机器上的一致的 shell 语言。（所有的机器都可以使用 bash shell）
- 唯一的例外是你被任何代码中的需求所迫，其中一个例子是Solaris SVR4软件包，它需要纯Bourne shell来处理任何脚本。

### 什么时候使用 shell

- 尽管 shell 脚本不是一门开发语言，但它在 Google 被用来写各种实用性脚本。本代码风格规范更多的是对它的使用的认可而不是将其用于广泛部署的建议。
- 一些建议：
    - 如果您主要是为了调用其他的使用程序，并且只执行相对较少的数据操作，shell 是一个可以接受的选择。
    - 如果性能很重要，选择其他的语言而不是 shell。
    - 如果你发现你无论如何需要使用数组，但超过了 ${PIPESTATUS} 的分配，你应该使用 Python。
    - 如何你正在写一个脚本超过 100 行，你也许可以用 Python 代替它。记住脚本是会增长的。早早的用另一种语言重写你的脚本可以避免在以后哦的日子里进程耗时的重写。

## shell 文件和解释器调用

### 文件扩展名

- 可执行文件应该没有扩展名（强烈建议）或者是 `.sh` 扩展名。库文件必须有一个 `.sh` 扩展名并且没有可执行权限。在执行程序的时候不需要知道程序是用什么语言编写的，而且 shell 不要求扩展名，因此对于可执行文件我们不希望使用扩展名。然而，对于库文件，知道是用什么语言编写的是非常重要的，并且有时候需要在不同的语言里引用类似的库。这允许具有相同目的的但用不同语言编写的库文件使用除了语言特定的后缀之外相同的命名。

### SUID/SGID

- SUID 和 SGID 在 shell 脚本是被禁用的。（这里不细翻译了，不太懂这两个词的意思）

## 环境变量

### STDOUT 和 STDERR

- 全部的错误信息应该被写到 `STDERR`，这样可以更容易的将正常状态和实际问题分开。
- 定义一个 function 用来打印错误信息以及其他状态信息是被推荐的，例如：

```shell
err() {
    echo "[$(date +'%Y-%m-%dT%H:%M:%S%z')]: $@" >&2
}

if !do_something; then
  err "Unable to do something"
  exit "${E_DID_NOTHING}"
if
```

## 注释

### 文件头

- 以一句对文件内容的描述作为每一个脚本的开始。每个文件必须在最顶层有一句包含该文件内容简要概述的注释。版权通知和作者信息是可选的。例如：

```shell
#!/bin/bash
#
# Perform hot backups of Oracle databases.
```

### 功能注释

- 任何不明显不简短的 function 都应该被注释。任何在一个库文件里的 function，无论长度或者复杂性如何都必须被注释。
- function 的注释应该包括：
    - function 的描述
    - 被使用和修改的全局变量
    - 传入的参数
    - 返回值
- 举例：

```shell
#!/bin/bash
#
# Perform hot backups of Oracle databases.

export PATH='/usr/xpg4/bin:/usr/bin:/opt/csw/bin:/opt/goog/bin'

#######################################
# Cleanup files from the backup dir
# Globals:
#   BACKUP_DIR
#   ORACLE_SID
# Arguments:
#   None
# Returns:
#   None
#######################################
cleanup() {
  ...
}
```

### 实现注释

- 在棘手的，重要的，非显而易见的，有趣的代码部分都应该添加注释

### TODO 注释

- 在临时代码，一个短期的解决方案或者不是足够好的代码部分添加 TODO 注释，举例：

```shell
# TODO(author): Handle the unlikely edge cases (bug ####)
```

## 代码格式

- 对于修改一个已经存在的脚本文件，应该遵循现有的代码规范，下面的规范适用于新的代码。

### 缩进

- 缩进 2 个空格，不要使用 Tab。

### 行长度

- 行的最大长度是 80 个字符。

### 管道

- 如果管道不适合全部写在一行，则每条管道应该分别被分割成一行，举例：

```shell
# All fits on one line
command1 | command2

# Long commands
command1 \
  | command2 \
  | command3 \
  | command4
```

### 循环

- 把 `; do` ，`; then` 和 `while`, `for` 或者 `if` 放在同一行。在 shell 里面循环有点不一样，但是在声明 function 时，我们遵循与花括号相同的原则。那就是 `; then` 和 `;do` 应该 与 `while/if/for`在同一行。`else` 应该在它自己的行上，并且结束语应该在与开头语句垂直对齐的行上。
举例：

```shell
for dir in ${dirs_to_cleanup}; do
  if [[ -d "${dir}/${ORACLE_SID}" ]]; then
    log_date "Cleaning up old files in ${dir}/${ORACLE_SID}"
    rm "${dir}/${ORACLE_SID}"
    if [[ "$?" -ne 0 ]]; then
      error_message
    fi
  else
    mkdir -p "${dir}/${ORACLE_SID}"
    if [[ "$? -ne 0"]]; then
      error_message
    fi
  fi
done
```

### Case 语句

- 缩进选择是 2 个空格
- 一个单行的选择需要在右括号之后有一个空格
- 一个很长的或者多命令选择应该以匹配模式， 逻辑代码以及 `；;` 被分割成多行。
- 被匹配的表达式产品在 `case` 和 `esac` 缩进一个级别。

```shell
case "${expression}" in
  a)
    variable="..."
    some_command "${variable}" "${other_expr}" ...
    ;;
  absolute)
    actions="relative"
    another_command "${actions}" "${other_expr}" ...
    ;;
  *)
    error "Unexpected expression '${expression}'"
    ;;
esac
```

- 简单的命令可以和模式，`;;` 放在同一行，只要表达式仍然可读。这通常适用于

```shell
verbose='false'
aflag=''
bflag=''
files=''
while getopts 'avf:v' flag; do
  case "${flag}" in
    a) aflag='true' ;;
    b) bflag='true' ;;
    f) files="${OPTARG}" ;;
    v) verbose='true' ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done
```

### 变量扩展

按优先顺序排列：

- 与你找到的已存在的代码风格保持一致
- 为变量使用引号，参考下面
- 除非严格需要或避免深度混淆，否则不要用花括号引用 shell 特定的占位符。举例：

```shell
# Section of recommended cases
#Preferred style for 'special' variables:
echo "Postional: $1" "$2" "$3"
echo "Specials: !=$!, -=$-, _=$_. ?=$?, #=$# *=$* @=$@ \$=$$ ..."

# Braces necessary:
echo "many parameters: ${10}"

# Braces avioding confusion:
# Output is "a0b0c0"
set -- a b c
echo "${1}0${2}0${3}0" # a0b0c0

# Preferred style for other variables:
echo "PATH=${PATH}, PWD=${PWD}, mine=${some_var}"
while read f; do
  echo "file=${f}"
done < <(ls -l /tmp)

# Selection of discouraged cases

# Unquoted vars, unbraced vars, brace-qutoted single letter, shell specials
echo a=$avar "b=$bvar" "PID=${$}" "${1}"
# Confusing use: this is expanded as "${1}0${2}0${3}0", not "${10}${20}${30}
set -- a b c
echo "$10$20$30"
```

### 引号

- 总是对包含变量，命令替换，空格或者 shell 元字符的字符串加引号, 除非不加引号的扩展是必需的
- 不要对整形字面量使用引号
- 请注意 `[[` 的引号规则
- 使用 `$@` 除非有特殊的理由使用 `$*`

```shell
# 单引号表明不需要替换
# 双引号表示替换是必需的或是容忍的

# 例子
# 对命令替换使用引号
flag="$(some_command and its args "$@" 'quoted separately')"

# 对变量使用引号
echo "${flag}"

# 切勿对整数加引号
value=32
# 对命令替换使用引号，即使你期待的值是整形
number="$(generate_number)"

# 推荐对单词加引号，但不是必须
readonly USE_INTEGER='true'

# "quote shell meta characters"
echo 'Hello stranger, and well met. Earn lots of $$$'
echo "Process $$: Done making \$\$\$."

# 命令
# ($1 is assumed to contain a value here)
grep -li Hugo /dev/null "$1"

# Less simple examples
# "quote variables, unless proven false": ccs might be empty
git send-email --to "${reviewers}" ${ccs:+"--cc" "${ccs}"}

# Positional parameter precautions: $1 might be unset
# Single quotes leave regex as-is.
grep -cP '([Ss]pecial|\|?characters*)$' ${1:+"$1"}

# For passing on arguments,
# "$@" is right almost everytime, and
# $* is wrong almost everytime:
#
# * $* and $@ will split on spaces, clobbering up arguments
#   that contain spaces and dropping empty strings;
# * "$@" will retain arguments as-is, so no args
#   provided will result in no args being passed on;
#   This is in most cases what you want to use for passing
#   on arguments.
# * "$*" expands to one argument, with all args joined
#   by (usually) spaces,
#   so no args provided will result in one empty string
#   being passed on.
# (Consult 'man bash' for the nit-grits ;-)

set -- 1 "2 two" "3 three tres"; echo $# ; set -- "$*"; echo "$#, $@")
set -- 1 "2 two" "3 three tres"; echo $# ; set -- "$@"; echo "$#, $@")
```

### 对引号的补充

- 单词分隔
[单词分隔](http://mywiki.wooledge.org/WordSplitting)是 bash shell 的默认行为，因此使用字符串和参数扩展时要小心，例如下面的这个例子，不要认为单词分隔只是折叠了空格，实际上，这个例子中真正发生的是，第一个命令（指的是Bash）将我们句子中的每个单词作为单独的参数传递给 echo。Bash 使用单词之间的空白将句子分隔成单词，以确定每个单词的开始和结束位置。而在第2个例子中，Bash被强制将整个引用的字符串做为一个参数传递给 echo。

```shell
$ echo Push that word             away from me.
Push that word away from me.
$ echo "Push that word             away from me."
Push that word             away from me.
```

再看下面的例子，单词分隔不仅仅发生在字符串字面量上，它也发生在参数扩展之后！正如你看到的，在第一个 echo 命令中忽略了引号。Bash 扩展了我们的语句，然后使用单词分隔将产生的扩展分解为用于回显的参数，结果破坏了我们经过深思熟虑的格式化。在第二个例子中，用引号引起句子的参数扩展确保 shell 不会用空白分隔成多个参数。

```shell
$ sentence="Push that word             away from me."
$ echo $sentence
Push that word away from me.
$ echo "$sentence"
Push that word             away from me.
```

单词分隔发生在全部的空白处，包括制表符，新行，和其他在IFS变量中定义的字符。下面是另一个例子去展示如果你忽略引号会有多糟糕。

```shell
$ echo "$(ls -al)"
total 8
drwxr-xr-x   4 lhunath users 1 2007-06-28 13:13 "."/
drwxr-xr-x 102 lhunath users 9 2007-06-28 13:13 ".."/
-rw-r--r--   1 lhunath users 0 2007-06-28 13:13 "a"
-rw-r--r--   1 lhunath users 0 2007-06-28 13:13 "b"
-rw-r--r--   1 lhunath users 0 2007-06-28 13:13 "c"
drwxr-xr-x   2 lhunath users 1 2007-06-28 13:13 "d"/
drwxr-xr-x   2 lhunath users 1 2007-06-28 13:13 "e"/
$ echo $(ls -al)
total 8 drwxr-xr-x 4 lhunath users 1 2007-06-28 13:13 "."/ drwxr-xr-x 102 lhunath users 9 2007-06-28 13:13 ".."/ -rw-r--r-- 1 lhunath users 0 2007-06-28 13:13 "a" -rw-r--r-- 1 lhunath users 0 2007-06-28 13:13 "b" -rw-r--r-- 1 lhunath users 0 2007-06-28 13:13 "c" drwxr-xr-x 2 lhunath users 1 2007-06-28 13:13 "d"/ drwxr-xr-x 2 lhunath users 1 2007-06-28 13:13 "e"/
```

在一些情况下可能希望省略引号，例如你需要单词分隔的功能：

```shell
$ friends="Marcus JJ Thomas Michelangelo"
$ for friend in $friends; do
$   echo "$friend is my friend!";
$ done
Marcus is my friend!
JJ is my friend!
Thomas is my friend!
Michelangelo is my friend!
```

但是，说实话，几乎所有的上述情况都应该使用数组。数组的优点是他们不需要明确的分隔符就可以分隔字符串。这意味着在数组中的字符串可以包含任何有效的字符，不需要担心它可能包含字符分隔符（像上个例子中的空格）。举例：

```shell
friends=( "Marcus The Rich" "JJ The Short" "Timid Thomas" "Michelangelo The Mobster" )
for friend in "${friends[@]}"; do
  echo "$friend is my friend";
done
```

## 特性和 BUG

### 命令替换

- 使用 `$(command)` 代替反引号。嵌套的反引号在内部需要用 \ 来转义，而 `$(command)` 在引号嵌套时格式不需要改变而且可读性更好，举例：

```bash
# 推荐
var="$(command "$(command1)")"
# 反例
var="`command \`command1\``"
```

### test `[[` 和 `[`

- 相比 `test`, `[` 和 `/usr/bin/[` ，`[[` 是首选。`[[...]]` 减少了因为路径扩展或者在 `[[` 和 `]]` 之间发生单词分割的错误，而且它允许 `[ ... ]` 不能的正则匹配。举例：

```bash
# This ensures the string on the left is made up of characters in the
# alnum character class followed by the string name.
# Note that the RHS should not be quoted here.
# For the gory details, see
# E14 at https://tiswww.case.edu/php/chet/bash/FAQ
if [[ "filename" =~ ^[[:alnum:]]+name ]]; then
  echo "Match"
fi

# This matches the exact pattern "f*" (Does not match in this case)
if [[ "filename" == "f*" ]]; then
  echo "Match"
fi

# This gives a "too many arguments" error as f* is expanded to the
# contents of the current directory
if [ "filename" == f* ]; then
  echo "Match"
fi
```

### 检查 Strtings

- 尽可能的使用引号而不是填充字符，bash 检查一个空字符串非常容易，因此使用字符串为空或者非空的检查而不是使用填充字符这种方式。举例：

```bash
# 推荐
if [[ "${my_var}" = "some_thing"]]; then
  do_something
fi
# 测试一个字符串是否为空，-z (字符串长度为 0 ) -n (字符串长度不为 0 ) 是首选
if [[ -z "${my_var}" ]]; then
  do_something
fi
# 下面这种方式也是正确的，但是不推荐
if [[ "${my_var}" = "" ]]; then
  do_something
fi
# 反例
if [[ "${my_var}X" = "someth_stringX" ]]; then
  do_something
fi
```

- 为避免困惑，应该明确的使用 -z 或者 -n，举例：

```bash
# 推荐
if [[ -n "${my_var} "]]; then
  do_something
fi
# 反例
if [[ "${my_var}" ]]; then
  do_something
fi
```

### test `[[` 和 `[` 补充

- [shell 条件判断](./shell_grammer.md)

### 通配符文件扩展名

- 当使用通配符文件扩展名时，使用一个明确的路径，因为文件名能以 `-` 开头，使用 `./*` 扩展通配符要比 `*` 安全的多，举例：

```bash
# 下面是一个文件夹 /tmp 的内容
# -f -r somedir somefile
psa@bilby$ rm -v *
removed directory: `somedir'
removed `somefile'

# 与之相反
psa@bilby$ rm -v ./*
removed `./-f'
removed `./-r'
rm: cannot remove `./somedir': Is a directory
removed `./somefile'
```

### Eval

- eval 命令应该被避免。

```bash
# What does this set?
# Did it succeed? In part or whole?
eval $(set_my_variables)

# What happens if one of the returned values has a space in it?
variable="$(eval some_function)"
```

### pipe to while 管道输入 while 循环（不知道怎么翻译）

- 优先使用流程替换或者 for 循环 来做 pipe to while，在 while 循环中修改的变量不会传播到父进程，因为循环的命令被运行在子进程中。（因为管道后的内容会放在子 shell 执行）举例：

```bash
last_line='NULL'
your_command | while read line; do
  last_line="${line}"
done
echo "${last_line}" # NULL
```

- 如果你确信输入不会包含特殊字符（通常，这意味着不是用户输入），请使用 for 循环。

```shell
total=0
# Only do this if there are no spaces in return values.
for value in $(command); do
  total+="${value}"
done
```

- 使用进程替换可以重定向输出，但是需要将命令放在明确的子 shell 中，而不是 bash 为 while 循环创建的隐式子 shell。

```shell
total=0
last_file=
while read count filename; do
  total+="${count}"
  last_file="${filename}"
done < <(your_command | uniq -c)

# This will output the second field of the last line of output from
# the command.
echo "Total = ${total}"
echo "Last one = ${last_file}"
```

- 使用无需将复杂结果传递给父 shell 的 while 循环 - 这通常需要一些更复杂的解析。注意简单的例子可能更容易通过 awk 等工具完成。如果你不想改变父进程的变量作用域，这可能也很有用。

```shell
# Trivial implementation of awk expression:
#   awk '$3 == "nfs" { print $2 " maps to " $1 }' /proc/mounts
cat /proc/mounts | while read src dest type opts rest; do
  if [[ ${type} == "nfs" ]]; then
    echo "NFS ${dest} maps to ${src}"
  fi
done
```

## 命名约定

### 函数名

- 小写字母，用下划线分割单词。用 :: 分开库，函数名称后面需要括号。关键词 function 是可选的，但是在一个项目中，使用或者不使用必须是一致的。

```shell
# Single function
my_func() {
  ...
}

# Part of a package
mypackage::my_func() {
  ...
}
```

### 变量名

- 和函数命名一样

### 常量和环境变量

- 全部大写，用下划线分隔，在文件顶部声明。

```shell
# Constant
readonly PATH_TO_FILES='/some/path'

# Both constant and environment
declare -xr ORACLE_SID='PROD'
```

- 一些变量在第一次被设置时变成常量（例如，通过 getopts）。因此，在 getopts 中设置一个条件是正确的，但是设置之后它应该立即变为 readonly。注意 declare 不能在函数中操作全局变量，因此推荐使用 readonly 或者 export。

### 源文件名

- 小写，尽量使用下划线分隔。

### 只读变量

- 使用 readonly 或者 declare -r 确保变量是只读的。因为全局变量在 shell 中被广泛使用，因此捕捉错误是重要的。当你想要声明一个只读变量，应该使它被明确定义。

```shell
zip_version="$(dpkg --status zip | grep Version: | cut -d ' ' -f 2)"
if [[ -z "${zip_version}" ]]; then
  error_message
else
  readonly zip_version
fi
```

### 使用局部变量

- 使用 local 声名函数范围内的变量。声明和赋值应该在不同的行。确保局部变量仅仅能在一个函数内被访问。这样可以避免污染全局命名空间并无意间设置在函数之外有意义的变量。举例：

```shell
my_func2() {
  local name="$1"

  # Separate lines for declaration and assignment:
  local my_var
  my_var="$(my_func)" || return

  # DO NOT do this: $? contains the exit code of 'local', not my_func
  local my_var="$(my_func)"
  [[ $? -eq 0 ]] || return

  ...
}
```

### 函数位置

- 在一个文件中，将全部的函数放在常量的下面，在声明函数之前，只能包含 set 语句和设置常量。在函数之间不要隐藏可执行代码。

### main 函数

- 对于一个包含至少一个其他函数的足够长的脚本，一个名为 main 的函数是必要的。为了容易的找到程序的入口，把主程序封装在 main 函数作为最底层的函数。这提供了与其他代码库的一致性，并允许你定义更多的局部变量（如果主代码不是函数则无法做到）。文件中的最后一条非注释行应该是对 main 的调用：

```shell
main "$@"
```

- 很显然，对于线性的短脚本，main 函数有点多余， 不是必需的。

## 调用命令

### 检查返回值

- 总是检查返回值并且给予能提供有用信息的返回值。
- 对于 unpiped 命令，使用 `$?` 或者通过一个 `if` 语句直接检查它。举例：

```shell
if ! mv "${file_list}" "${dest_dir}/" ; then
  echo "Unable to move ${file_list} to ${dest_dir}" >&2
  exit "${E_BAD_MOVE}"
fi
# or
mv "${file_list}" "${dest_dir}/"
if [[  "$?" -ne 0 ]]; then
  echo "Unable to move ${file_list} to ${dest_dir}" >&2
  exit "${E_BAD_MOVE}"
fi
```

- Bash 有 `PIPESTATUS` 变量允许检查一个管道的全部部分的返回码。如果要检查整个管道的成功或失败是必要的，那么下面的例子是可以接受的：

```shell
tar -cf - ./* | ( cd "${dir}" && tar -xf - )
if [[ "${PIPESTATUS[0]}" -ne 0 || "${PIPESTATUS[1]}" -ne 0 ]]; then
  echo "Unable to tar files to ${dir}" >&2
if
```

- 然而， 只要你运行了其他的命令，`PIPESTATUS` 将被覆盖，如果你需要根据管道中发生的错误对错误采取不同的行为，则需要在运行命令后立即将PIPESTATUS分配给另一个变量（不要忘记 `[` 是一个命令，将覆盖 `PIPESTATUS`）

```shell
tar -cf - ./* | ( cd "${dir}" && tar -xf - )
return_codes=(${PIPESTATUS[*]})
if [[ "${return_codes[0]}" -ne 0 ]]; then
  do_something
fi
if [[ "${return_codes[1]}" -ne 0 ]]; then
  do_something_else
fi
```

### 内建命令 VS 外部命令

- 在内建命令和独立进程之间尽量选择调用内建命令而不是调独立进程。举例：

```shell
# Prefer this:
addition=$((${X} + ${Y}))
substition="${string/#foo/bar}"
# Instead of this:
addition="$(expr ${X} + ${Y})"
substitution="$(echo "${string}" | sed -e 's/^foo/bar/')"
```

## 结论

- 使用常识并保持一致

## 关于补充知识的参考文档

- http://mywiki.wooledge.org/BashGuide/Practices#Bash_Tests
