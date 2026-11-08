# InvoiceAI – Vercel & Vercel Postgres Deployment Guide

This guide details how **InvoiceAI** is hosted on **Vercel** with **Vercel Postgres (vercel.db)** for the database, **Vercel Serverless Functions** for the NestJS backend, and **Vercel** for the React Vite frontend.

---

## 🌐 Current Deployment Status

* **GitHub Repository:** [Chanuka-Dushan/Ai-Invoice-Management-System](https://github.com/Chanuka-Dushan/Ai-Invoice-Management-System) (Latest `main` branch pushed and up-to-date)
* **Frontend Live Production URL:** [https://frontend-woad-sigma-25.vercel.app](https://frontend-woad-sigma-25.vercel.app)
* **Vercel Project Dashboard:** [https://vercel.com/dushan-chanukas-projects/frontend](https://vercel.com/dushan-chanukas-projects/frontend)

---

## 🗄️ 1. Setting up Vercel Postgres (`vercel.db`)

Vercel provides managed, serverless PostgreSQL powered by Neon.

### Steps to Create Vercel Postgres:
1. Log into your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click on the **Storage** tab in the top navigation bar (or visit [vercel.com/dashboard/stores](https://vercel.com/dashboard/stores)).
3. Click **Create Database** and select **Postgres**.
4. Configure your database:
   * **Database Name:** `invoiceai-db`
   * **Region:** Choose the region closest to you (e.g., `Singapore (sin1)` or `Washington, D.C. (iad1)`).
5. Click **Create**.
6. Once created, click on the **.env.local** tab in the database dashboard to view your credentials:
   * `POSTGRES_PRISMA_URL` (pooled connection)
   * `POSTGRES_URL_NON_POOLING` (direct connection for schema migrations)
   * `DATABASE_URL`

### Pushing Schema to Vercel Postgres:
From your local terminal, run the following command to push all 18 tables directly to your Vercel Postgres instance:
```bash
cd backend
$env:DATABASE_URL="postgres://default:your-password@your-pooler.postgres.vercel-storage.com:5432/verceldb?sslmode=require"
npm run prisma:push:pg
```
*(On Linux/macOS, replace `$env:DATABASE_URL="..."` with `DATABASE_URL="..."`)*.

To seed the initial demo data (Super Admin & sample company):
```bash
npx ts-node prisma/seed.ts
```

---

## ⚙️ 2. Deploying the Backend on Vercel

The backend is configured with `@nestjs/platform-express` and an automated serverless handler at `backend/api/index.ts`.

### Steps:
1. Go to [Vercel New Project](https://vercel.com/new).
2. Under **Import Git Repository**, select `Chanuka-Dushan/Ai-Invoice-Management-System`.
3. Configure the Project:
   * **Project Name:** `invoiceai-backend`
   * **Framework Preset:** `Other`
   * **Root Directory:** Click **Edit** and select `backend`.
4. **Build & Development Settings:**
   * **Build Command:** `npm run vercel-build` (automatically executes `prisma generate && nest build`)
   * **Output Directory:** `dist`
5. **Environment Variables:**
   Add the following variables in the Vercel project settings:
   | Variable Name | Value / Description |
   | :--- | :--- |
   | `DATABASE_URL` | Your Vercel Postgres connection string |
   | `JWT_SECRET` | A secure random string (e.g. `inv_jwt_prod_secret_2026`) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `OPENROUTER_API_KEY` | Your OpenRouter API key |
   | `OPENROUTER_MODEL` | `openai/gpt-4o-mini` |
   | `APP_URL` | `https://frontend-woad-sigma-25.vercel.app` |
   | `PORT` | `4000` |
6. Click **Deploy**. Vercel will assign a production URL (e.g., `https://invoiceai-backend.vercel.app`).

---

## 🎨 3. Connecting Frontend to the Live Backend

1. Go to your frontend project settings: [https://vercel.com/dushan-chanukas-projects/frontend/settings/environment-variables](https://vercel.com/dushan-chanukas-projects/frontend/settings/environment-variables)
2. Add the environment variable:
   * **Key:** `VITE_API_URL`
   * **Value:** `https://your-backend-project.vercel.app` (your backend Vercel URL)
3. Trigger a redeployment from the **Deployments** tab by clicking **Redeploy** on the latest deployment.

---

## 🛡️ Git & Ignored Files Verification

The `.gitignore` has been carefully configured to ensure security and prevent accidental exposure:
* **Included in Git:** Clean source code, TypeScript configuration, package manifests, and sample environment templates (`.env.example`).
* **Excluded from Git:** `node_modules/`, `dist/`, local `.env` secrets, uploaded user files, temporary PDFs, and IDE caches.
