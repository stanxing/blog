# Dockerfile 最佳实践

## ENTRYPOINT vs CMD

ENTRYPOINT 和 CMD 都用来指定一个可执行程序，这个可执行程序在 container 启动后自动运行。如果想要让自己制作的镜像自动运行程序（不需要在 docker run 后面添加命令），就需要使用这两个命令。

大部分基础镜像例如 `ubuntu` 等都内置了 CMD 指令，一般是 `CMD /bin/bash` 或者 `CMD /bin/sh` 等。

在基于基础镜像构建新的镜像的时候，只要在 Dockerfile 里指定这两个命令就能覆盖掉原镜像中的命令。

### CMD

CMD 有三种形式：

- exec 形式，必须是一个JSON Array 的格式：

```dockerfile
FROM ubuntu:14.04
CMD ["ping", "localhost"]
```

- 若 `ENTRYPOINT` 存在，作为其默认参数，必须是一个JSON Array 的格式：

```dockerfile
FROM ubuntu:14.04
ENTRYPOINT ["ping", "localhost"]
CMD ["-c", "3"]
```

- shell 形式：

```dockerfile
FROM ubuntu:14.04
CMD ping localhost
```

shell 形式在容器启动执行命令时会自动在指令前拼接 `/bin/sh -c`，也就是 sh 进程会作为容器的 PID 1 进程。而 exec 进程它还会将用户指定的进程作为容器内的 PID 1 进程运行，这样方便传递信号给该进程。所以再编写 Dockerfile 文件时优先使用 exec 模式。

CMD 命令可以被 `docker run image` 后面的命令行参数替换掉：

- 对于没有 `ENTRYPOINT` 的情况，比如执行 `docker run demo ls`，将忽略原有的 CMD 命令执行 `ls` 列出容器内的目录。
- 对于包含了 `ENTRYPOINT` 的情况，`docker run demo` 后面的参数将作为 `ENTRYPOINT` 的参数覆盖掉默认的 CMD 中的默认参数。
- 注意，包含了 `ENTRYPOINT` 后，CMD 不能是一个 shell 形式，否则会自动拼接上 `/bin/sh -c` 传给 `ENTRYPOINT`，显然是不对的。

### ENTRYPOINT

ENTRYPOINT 指令有两种形式：

- exec 模式：

```dockerfile
FROM ubuntu:14.04
ENTRYPOINT ["ping", "localhost"]
```

以这种模式定义的镜像在容器启动时会自动执行 `ENTRYPOINT` 指令，并且会将 `docker run image` 后的命令行参数附加在 `ENTRYPOINT` 的指令之后，例如 `docker run demo -c 3`，容器内实际执行的指令就是 `ping localhost -c 3`。如果需要在命令行覆盖 `ENTRYPOINT` 指令，可以使用 `docker run --entrypoint` 选项。

- shell 模式：

```dockerfile
FROM ubuntu:14.04
ENTRYPOINT ping localhost
```

### 注意事项

- 基础镜像里指定了 `CMD` 指令，新镜像基于该镜像构建，并且重新指定了 `ENTRYPOINT`，此时，基础镜像里的 `CMD` 指令会失效，以 `ENTRYPOINT` 为准。
- 基础镜像里指定了 `ENTRYPOINT` 指令，新镜像基于该镜像构建，并且重新指定了 `CMD`，此时，此时新镜像执行的命令依旧以 `ENTRYPOINT` 为准，`CMD` 作为参数传入。

### 参考

- [CMD](https://docs.docker.com/engine/reference/builder/#cmd)
- [ENTRYPOINT](https://docs.docker.com/engine/reference/builder/#entrypoint)
- [Dockerfile: ENTRYPOINT和CMD的区别](https://zhuanlan.zhihu.com/p/30555962)

## ADD vs COPY

### ADD

- `ADD` 允许使用一个 URL 作为 `src` 参数，例如：
    - `ADD http://foo.com/bar.go /tmp/main.go`，这句指令将从远程下载 `bar.go` 文件，并拷贝成 `/tmp/main.go`。
    - `ADD http://foo.com/bar.go /tmp/`，这句指令将从远程下载 `bar.go` 指令，并拷贝到 `/tmp/` 目录下（文件名仍然是 `bar.go`）。Docker 会自动根据 `dst` 的结尾是不是斜杠来推断拷贝到一个目录还是文件。

- `ADD` 允许自动解压被压缩的文件，如果 `src` 是一个被压缩的格式，比如 `tar`，`gzip`，`bzip2` 等，将自动解压到 `dst` 目录下。
    - `ADD /foo.tar.gz /tmp/`，这句将解压 `foo.tar.gz` 到 `/tmp` 目录下。

- 值得注意的是，`ADD` 的从 URL 下载文件 和解压缩两个特性不能同时使用，如果从远程下载一个压缩文件，`ADD` 不会解压，只会直接拷贝。

### COPY

- 由于 `ADD` 功能的复杂性（做了太多事情）和行为的不可预测性，docker 增加了 `COPY` 命令，`COPY` 不支持上面 `ADD` 的那些功能，仅仅用来实现本地文件或者目录的拷贝。
- 在多阶段构建功能出现后，`COPY` 又增加了一个功能是从构建镜像中拷贝文件到新镜像中。

### 使用场景

- 本地拷贝文件的场景都应该使用 `COPY`。
- 需要自动解压的场景可以选择 `ADD`。
- 从远程 URL 下载文件也不应该使用 `ADD`，例如下面的例子：
    这样会使用两条指令，一条下载，一条解压安装并清理无用文件。看起来没啥问题，但实际上这样做并不会减少镜像的大小，因为 `rm` 操作在单独的镜像层。

    ```dockerfile
    ADD http://foo.com/package.tar.bz2 /tmp/
    RUN tar -xjf /tmp/package.tar.bz2 \
        && make -C /tmp/package \
        && rm /tmp/package.tar.bz2
    ```

    更好的做法是，将整个操作写在一行，这样只会在同一个镜像层处理。

    ```dockerfile
    RUN curl http://foo.com/package.tar.bz2 \
        | tar -xjC /tmp/package \
        && make -C /tmp/package
    ```

### 参考

- [copy vs add](https://www.ctl.io/developers/blog/post/dockerfile-add-vs-copy/)

## 编写 Dockerfile 的最佳实践

### 使用 .dockerignore

`.dockerignore` 文件可以用来排除那些不需要在构建镜像中复制的文件，类似于 `.gitignore`。

### 使用 multi-stage 构建

对于 go，c 这种编译型语言，使用多阶段构建可以显著的减少最终生成的镜像的体积。下面是一个多阶段构建的例子，通过使用 COPY 命令从 build 镜像中拷贝编译好的二进制文件到一个崭新的基础镜像中运行，可以直接越过中间的各种编译的层，减少镜像的体积。

```dockerfile
FROM golang:1.11-alpine AS build

# Install tools required for project
# Run `docker build --no-cache .` to update dependencies
RUN apk add --no-cache git
RUN go get github.com/golang/dep/cmd/dep

# List project dependencies with Gopkg.toml and Gopkg.lock
# These layers are only re-built when Gopkg files are updated
COPY Gopkg.lock Gopkg.toml /go/src/project/
WORKDIR /go/src/project/
# Install library dependencies
RUN dep ensure -vendor-only

# Copy the entire project and build it
# This layer is rebuilt when a file changes in the project directory
COPY . /go/src/project/
RUN go build -o /bin/project

# This results in a single layer image
FROM scratch
COPY --from=build /bin/project /bin/project
ENTRYPOINT ["/bin/project"]
CMD ["--help"]
```

### 不要安装不必要的包

### 解耦应用

一个 docker 容器不应该做太多的事，可以使用多个 docker 容器来分别部署不相关的应用，让他们通过容器网络来交互。

### 对多行参数排序

举例如下，多个包的名字应该通过 `\` 来换行，并且和包名称前空一个空格，使得结构看起来更加清晰。

```dockerfile
RUN apt-get update && apt-get install -y \
  bzr \
  cvs \
  git \
  mercurial \
  subversion
```

### 利用构建缓存

Dockerfile 在构建时按照其中的指令顺序构建，每次构建都会生成一个中间镜像。下一条指令会根据上一个中间镜像的结果来构建。所以每次检查指令的时候， docker 会寻找是否有镜像缓存可以复用，这样就不需要创建一个新的中间镜像。如果不想使用缓存，可以在构建的时候使用 `--no-cache`。

docker daemnon 通过 Dockerfile 构建镜像时，当发现即将新构建出的镜像与已有的某镜像重复时，可以选择放弃构建新的镜像，而是选用已有的镜像作为构建结果，也就是采取本地已经 cache 的镜像作为结果。

缓存的命中规则如下：

- 基本原则是从已在缓存中的父镜像开始，将下一条指令与从该基本镜像派生的所有子映像进行比较，以查看是否其中一个是使用完全相同的指令构建的。如果不是，则缓存无效。
- 对于 `ADD` 和 `COPY` 指令，镜像中文件的内容被检查，然后对每个文件计算一个校验和，校验和中不关注上次修改时间和上次访问时间。在检查缓存的时候，将校验和和已有的镜像做比较，如果相等，则使用缓存，如果不相等，该镜像及后续所有的构建缓存全部无效。
- 除却这两个命令的其他命令，缓存都不会通过检查文件来确定缓存是否改变。举个例子，`RUN apt-get -y update` 这个指令不会通过比较文件变化来确定缓存，仅仅通过比较指令的字符串有没有发生变化来确定是否使用缓存。
- 一旦缓存无效，dockerfile 中后续所有的指令都会生成新的镜像来构建。

#### 利用缓存的最佳实践

由于 docker 缓存的机制，要将不长变更的改动放在 Dockerfile 的最前面，比如 `RUN apt update` 或者 `RUN curl xxx` 等，同时，针对不同语言，例如 nodejs，应该将 package.json 文件先拷贝进来再执行 `npm install`，这样当 nodejs 里其他文件变更并不会导致 `npm install` 的执行，从而加快构建。对于 golang 来说，同样的道理，应该先拷贝 `go.mod` 和 `go.sum`，再执行 `go mod download`, 这样可以有效的缓存安装的依赖，加快构建。

### 不要在 Dockerfile 中映射公有端口

例如下面这种，这样会给应用的部署带来不确定性，应该通过 -p 来在运行时指定。

```dockerfile
＃private and public mapping
EXPOSE 80:8080

＃private only
EXPOSE 80
```

### 尽量减少镜像大小

### 参考

- [dockerfile-best-practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [docker cache 机制](http://open.daocloud.io/docker-build-de-cache-ji-zhi/)
