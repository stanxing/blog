# 前言

记录自己的技术成长，希望能坚持每周记录一篇博客。https://stanxing.github.io/blog/

## 开发

本博客基于 [vuepress](https://vuepress.vuejs.org/zh/guide/#%E5%AE%83%E6%98%AF%E5%A6%82%E4%BD%95%E5%B7%A5%E4%BD%9C%E7%9A%84%EF%BC%9F) 和 [github pages](https://help.github.com/en/github/working-with-github-pages) 构建，使用 [travis-ci](https://docs.travis-ci.com/user/deployment/pages/) 做持续集成。

```shell
npm install
# https://www.vuepress.cn/api/cli.html#%E5%9F%BA%E6%9C%AC%E7%94%A8%E6%B3%95
# vuepress dev --no-cache
# 经测试，dev 模式下，如果 .vuepress/public 存在之前构建过的内容，就算使用了 --no-cache 还是会缓存
# 删掉该目录后，自动保存后前端会实时刷新
npm run dev
```

## 构建

```shell
npm run build
```
