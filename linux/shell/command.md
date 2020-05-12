# linux 常用命令

本文总结或收集了一些 linux 常用命令的具体用法介绍，供忘记的时候做个参考。

## AWK

- [三十分钟学会AWK](https://github.com/mylxsw/growing-up/blob/master/doc/%E4%B8%89%E5%8D%81%E5%88%86%E9%92%9F%E5%AD%A6%E4%BC%9AAWK.md)

    补充说明：
    - 如果 awk 中指定了多个文件，`NR` 变量会把第二个文件的行号从第一个文件的行号末尾开始计数；而 `FNR` 变量会独立计算每个文件的行号，彼此不受影响。(在 ubuntu 16.04 下的测试结果)
    ![awk_NR_FNR](./demo/awk_1.png)
    - 语句之间要加分号，例如：

    ```shell
    # 注意 if else 之间的分号，如果没有会报语法错误
    awk 'BEGIN{a=10; b = 20; if (a == b) print "a == b"; else print "a != b"}'
    a != b
    ```

    - awk 的字符串连接符是空格，不是加号：

    ```shell
    awk 'BEGIN { str1 = "Hello, "; str2 = "World"; str3 = str1 str2; print str3 }'
    Hello, World
    ```

    - awk 的数组中如果没有定义某个下标的元素，则序号不会被打印：

    ```shell
    ➜ awk 'BEGIN{arr[0]=1; arr[2]=10; for (i in arr) printf "arr[%d]: %d\n", i, arr[i]}'
    arr[0]: 1
    arr[2]: 10
    ```

## SED

- [三十分钟学会SED](https://github.com/mylxsw/growing-up/blob/master/doc/%E4%B8%89%E5%8D%81%E5%88%86%E9%92%9F%E5%AD%A6%E4%BC%9ASED.md)

## JQ

## FREE

free 的用法特别简单，重要的是能理解 free 的参数含义。以下列输出结果为例（Ubbuntu 16.04 16G 内存）：

```shell
➜ free -w
              total        used        free      shared     buffers       cache   available
Mem:       16135472     2636952    11205340      166372      305916     1987264    12931996
Swap:       8389628           0     8389628
```

其各个字段含义如下（参考 man free 的解释和一些文档）：

- `total`: 系统可用的总内存，除去了 kernel 在启动时为自己保留的一小部分内存，因此会略小于实际内存
- `used`: 已被操作系统使用的内存，计算方式为 total - free - buffers - cache
- `free`: 未被操作系统使用的内存，从 /proc/meminfo 中的 MemFree 字段获取
- `shared`: 共享内存，大部分是被 tmpfs 文件系统使用的内存，取自 /proc/meminfo 中的 Shmem
- `buffers/cache`: buffers + cache
    - `buffers`: 被内核缓冲区使用的内存（kernel buffers），
    - `cache`: 被 page cache 和 slabs 使用的内存，取自 /proc/meminfo 中的 Cached + Slab
- `available`: 模拟当启动一个新的应用程序时，在不发生内存交换的情况下有多少内存可供使用。不像 `cache` 或者 `free` 字段提供的值，这个字段将 page cache 考虑在内，并且不是所有的可回收 slab 内存都将被回收，因为有些可能正在被使用。这个字段取自 /proc/meminfo 中的 MemAvailable, 从内核 3.14 被引入。在 linux 2.6.27 之前，这个值等于 `free`。

根据 man free 中 对 `available` 的解释，这个值应该是要小于 `free` + `buffers` + `cache` 的。

### buffer vs cache

在 linux 内存管理中 buffer 指的是 `buffer cache`，cache 指的是 `page cache`。简单来说，两者都使用来优化磁盘 IO 的读写速率，磁盘有逻辑（文件系统）和物理（磁盘块）两种操作。其中 `page cache` 缓存了文件页用来优化文件 IO，而 `buffer cache` 缓存了磁盘块用来优化块设备的 IO。

但实际上，大部分文件是通过文件系统呈现的，而且存储在磁盘上，这就会导致同一份文件缓存了两次，为此，在 linux 2.4 之后将两者统一了起来。如果被缓存的数据既是文件又是块数据（对文件来说，大部分数据使得，但是元数据不是），此时 `buffer cache` 中就会存在一个指针指向 `page cache`，这样数据在内存中就只需要保留一份。所以当讨论磁盘缓存时，其实也是 `page cache`。当然 `buffer cache` 也是存在的，因为仍然有一部分数据不是文件数据，例如 元数据，RawBlock IO 还是需要使用 `buffer cache` 来缓存。

所以总结来说： `page cache` 主要用来做文件系统上的缓存，常见的是针对文件的 `read()/write()` 系统调用，另外也包括了 `mmap()` 映射的块设备，也就是说，事实上 `page cache` 负责了大部分的块设备文件的缓存工作。`buffer cache` 缓存了系统对块设备的读写，使用 dd 命令直接操作磁盘块就会使用到 `buffer cache`。注意，块 Block 的大小由所使用块设备决定，而页在 x86 上无论是 32 位还是 64 位都是 4K 。

free 中的 `buffer` 和 `cache` 的含义：

- buffers：表示块设备 (block device) 所占用的缓存页，包括了直接读写块设备以及文件系统元数据 (metadata) 比如 SuperBlock 所使用的缓存页
- cache：表示普通文件系统中数据所占用的缓存页

参考文档：

- https://askubuntu.com/questions/770108/what-do-the-changes-in-free-output-from-14-04-to-16-04-mean
- https://jin-yang.github.io/post/linux-memory-buffer-vs-cache-details.html