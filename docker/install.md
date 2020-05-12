### docker 命令

#### save， load

```shell
# 打包镜像到 tar 文件中
docker save [imageName:imageTag] -o [imageName.tar]
# 从 tar 文件中加载镜像
docker load -i [imageName.tar] --quiet
```