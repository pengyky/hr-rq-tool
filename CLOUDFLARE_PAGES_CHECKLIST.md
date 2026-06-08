# Cloudflare Pages 上线清单

适用于 `hr-rq-tool` 这个纯静态网页项目。

## 一、上线前本地检查

1. 确认项目目录包含：

- `index.html`
- `README.md`
- `favicon.svg`
- `og-image.svg`

2. 本地打开 `index.html`，检查以下功能：

- 输入参数可正常计算
- 训练区间、详情卡片、表格联动正常
- URL 参数会自动更新
- 刷新页面后能从 URL 恢复状态
- `复制分享链接` 按钮可用

3. 检查页面头部 meta 信息：

- `title`
- `description`
- `og:title`
- `og:description`
- `og:image`
- `twitter:image`

## 二、Git 仓库准备

1. 将当前目录初始化为独立 Git 仓库（如果尚未初始化）
2. 确认仓库根目录直接包含 `index.html`
3. 提交当前文件并推送到 GitHub、GitLab 或 Bitbucket

## 三、Cloudflare Pages 创建步骤

1. 登录 Cloudflare Dashboard
2. 进入 `Workers & Pages`
3. 点击 `Create application`
4. 选择 `Pages`
5. 选择 `Connect to Git`
6. 授权并选择当前仓库

## 四、构建配置

本项目为纯静态页面，推荐配置：

- Framework preset: `None`
- Build command: 留空
- Build output directory: `.`

如果仓库根目录就是当前项目目录，Root directory 留空即可。

## 五、首次部署后检查

1. 打开 `*.pages.dev` 默认域名
2. 检查桌面端显示是否正常
3. 检查移动端显示是否正常
4. 测试 URL 分享参数，例如：

```text
?restHR=60&age=35&formula=tanaka&maxHR=190&zone=T
```

5. 检查 favicon 是否显示
6. 检查分享图资源 `og-image.svg` 是否能直接访问

## 六、准备正式分享前建议

1. 如果要长期公开使用，建议绑定自定义域名
2. 建议在社交平台或聊天工具里测试链接预览效果
3. 如后续要更好的链接预览，可把 `og-image.svg` 升级为 PNG 格式分享图

## 七、后续更新流程

1. 本地修改项目文件
2. 提交到 Git 仓库
3. 推送到远端
4. Cloudflare Pages 自动触发重新部署

## 八、当前作者信息

- 设计者：Charles Peng
- 联络邮箱：pengpcy@qq.com
