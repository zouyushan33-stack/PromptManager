# PromptManager Debug Workflow

Use this workflow for every new feature or bug fix. It keeps feedback fast locally and only uses GitHub plus the active static host after the change is already checked.

## Daily Loop

1. Start the local app:

   ```powershell
   npm run dev
   ```

2. Open the local site:

   ```text
   http://localhost:3000
   ```

3. Make and verify changes locally before deploying.

4. Run the full local check:

   ```powershell
   npm run check
   ```

5. Review the exact files that changed:

   ```powershell
   git status --short
   git diff --stat
   ```

6. Commit and push only after local verification passes:

   ```powershell
   git add <changed-files>
   git commit -m "Short change summary"
   git push origin main
   ```

7. Let the active host deploy from GitHub, then spot-check the production site.

## Roles

- Codex updates code, runs checks, summarizes changed files, and can commit/push when explicitly asked.
- You verify the local page first, then production after the active host deploys.
- Supabase admin changes are kept in `supabase/*.sql` files and run manually in the Supabase SQL Editor.

## Supabase Changes

When a feature needs table, policy, or permission changes:

1. Add or update a SQL file under `supabase/`.
2. Run the SQL manually in Supabase SQL Editor.
3. Verify locally with `npm run dev`.
4. Run `npm run check`.
5. Commit and push the app code plus SQL file.

## When to Use a Branch

Use `main` for small fixes and quick iterations. Use a feature branch when a change is risky, large, or needs review:

```powershell
git checkout -b feature/short-name
git push origin feature/short-name
```

The active host can then provide a preview deploy for that branch or pull request, if preview deployments are enabled.

## Hosting

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the current Tencent CloudBase deployment workflow, required GitHub Secrets, Supabase Auth URL checklist, and hosting troubleshooting notes.
