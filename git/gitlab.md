# 基于 GitLab 搭建代码托管平台

## 背景

### 运行方式

本 gitlab 安装方式使用的是官方推荐的 Omnibus，该安装方式将 gitlab 众多组件打包在了一起，极大的简化了 gitlab 的配置。同时，使用了官方的 docker 镜像，以容器化的方式进行部署。因此，若无特殊说明，以下提到的命令均需要在容器中执行，提到的目录均指的是容器中的目录，若需要在机器上直接执行，请使用 `docker exec -it gitlab_gitlab_1 ${command}` 的格式来运行命令。

### 网络架构

- vpc：
    - 独立 vpc。
- ecs：
    - 绑定了弹性公网 ip。
    - 修改 `/etc/ssh/sshd_config` 文件，将端口改为 2222，并重新启动 sshd 服务。这一步是为了把 ssh 端口让给 docker 容器映射，以实现 ssh 协议 clone 代码。
- slb：
    - 配置 http 监听 443，并做证书认证，之后将流量转到后端的 80端口; 配置 TCP 协议将 22 端口的流量转到后端 22 端口; 配置 http 重定向到 https。
    - 添加访问控制白名单。
- 堡垒机：
    - 创建资产 `gitlab`，运维端口 2222， 授权 sre 用户组。

## docker-compose.yml

参见 docker-compose.yml 文件的内容：

```yml
version: "3"

services:
  gitlab:
    image: gitlab/gitlab-ce:12.8.6-ce.0
    hostname: gitlab
    restart: always
    # https://gitlab.com/gitlab-org/gitlab-ce/issues/40379#note_60464469
    entrypoint: |
      bash -c 'sed -i "s/MIN_CHARS_FOR_PARTIAL_MATCHING = 3/MIN_CHARS_FOR_PARTIAL_MATCHING = 1/g" /opt/gitlab/embedded/service/gitlab-rails/lib/gitlab/sql/pattern.rb && /assets/wrapper'
    environment:
      GITLAB_OMNIBUS_CONFIG: |
        # https://gitlab.com/gitlab-org/omnibus-gitlab/blob/master/files/gitlab-config-template/gitlab.rb.template
        external_url "https://gitlab.example.com"
        # https://docs.gitlab.com/omnibus/settings/nginx.html#supporting-proxied-ssl
        nginx['listen_port'] = 80
        nginx['listen_https'] = false
        pages_external_url "https://gitlab-pages.example.com"
        gitlab_pages['enable'] = true
        gitlab_pages['external_http'] = ["0.0.0.0:9090"]
        pages_nginx['listen_port'] = 80
        pages_nginx['listen_https'] = false
        gitlab_pages['listen_proxy'] = "localhost:8090"
        # https://gitlab.com/gitlab-org/gitlab-pages/issues/129
        gitlab_pages['inplace_chroot'] = true
        postgresql['enable'] = true
        postgresql['statement_timeout'] = "1800000" # 30分钟
        gitlab_rails['db_adapter'] = "postgresql"
        gitlab_rails['db_encoding'] = "unicode"
        gitlab_rails['db_database'] = "gitlabhq_production"

        gitlab_rails['gitlab_issue_closing_pattern'] = "abcdefg"
        gitlab_rails['time_zone'] = "Asia/Shanghai"
        gitlab_rails['gitlab_default_projects_features_wiki'] = false
        gitlab_rails['gitlab_default_can_create_group'] = false
        gitlab_rails['gitlab_username_changing_enabled'] = false

        gitlab_rails['smtp_enable'] = true
        gitlab_rails['smtp_address'] = "smtpdm.aliyun.com"
        gitlab_rails['smtp_port'] = 465
        gitlab_rails['smtp_user_name'] = "gitlab@sre.example.com"
        gitlab_rails['smtp_password'] = "xxxxxx"
        gitlab_rails['smtp_domain'] = "gitlab.example.com"
        gitlab_rails['smtp_authentication'] = "login"
        gitlab_rails['smtp_tls'] = true
        gitlab_rails['enable_starttls_auto'] = true
        gitlab_rails['smtp_openssl_verify_mode'] = "peer"

        gitlab_rails['incoming_email_enabled'] = false
        gitlab_rails['incoming_email_address'] = "gitlab@sre.example.com"
        gitlab_rails['incoming_email_email'] = "gitlab@sre.example.com"
        gitlab_rails['incoming_email_password'] = "xxxxxx"
        gitlab_rails['incoming_email_host'] = "imap.mxhichina.com"
        gitlab_rails['incoming_email_port'] = 993
        gitlab_rails['incoming_email_ssl'] = true
        gitlab_rails['incoming_email_start_tls'] = false
        gitlab_rails['incoming_email_mailbox_name'] = "inbox"

        gitlab_rails['gitlab_email_from'] = "gitlab@sre.example.com"
        gitlab_rails['gitlab_email_display_name'] = "GitLab"
        gitlab_rails['gitlab_email_reply_to'] = "gitlab@sre.example.com"
        gitlab_rails['gitlab_email_subject_suffix'] = ""

        unicorn['worker_processes'] = 10
        unicorn['worker_timeout'] = 120
        unicorn['worker_memory_limit_min'] = "400 * 1 << 20"
        unicorn['worker_memory_limit_max'] = "650 * 1 << 20"

        logging['logrotate_rotate'] = 7

        gitlab_rails['backup_keep_time'] = 86400 # 1天
        # 该插件目前不管是否配置了 aliyun_oss_endpoint 只会走公网来上传备份文件，
        # 所以暂时用不了 gitlab 自动上传的备份的功能
        # 相关 issue：https://github.com/fog/fog-aliyun/issues/30
        # gitlab_rails['backup_upload_connection'] = {
        #   'provider' => 'aliyun',
        #   'aliyun_accesskey_id' => 'xxx',
        #   'aliyun_accesskey_secret' => 'xxx',
        #   'aliyun_region_id' => 'cn-hangzhou',
        #   'aliyun_oss_bucket' => 'xxx',
        #   'aliyun_oss_endpoint' => 'http://oss-cn-hangzhou-internal.aliyuncs.com'
        # }
        # gitlab_rails['backup_upload_remote_directory'] = "gitlabBackups"

        prometheus['enable'] = false
        alertmanager['enable'] = false
        node_exporter['enable'] = false
        redis_exporter['enable'] = false
        postgres_exporter['enable'] = false
        gitlab_monitor['enable'] = false
        grafana['enable'] = false
    ports:
    - "80:80"
    - "22:22"
    - "9090:9090"
    volumes:
    - /data/gitlab/config:/etc/gitlab
    - /data/gitlab/logs:/var/log/gitlab
    - /data/gitlab/data:/var/opt/gitlab
    # 为 docker 容器挂载本地时区文件
    - /etc/localtime:/etc/localtime
```

### 自动备份

- 备份 /etc/gitlab 目录下的所有文件（gitlab 配置文件、secrets 以及各种 key 文件存放路径）。在第一次安装生成这些文件后，将该文件夹在机器上 copy 一份即可，不需要天天备份。

- 备份 数据库、代码仓库、图片文件等。使用 gitlab 自带的命令进行备份，备份需要上传至阿里云 oss 存储。请使用 `crontab -e` 将执行命令添加到定时任务中以完成自动备份，命令如下：

```bash
# gitlab 本身也支持自动备份的功能，但是由于备份阿里云插件的 bug 没有选择使用，请参考 docker-compose.yml 中 `gitlab_rails['backup_upload_connection']` 的说明
0 2 * * * /root/gitlab/scripts/backup/backup.sh > /data/gitlab/logs/backup.log 2>&1
```

脚本内容：

```bash
#!/bin/bash -e

cd /data/gitlab/data/backups

docker exec -t gitlab_gitlab_1 gitlab-rake gitlab:backup:create CRON=1

latestBackupFile=$(ls | grep "gitlab_backup.tar" | awk 'END {print}')

echo "uploading ${latestBackupFile}..."
ossutil64 cp ${latestBackupFile} oss://bucket/gitlabBackups/${latestBackupFile}
```

## 查看日志

- 以命令方式查看日志

```bash
# 实时查看全部的日志输出
gitlab-ctl tail

# 实时查看某个组件的日志输出，例如 gitlab-rails
gitlab-ctl tail gitlab-rails

# 深入查看某个文件
gitlab-ctl tail nginx/gitlab_error.log
```

- 以文件方式查看日志

所有 gitlab 相关日志都存放在 `/var/log/gitlab` 目录下，分别以组件名称作为子目录单独存放。

- 在应用程序中查看日志

在 [Admin Area -> Monitoring -> Logs](https://gitlab.example.com/admin/logs) 中可查看各组件相关日志。

## 查看配置文件

Omnibus 将全部组件的配置项集中在了 `/etc/gitlab/gitlab.rb` 中，并提供了 `gitlab-ctl reconfigure` 命令解析配置项并生成各个组件的专属配置文件并 copy 到组件对应的配置目录中。下面是几个重要组件的配置文件所在的目录：

```bash
# gitlab-rails
/var/opt/gitlab/gitlab-rails/etc
# nginx
/var/opt/gitlab/nginx/conf
# gitlab-shell
/var/opt/gitlab/gitlab-shell
# postgresql
/var/opt/gitlab/postgresql/data
# redis
/var/opt/gitlab/redis
```

需要注意的是，本项目采用环境变量的方式传入需要更改的配置项，如果需要修改某配置项，不应该直接在容器中修改配置，而是应该在 docker-compose 文件中修改，使得改动可以被 track。

## 查看数据库

### 登录

- 以 superuser 登录数据库

```bash
# 登录用户为 gitlab-psql
gitlab-psql
```

## 控制台调试

首先需要启动一个可以执行 ruby 代码的控制台：

```bash
gitlab-rails console
```

- 测试邮件能否发送成功

```ruby
Notify.test_email('stan.xing@example.com', 'Message Subject', 'Message Body').deliver_now
```

注意：console 中执行的代码可能会修改原有的数据，要小心操作。

## 恢复备份

需要先将备份文件拷贝到机器上的 `/data/gitlab/data/backups` 目录下，即容器中挂载的备份路径。

```bash
# name 的值为备份文件名称中的时间加版本号，举例如下：
# 备份文件名称为 1566880022_2019_08_27_11.11.3_gitlab_backup.tar，则 name 的值为 1566880022_2019_08_27_11.11.3
gitlab-rake gitlab:backup:restore RAILS_ENV=production BACKUP=${name} force=yes
```

## Gitlab 升级

### 从 11.11.3 到 12.8.6 升级方案

根据[官方文档的升级推荐](https://docs.gitlab.com/ce/policy/maintenance.html#upgrade-recommendations)介绍，gitlab 同 major 版本下跨 minor 和 patch 版本升级是安全的，但是跨 major 版本升级需要先升级到当前 major 版本的最新 minor 和 patch 版本。

为了保证升级版本的之间的 migration 能正确执行，从 11.11.2 升级到最新版（12.8.6）需要按照如下步骤来进行：

- 升级 11.11.3 => 11.11.8, 先升级到主版本号为 11 的最后一个 release tag，升级后检查 migration 是否结束。
- 升级 11.11.8 => 12.0.9，再升级到 12.0 的最后一个 patch 版本，升级后检查 migration 是否结束。
- 升级 12.0.9 => 12.8.6, gitlab 最新版，升级后检查 migration 是否结束。

### 升级准备

#### 下载 docker 镜像

```shell
# 11.11.3 => 11.11.8 => 12.0.9 => 12.8.6
docker pull gitlab/gitlab-ce:11.11.8-ce.0
docker pull gitlab/gitlab-ce:12.0.9-ce.0
docker pull gitlab/gitlab-ce:12.8.6-ce.0
```

#### 检查 migration 是否结束的命令

文档参考[这里](https://docs.gitlab.com/ce/update/README.html#checking-for-background-migrations-before-upgrading)

```shell
docker exec -it gitlab_gitlab_1 gitlab-rails console
puts Sidekiq::Queue.new("background_migration").size
Sidekiq::ScheduledSet.new.select { |r| r.klass == 'BackgroundMigrationWorker' }.size
```

### 升级步骤

1. `./stop` 停掉当前 gitlab。
2. 替换 docker-compose 镜像 image 为 `gitlab/gitlab-ce:11.11.8-ce.0`。
3. `./start` 后执行 `docker logs -f gitlab_gitlab_1` 查看有无报错或不正常日志。
4. 检查 migration 是否结束。根据后台监控显示， migration job 大概需要等待 4 分钟才进入队列中执行。
5. migration 结束后简单测试功能是否正常，主要是 list/create/close issue、MR，发邮件这些。
6. 重复上面 1-5 步骤升级 `gitlab/gitlab-ce:12.0.9-ce.0`
7. 重复上面 1-5 步骤升级 `gitlab/gitlab-ce:12.8.6-ce.0`

### 备注

升级过程中 gitlab 各组件版本变化:

```shell
GitLab 11.11.3 (e3eeb779d72)
GitLab Shell 9.1.0
GitLab Workhorse v8.7.0
GitLab API v4
GitLab Pages 1.5.0
Ruby 2.5.3p105
Rails 5.1.7
PostgreSQL 10.7
```

```shell
GitLab 11.11.8 (1d18d065069)
GitLab Shell 9.1.0
GitLab Workhorse v8.7.0
GitLab API v4
GitLab Pages 1.5.1
Ruby 2.5.3p105
Rails 5.1.7
PostgreSQL 10.7
```

```shell
GitLab 12.0.9 (891da1422d9)
GitLab Shell 9.3.0
GitLab Workhorse v8.7.1
GitLab API v4
GitLab Pages 1.6.3
Ruby 2.6.3p62
Rails 5.1.7
PostgreSQL 10.7
```

```shell
GitLab 12.8.6 (5fc76a64537)
GitLab Shell 11.0.0
GitLab Workhorse v8.21.0
GitLab API v4
GitLab Pages 1.16.0
Ruby 2.6.5p114
Rails 6.0.2
PostgreSQL 10.12
```

## 其他常用命令

下面仅仅列出了一些常用的运维命令，gitlab 还封装了很多功能强大的构建脚本，具体请查看参考资料中的 `rake tasks`。

```bash
# 启动 gitlab 所有组件;若要单独启动某个组件，请在后面添加组件名称
gitlab-ctl start
# 停止 gitlab 所有组件
gitlab-ctl stop
# 重启 gitlab 所有组件
gitlab-ctl restart
# 查看 gitlab 各个组件状态
gitlab-ctl status
# 重新生成生成配置文件（修改某项配置后，需要执行该命令）
gitlab-ctl reconfigure
# 查看 gitlab 各个组件版本
gitlab-rake gitlab:env:info
# 检查 gitlab 各个组件
gitlab-rake gitlab:check SANITIZE=true
# 更新 postgresql（具体更新到什么版本请参考文档）
# https://docs.gitlab.com/omnibus/package-information/postgresql_versions.html
gitlab-ctl pg-upgrade
```

## 参考资料

- [omnibus](https://docs.gitlab.com/omnibus/)
- [omnibus maintenance](https://docs.gitlab.com/omnibus/maintenance/)
- [backup_restore](https://docs.gitlab.com/ee/raketasks/backup_restore.html)
- [rake tasks](https://docs.gitlab.com/ee/raketasks/)
