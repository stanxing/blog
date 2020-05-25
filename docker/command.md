# docker 常用命令

## save， load

```shell
# 打包镜像到 tar 文件中
docker save [imageName:imageTag] -o [imageName.tar]
# 从 tar 文件中加载镜像
docker load -i [imageName.tar] --quiet
```

## docker ps

```shell
# 主要介绍 -s 选项，返回 SIZE 字段
docker ps -s --no-trunc
CONTAINER ID        IMAGE              COMMAND                  CREATED             STATUS              PORTS            NAMES                   SIZE
85d5055d3410        imageName          "/sbin/my_init"          10 days ago         Up 10 days                           containerName           142 kB (virtual 603 MB)
```

参考[官方文档](https://docs.docker.com/storage/storagedriver/#container-size-on-disk)，这里有两个概念：

- size：每个容器可写层占用的磁盘大小。
- virtual size：容器使用的用于只读镜像数据的数据量加上容器的可写层大小。

由于底层镜像大小是共享的，如果多个容器派生于同一个镜像，那么这些容器占用的磁盘大小 = 多个容器的可写层大小 + 一个镜像的大小。
