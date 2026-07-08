# Deployment

当前项目使用 GitHub Actions 自动部署到 Tencent CloudBase。

## 1. 必备配置

在 GitHub 仓库 Secrets 中配置：

```text
TCB_SECRET_ID
TCB_SECRET_KEY
TCB_ENV_ID
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## 2. 部署流程

```powershell
npm install
npm run build
git add .
git commit -m "更新说明"
git push origin main
```

推送到 `main` 后，GitHub Actions 会自动执行构建和部署。

## 3. 关键点

- 构建产物目录：`dist`
- 部署路径：`/`
- 前端环境变量必须通过 GitHub Secrets 注入
- 不要把 Supabase `service_role` key 放到前端环境

## 4. 常见问题

- Secrets 缺失：检查 GitHub 仓库 Secrets
- 页面空白：检查 `vite.config.ts` 的 `base` 配置
- 登录失败：检查 Supabase Auth Redirect URLs 是否包含当前域名

更多细节见 [CLOUDBASE_DEPLOYMENT_GUIDE.zh-CN.md](CLOUDBASE_DEPLOYMENT_GUIDE.zh-CN.md)。
