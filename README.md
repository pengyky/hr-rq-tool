# hr-rq-tool

一个用于展示跑步心率区间、呼吸商 RQ 和供能系统变化关系的静态网页小工具。

## 演示地址

https://sylas.cc.cd

## OG Image 展示

![OG Image](https://raw.githubusercontent.com/pengyky/hr-rq-tool/refs/heads/main/og-image.svg)

## 功能简介

- 基于储备心率法计算跑步训练区间
- 支持 `Fox: 220 - 年龄` 与 `Tanaka: 208 - 0.7 x 年龄` 两种最大心率估算方式
- 支持手动输入实测最大心率，优先级高于估算公式
- 用 SVG 展示训练区间、RQ 和供能系统变化
- 支持点击区间查看详情，兼容移动端交互
- 支持将当前参数和选中区间写入 URL，便于分享

## 本地使用

直接在浏览器中打开 `index.html` 即可使用。

## URL 分享参数

页面会自动把当前状态写入 URL 查询参数，当前支持：

- `restHR`：静息心率
- `age`：年龄
- `formula`：最大心率估算公式，支持 `fox` 和 `tanaka`
- `maxHR`：实测最大心率
- `zone`：当前选中的区间，支持 `D`、`E`、`M`、`T`、`A`、`I`

示例：

```text
?restHR=60&age=35&formula=tanaka&maxHR=190&zone=T
```

## Cloudflare Pages 部署建议

这是一个纯静态页面项目，适合直接部署到 Cloudflare Pages。

### 推荐方式：连接 Git 仓库自动部署

1. 将当前目录推送到 GitHub、GitLab 或 Bitbucket
2. 登录 Cloudflare Dashboard
3. 进入 `Workers & Pages`
4. 选择 `Create application` -> `Pages` -> `Connect to Git`
5. 选择本仓库
6. 构建配置填写：

- Framework preset: `None`
- Build command: 留空
- Build output directory: `.`

7. 点击部署

### 手动上传方式

如果暂时不接 Git，也可以在 Cloudflare Pages 中选择手动上传当前目录中的静态文件。

## 项目入口

- `index.html`：主页面入口

## 作者与联络

- 设计者：Charles Peng
- 邮箱：pengpcy@qq.com
