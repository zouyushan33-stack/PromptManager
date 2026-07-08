# Debug Workflow

日常维护时就按下面这个顺序做。

## 1. 本地开发

```powershell
npm run dev
```

## 2. 本地检查

```powershell
npm run check
```

## 3. 查看变更

```powershell
git status --short
git diff --stat
```

## 4. 提交并推送

```powershell
git add .
git commit -m "更新说明"
git push origin main
```

## 5. 部署

推送成功后，GitHub Actions 会自动部署。

## 6. 数据库改动

如果改了 Supabase 表、权限、策略：

1. 在 [supabase/](supabase/) 里更新 SQL
2. 手动到 Supabase SQL Editor 执行
3. 本地验证后再提交
