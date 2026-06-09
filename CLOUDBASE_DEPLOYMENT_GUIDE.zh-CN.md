# PromptManager CloudBase 自动部署指南

本指南用于把 PromptManager 从本地项目部署到腾讯云 CloudBase 静态网站托管。项目仍然是 Vite + React 纯前端，认证和数据继续使用 Supabase。

## 1. 准备信息

部署前先准备以下 5 个值：

```text
TCB_SECRET_ID
TCB_SECRET_KEY
TCB_ENV_ID
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

说明：

- `TCB_SECRET_ID`：腾讯云 API 密钥 SecretId。
- `TCB_SECRET_KEY`：腾讯云 API 密钥 SecretKey。
- `TCB_ENV_ID`：CloudBase 环境 ID。
- `VITE_SUPABASE_URL`：Supabase 项目 URL。
- `VITE_SUPABASE_ANON_KEY`：Supabase 前端匿名密钥。

不要使用或填写 Supabase `service_role` key。它只能用于可信后端，不能放进前端构建或 GitHub Secrets 给静态站使用。

## 2. 本地检查

在项目根目录执行：

```powershell
npm install
npm run lint
npm run build
```

确认构建产物存在：

```text
dist/index.html
dist/assets/*
```

如果本地构建失败，先修复本地问题，再继续配置自动部署。

## 3. 添加 GitHub Secrets

打开 GitHub 仓库：

```text
Settings -> Secrets and variables -> Actions -> New repository secret
```

依次添加：

```text
TCB_SECRET_ID
TCB_SECRET_KEY
TCB_ENV_ID
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

这些值只放在 GitHub Secrets 中，不要写入代码、README、workflow 日志或提交记录。

## 4. 确认自动部署 workflow

仓库中应存在：

```text
.github/workflows/deploy.yml
```

关键配置应包含：

```text
触发分支: main
Node.js: 18
安装命令: npm install --include=optional
构建命令: npm run build
部署命令: tcb hosting deploy ./dist / -e "$TCB_ENV_ID"
```

workflow 的 build 步骤必须注入：

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

原因是 Vite 会在构建阶段读取 `import.meta.env.VITE_*`，所以这些变量必须在 GitHub Actions 构建时可用。

## 5. 推送并触发部署

提交变更后推送到 `main`：

```powershell
git add vite.config.ts README.md DEBUG_WORKFLOW.md DEPLOYMENT.md CLOUDBASE_DEPLOYMENT_GUIDE.zh-CN.md .github/workflows/deploy.yml
git commit -m "Add CloudBase deployment workflow"
git push origin main
```

推送后打开 GitHub：

```text
Actions -> Deploy to Tencent CloudBase
```

检查以下步骤是否通过：

```text
Check required secrets
Install dependencies
Ensure Tailwind Linux native binding
Build
Install CloudBase CLI
Log in to CloudBase
Deploy to CloudBase Hosting
```

也可以在 GitHub Actions 页面手动运行：

```text
Run workflow
```

## 6. CloudBase 控制台配置参考

如果需要在 CloudBase 控制台手动核对配置，使用：

```text
目标目录: 项目根目录
安装命令: npm install --include=optional
构建命令: npm run build
构建产物目录: dist
部署路径: /
```

PromptManager 已在 `vite.config.ts` 中设置：

```text
base: '/'
```

这表示静态资源会按 CloudBase 根路径部署方式生成。

## 7. 配置 Supabase Auth URL

部署成功后，把 CloudBase 访问地址加入 Supabase Auth URL 设置。

需要加入：

```text
http://localhost:3000
https://你的 CloudBase 默认域名
https://你的自定义域名
```

CloudBase 默认域名和自定义域名都要加入。否则登录、注册、邮件跳转或 OAuth 回调可能失败。

## 8. 部署后验证

打开 CloudBase 域名后检查：

```text
首页能正常打开
Supabase 登录正常
Supabase 注册正常
提示词创建正常
提示词编辑正常
提示词删除正常
刷新页面不会出现异常
```

如果后续项目新增前端路由，需要在 CloudBase 静态网站托管中配置回退到：

```text
/index.html
```

## 9. 常见问题

### GitHub Secrets 为空

表现：GitHub Actions 在 `Check required secrets` 阶段失败。

处理方法：回到 GitHub 仓库 Secrets 页面，检查 5 个必需 Secret 是否都已添加，名称是否完全一致。

### `env not found in list`

表现：CloudBase CLI 登录或部署时找不到环境。

处理方法：

- 检查 `TCB_ENV_ID` 是否为正确的 CloudBase 环境 ID。
- 检查 `TCB_SECRET_ID` 和 `TCB_SECRET_KEY` 所属腾讯云账号是否有该环境权限。

### Tailwind native binding 报错

表现：GitHub Ubuntu runner 上构建时报 `@tailwindcss/oxide` native binding 相关错误。

处理方法：

- 安装命令必须使用 `npm install --include=optional`。
- workflow 已额外安装并验证 `@tailwindcss/oxide-linux-x64-gnu`。

### 页面空白

处理方法：

- 确认 `vite.config.ts` 中有 `base: '/'`。
- 确认构建产物中存在 `dist/index.html`。
- 确认 CloudBase 部署的是 `dist/` 内容，并部署到根路径 `/`。

### 刷新页面 404

当前项目没有复杂前端路由。如果以后增加 React Router 等前端路由，需要在 CloudBase 配置静态托管回退到 `/index.html`。

### Supabase 登录失败

处理方法：

- 检查 CloudBase 域名是否加入 Supabase Auth redirect URLs。
- 检查 GitHub Secrets 中的 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 是否正确。
- 重新运行 GitHub Actions，让 Vite 使用正确变量重新构建。

## 10. 安全规则

- 不把腾讯云 `SecretId`、`SecretKey` 写进代码。
- 不把 Supabase `service_role` key 用于前端。
- 不在日志、截图、文档中暴露真实密钥。
- PromptManager 后端数据和认证继续使用 Supabase，不迁移到 CloudBase 数据库。
