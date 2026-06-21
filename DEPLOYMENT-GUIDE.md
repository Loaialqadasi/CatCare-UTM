# CatCare UTM — Deployment Guide

This guide walks you through deploying the backend (Render) and frontend
(Vercel) for production use. The database (Supabase) and file storage
(Supabase Storage) are provisioned in the same Supabase project.

> **Total time:** ~30 minutes
> **Cost:** $0 (all free tiers)

## Prerequisites

- A GitHub account with the `catcare-backend-` repo pushed
- A Supabase account (https://supabase.com)
- A Render account (https://render.com)
- A Vercel account (https://vercel.com) — sign in with GitHub

## Architecture overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         User's Browser                            │
└───────────────────────────────────┬──────────────────────────────┘
                                    │ HTTPS
                                    ▼
                          ┌────────────────────┐
                          │  Vercel (Frontend) │  Next.js 16
                          │  catcare-frontend  │  Auto-deploys from GitHub
                          └─────────┬──────────┘
                                    │ HTTPS (cookies + CSRF)
                                    ▼
                          ┌────────────────────┐
                          │  Render (Backend)  │  Express + TypeScript
                          │  catcare-backend   │  Web Service (free tier)
                          └────┬───────────┬───┘
                               │           │
                               ▼           ▼
                  ┌────────────────┐  ┌────────────────────┐
                  │  Supabase DB   │  │  Supabase Storage  │
                  │  (PostgreSQL)  │  │  (uploads bucket)  │
                  └────────────────┘  └────────────────────┘
```

---

## Step 1 — Set up Supabase

### 1.1 Create the project
1. Go to https://supabase.com/dashboard → **New project**
2. Name it `catcare-utm`, pick a region close to your users (e.g.
   `ap-southeast-1` Singapore for Malaysia)
3. Set a strong database password — **save it immediately**, you'll need it
4. Wait ~2 minutes for provisioning

### 1.2 Create the database schema
1. In the Supabase dashboard → **SQL Editor** → **New query**
2. Paste the entire contents of `backend/catcare-full-setup.sql`
3. Click **Run** — should succeed with no errors
4. (Optional) Paste `backend/seed-dev.sql` and run it to get test users
   (`admin@utm.my`, `manager@utm.my`, `student@graduate.utm.my` — password
   `password123`)

### 1.3 Create the Storage bucket
1. In the dashboard → **Storage** → **New bucket**
2. Name: `uploads`
3. Toggle **Public bucket** = ON (so browser can display uploaded images)
4. Click **Save**

### 1.4 Collect credentials for later
From **Project Settings** (gear icon bottom-left) → **API**:
- **Project URL** → this is your `SUPABASE_URL`
- **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

From **Project Settings** → **Database** → **Connection string** → **URI**:
- Copy the connection string. Replace `[YOUR-PASSWORD]` with the password
  from step 1.1. This is your `DATABASE_URL`.
- **Recommendation for Render**: use the **direct** connection
  (`db.xxxxx.supabase.co:5432`) rather than the pooler — Render is a
  long-running process and doesn't need PgBouncer, and the direct
  connection uses IPv4 which Render can route reliably.

---

## Step 2 — Deploy backend on Render

### 2.1 Create the Web Service
1. Go to https://dashboard.render.com → **New +** → **Web Service**
2. Connect your GitHub account if not already connected
3. Select the `Loaialqadasi/catcare-backend-` repo
4. Configure:
   - **Name:** `catcare-backend`
   - **Region:** Same as Supabase (Singapore)
   - **Runtime:** Node
   - **Branch:** `main`
   - **Build Command:** `npm install --include=dev && npm run build`
   - **Start Command:** `node dist/server.js`
   - **Instance Type:** Free

5. Click **Advanced** → set the following **Environment Variables**:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgresql://postgres:PASSWORD@db.YOUR-PROJECT.supabase.co:5432/postgres` |
| `DB_SSL_REJECT_UNAUTHORIZED` | `false` |
| `JWT_SECRET` | (run `openssl rand -hex 32` locally, paste output) |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `ENCRYPTION_KEY` | (run `openssl rand -hex 32`, paste output) |
| `CSRF_SECRET` | (run `openssl rand -hex 32`, paste output) |
| `CORS_ORIGIN` | `https://catcare-frontend-inky.vercel.app` (your Vercel URL, set in Step 3) |
| `FRONTEND_URL` | `https://catcare-frontend-inky.vercel.app` |
| `SUPABASE_URL` | `https://YOUR-PROJECT.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | (from Supabase dashboard) |
| `SUPABASE_BUCKET` | `uploads` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR-PROJECT.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (from Supabase dashboard) |

6. Click **Create Web Service**

### 2.2 Verify the deploy
1. Watch the build logs — should see `Build successful 🎉`
2. Watch the deploy logs — should see:
   ```
   {"msg":"Running pending database migrations..."}
   {"msg":"Supabase storage bucket already exists"}
   {"msg":"Server listening on port 10000"}
   ```
3. If you see `password authentication failed` — your `DATABASE_URL`
   password is wrong. Reset it in Supabase → Project Settings → Database →
   Reset database password, then update Render.
4. If you see `ENETUNREACH` (IPv6) — the `database.ts` file already forces
   IPv4, but make sure you're using the **direct** connection string
   (`db.xxxxx.supabase.co:5432`), not the pooler
   (`aws-0-region.pooler.supabase.com:6543`).

### 2.3 Test the health endpoint
Visit `https://catcare-backend.onrender.com/api/health` in your browser.
You should see:
```json
{"success":true,"data":{"status":"ok","service":"catcare-utm-api","db":"connected"}}
```

---

## Step 3 — Deploy frontend on Vercel

### 3.1 Import the project
1. Go to https://vercel.com/dashboard → **Add New** → **Project**
2. Import the same GitHub repo (`Loaialqadasi/catcare-backend-`)
3. Vercel auto-detects Next.js — configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `next build` (default)
   - **Output Directory:** `.next` (default)

4. Under **Environment Variables**, add:
   | Key | Value |
   |-----|-------|
   | `BACKEND_URL` | `https://catcare-backend.onrender.com` (no `/api` suffix) |

   > **Why `BACKEND_URL` instead of `NEXT_PUBLIC_API_URL`?**
   > `BACKEND_URL` triggers the Next.js rewrite proxy (configured in
   > `next.config.ts`). The browser calls `/api/*` on the **same origin** as
   > the frontend, and Next.js proxies the request to the backend. This makes
   > all cookies first-party, avoiding the cross-origin `SameSite=None`
   > third-party cookie blocking that prevents login on Chrome 120+, Safari,
   > and Firefox. **This is the recommended setup.**
   >
   > Only use `NEXT_PUBLIC_API_URL` for local debugging — it makes the browser
   > call the backend directly (cross-origin), which may fail in production due
   > to third-party cookie restrictions.

5. Click **Deploy**

### 3.2 Verify
1. Visit your Vercel URL (e.g. `https://catcare-frontend-inky.vercel.app`)
2. You should see the landing page
3. Click **Sign In** → log in with `admin@utm.my` / `password123`
4. Should land on the dashboard

### 3.3 Update Render CORS with Vercel URL
Once Vercel gives you a stable URL, go back to Render → Environment →
update `CORS_ORIGIN` and `FRONTEND_URL` to your actual Vercel URL.

> **Note:** With the Next.js rewrite proxy, CORS is no longer strictly
> required because the browser only makes same-origin requests. However,
> keeping `CORS_ORIGIN` configured is still useful for direct API access
> (e.g. Postman, mobile apps, or debugging).

---

## Step 4 — Verify end-to-end

1. Visit the Vercel frontend URL
2. Log in as `admin@utm.my` / `password123`
3. Should land on `/dashboard` with stats cards
4. Click **All Cats** → see seeded cats
5. Click **Campus Map** → see UTM campus with markers
6. Click **Admin Panel** → user management works

If any of these fail:
- Check the browser DevTools Network tab for failed requests
- Check Render logs for backend errors
- Check Supabase → Logs → Database for SQL errors

---

## Common issues & fixes

### "password authentication failed for user postgres"
- Your `DATABASE_URL` password is wrong.
- Fix: Supabase → Project Settings → Database → **Reset database password**.
  Update `DATABASE_URL` on Render with the new password (URL-encode special
  characters like `@` → `%40`).

### "connect ENETUNREACH ... :5432"
- Render's container is trying IPv6 and can't reach Supabase.
- Fix: Make sure you're using the **direct** connection string
  (`db.xxxxx.supabase.co:5432`), not the pooler. The `database.ts` file
  forces IPv4 DNS resolution, which should fix this — but the pooler still
  sometimes resolves to IPv6.

### "self-signed certificate in certificate chain"
- You're using the Supabase pooler (port 6543) which has a self-signed cert.
- Fix: Set `DB_SSL_REJECT_UNAUTHORIZED=false` on Render. The connection is
  still TLS-encrypted; we just skip identity verification.

### CSRF token 403 on state-changing requests
- Cookies aren't being sent cross-origin.
- Fix: Make sure `CORS_ORIGIN` on Render includes your exact Vercel URL
  (no trailing slash). Make sure the browser is loading the frontend from
  the Vercel URL (not localhost).

### Frontend can't reach backend
- Check `BACKEND_URL` on Vercel — must be the full URL without `/api` suffix
  (e.g. `https://catcare-backend.onrender.com`). The Next.js rewrite proxy
  appends `/api/*` automatically.
- Check Render service is up (free tier sleeps after 15 min of inactivity —
  first request after sleep takes ~30s to wake).

### Frontend 401 on every request after login
- This should no longer happen with the Next.js rewrite proxy (cookies are
  same-origin). If you're still seeing this:
  1. Make sure you're using `BACKEND_URL` (not `NEXT_PUBLIC_API_URL`) on Vercel.
  2. Clear browser cookies for the Vercel domain and log in again.
  3. Check the browser DevTools Network tab — the request URL should start
     with your Vercel domain (e.g. `https://catcare-frontend-inky.vercel.app/api/auth/login`),
     NOT the Render domain directly.

---

## Production hardening (optional but recommended)

1. **Change the seed passwords** — `password123` is publicly known. Log in
   as admin → Profile → Change Password for each seeded account.
2. **Set up SMTP** — password reset emails won't actually be sent without
   SMTP credentials. Consider Resend, SendGrid, or Mailgun (all have free
   tiers).
3. **Enable log aggregation** — Render's free tier keeps logs for 7 days.
   For longer retention, pipe logs to Logtail, Datadog, or LogDNA via the
   `LOGTAIL_TOKEN` env var.
4. **Upgrade to Render paid tier** — free tier sleeps after 15 min of
   inactivity, causing 30s cold starts. Paid tier ($7/mo) stays warm.
5. **Set up DB backups** — Supabase free tier takes daily snapshots kept
   for 7 days. For more, upgrade Supabase or use `pg_dump` cron.

---

## Update workflow

To deploy a code change:
1. Push to `main` on GitHub
2. Render auto-builds and deploys the backend
3. Vercel auto-builds and deploys the frontend
4. Verify in production

To run a database migration:
1. Add a new file `backend/migrations/0NN_description.sql` (idempotent!)
2. Also update `backend/catcare-full-setup.sql` to mirror the change
3. Commit & push
4. Render auto-runs migrations on next deploy (via `migrate.ts` on boot)

---

## Rollback

### Backend
Render keeps the last few deploys. Dashboard → your service → **Manual
Deploy** → pick a previous commit.

### Frontend
Vercel keeps every deploy. Dashboard → your project → **Deployments** →
click any previous deploy → **Promote to Production**.

### Database
Supabase → Database → Backups → restore from the latest daily snapshot.
For finer-grained control, use `pg_dump` before any risky migration.
