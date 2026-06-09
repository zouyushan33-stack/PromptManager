# PromptManager Deployment

PromptManager is a static Vite app backed by Supabase. The current primary deployment target is Tencent CloudBase static website hosting at the root path `/`.

For a Chinese step-by-step operation guide, see [CLOUDBASE_DEPLOYMENT_GUIDE.zh-CN.md](./CLOUDBASE_DEPLOYMENT_GUIDE.zh-CN.md).

## Standard Build

Use these settings for CloudBase and any manual static hosting fallback:

```text
Project directory: repository root
Install command: npm install --include=optional
Build command: npm run build
Build output directory: dist
Deploy path: /
```

Required frontend build environment variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Never configure a Supabase `service_role` key in frontend hosting environments.

## Primary Platform

Tencent CloudBase is the primary deployment platform.

The GitHub Actions workflow in `.github/workflows/deploy.yml` deploys automatically when `main` is pushed and can also be run manually with `workflow_dispatch`.

Required GitHub Secrets:

```text
TCB_SECRET_ID
TCB_SECRET_KEY
TCB_ENV_ID
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

The workflow uses Node.js 18, installs dependencies with optional packages enabled, validates the Tailwind Linux native binding, builds `dist/`, logs in with CloudBase CLI, and deploys:

```text
tcb hosting deploy ./dist / -e "$TCB_ENV_ID"
```

## CloudBase Console Settings

If configuring CloudBase from the console, use:

```text
Target directory: repository root
Install command: npm install --include=optional
Build command: npm run build
Build output directory: dist
Deploy path: /
```

Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as build environment variables.

## Supabase Auth URLs

Add every active or test host to Supabase Auth URL settings:

```text
http://localhost:3000
https://YOUR_CLOUDBASE_DEFAULT_DOMAIN
https://YOUR_CUSTOM_DOMAIN
```

CloudBase default domains and custom domains both need to be added to Supabase Auth redirect URLs. Keep these URLs updated whenever the production domain changes.

## Troubleshooting

### GitHub Secrets Are Empty

The workflow checks `TCB_SECRET_ID`, `TCB_SECRET_KEY`, `TCB_ENV_ID`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` before installing dependencies. If a secret is missing, add it in GitHub repository settings and rerun the workflow.

### `env not found in list`

Confirm `TCB_ENV_ID` exactly matches the CloudBase environment ID. If you have multiple Tencent Cloud accounts or environments, make sure the `TCB_SECRET_ID` and `TCB_SECRET_KEY` belong to an account that can access that environment.

### Tailwind Native Binding Fails

CloudBase deployment runs on Linux. Keep the install command as:

```text
npm install --include=optional
```

The GitHub Actions workflow also installs and resolves `@tailwindcss/oxide-linux-x64-gnu` explicitly before building.

### Page Is Blank

Confirm `vite.config.ts` has `base: '/'`, the build output contains `dist/index.html`, and CloudBase deploys the contents of `dist/` to `/`.

### Refresh Returns 404

PromptManager currently deploys as a static frontend. If client-side routes are added later, configure CloudBase Hosting to fall back to `/index.html`.

### Supabase Login Fails

Confirm the deployed CloudBase URL is present in Supabase Auth redirect URLs and that the workflow build step received `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Backup Platform

Tencent EdgeOne Pages or another static host can be used as a backup if CloudBase is unavailable. Use the same static build output and the same `VITE_*` frontend environment variables.

## Platform Lock-In Rules

- Keep authentication and data access in Supabase.
- Keep frontend-only configuration in `VITE_*` variables.
- Keep SQL migrations under `supabase/`.
- Do not add CloudBase database or server code unless a feature truly requires it.
