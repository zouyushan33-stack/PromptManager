# PromptManager

一个基于 React + Vite + Supabase 的共享 Prompt 管理系统。

## 你要知道的事

- 这是一个“提示词/Prompt 管理”网页
- 本地开发：`npm run dev`
- 本地检查：`npm run check`
- 提交并发布：`git push origin main`

## 最常用命令

```powershell
npm install
npm run dev
npm run check
git add .
git commit -m "更新说明"
git push origin main
```

## 关键文件

- [src/App.tsx](src/App.tsx)：主页面
- [src/hooks/usePrompts.ts](src/hooks/usePrompts.ts)：数据与业务逻辑
- [src/components/PromptModal.tsx](src/components/PromptModal.tsx)：新增/编辑 Prompt 弹窗
- [.github/workflows/deploy.yml](.github/workflows/deploy.yml)：自动部署配置

## 环境变量

在 `.env.local` 中配置：

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## 部署说明

推送到 `main` 后，GitHub Actions 会自动部署。

需要在 GitHub 仓库 Secrets 中配置：

```text
TCB_SECRET_ID
TCB_SECRET_KEY
TCB_ENV_ID
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## 其他文档

- [DEBUG_WORKFLOW.md](DEBUG_WORKFLOW.md)：开发和提交流程
- [DEPLOYMENT.md](DEPLOYMENT.md)：部署和常见问题
- [CLOUDBASE_DEPLOYMENT_GUIDE.zh-CN.md](CLOUDBASE_DEPLOYMENT_GUIDE.zh-CN.md)：CloudBase 中文部署步骤
- [REUSABLE_TEMPLATE_GUIDE.md](REUSABLE_TEMPLATE_GUIDE.md)：后续复用到其他项目时的模板说明
