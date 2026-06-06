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

Use [DEBUG_WORKFLOW.md](./DEBUG_WORKFLOW.md) for the standard local-debug, GitHub, Netlify, and Supabase workflow.

## Netlify Environment Variables

Configure these in Netlify before deploying:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Do not add a Supabase `service_role` key to frontend code or Netlify frontend builds.
