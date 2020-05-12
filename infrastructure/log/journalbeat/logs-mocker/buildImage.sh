#!/bin/bash -e

docker build -t nodejs-logs-mocker:latest .

# 执行命令：
# docker run --env "TOTAL=150" nodejs-logs-mocker:latest