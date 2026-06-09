# PromptManager

A shared prompt manager built with React, Vite, and Supabase.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Create `.env.local` with your Supabase frontend credentials:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   Then fill in:

   ```text
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   ```

3. Start the local development server:

   ```powershell
   npm run dev
   ```

4. Open:

   ```text
   http://localhost:3000
   ```

## Check Before Deploy

Run the complete local check before committing:

```powershell
npm run check
```

This runs TypeScript validation and a production build.

## Debug And Deploy Workflow

Use [DEBUG_WORKFLOW.md](./DEBUG_WORKFLOW.md) for the standard local-debug, GitHub, hosting, and Supabase workflow.

## Deployment

Use [DEPLOYMENT.md](./DEPLOYMENT.md) for the Tencent CloudBase deployment plan, or [CLOUDBASE_DEPLOYMENT_GUIDE.zh-CN.md](./CLOUDBASE_DEPLOYMENT_GUIDE.zh-CN.md) for the Chinese step-by-step guide. The app is deployed as a static Vite build from GitHub Actions to CloudBase static website hosting at `/`.

GitHub Actions requires these repository Secrets:

```text
TCB_SECRET_ID
TCB_SECRET_KEY
TCB_ENV_ID
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

The Supabase values are injected during `npm run build` because Vite reads `import.meta.env.VITE_*` at build time.

For manual hosting setup, configure these frontend environment variables on the active host:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Do not add a Supabase `service_role` key to frontend code or frontend hosting environments.
