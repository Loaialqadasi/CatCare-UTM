# CatCare UTM — Supabase Database & Storage Setup Guide

This guide walks you through setting up Supabase as the database and file
storage for CatCare UTM. If you already have Supabase set up, jump to
[Troubleshooting](#troubleshooting).

## Why Supabase?

| Need                  | Supabase provides                          |
|-----------------------|--------------------------------------------|
| PostgreSQL database   | Free tier: 500MB, full SQL access          |
| File storage          | Free tier: 1GB, public buckets for images  |
| Auto backups          | Daily snapshots, 7-day retention (free)    |
| Connection pooling    | PgBouncer pooler (port 6543) optional      |
| Dashboard             | SQL editor, table browser, logs            |

For a university capstone, the free tier is more than enough.

---

## Step 1 — Create the project

1. Go to https://supabase.com/dashboard
2. Click **New project**
3. Fill in:
   - **Name:** `catcare-utm` (or whatever you prefer)
   - **Database Password:** click **Generate a password** → **copy it and
     save it somewhere safe** — Supabase will NOT show it again
   - **Region:** `Southeast Asia (Singapore)` — closest to Malaysia
   - **Pricing Plan:** Free
4. Click **Create new project**
5. Wait ~2 minutes for provisioning (status bar at top of dashboard)

## Step 2 — Create the database schema

1. In the Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New query**
3. Open the file `backend/catcare-full-setup.sql` from this repo
4. Copy the **entire** file contents
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)

You should see "Success. No rows returned." in the bottom panel.

The script:
- Creates enum types (`user_role`, `cat_health_status`, etc.)
- Creates all tables (`users`, `cats`, `emergencies`, `donations`,
  `care_history`, `audit_log`)
- Creates all indexes (including partial indexes for soft-delete)
- Creates the `set_updated_at()` trigger function

All statements use `IF NOT EXISTS`, so re-running is safe.

## Step 3 — (Optional) Load seed data

For development/testing, load the seed data:

1. In SQL Editor → **New query**
2. Paste the contents of `backend/seed-dev.sql`
3. Click **Run**

This creates 3 test users (password `password123` for all):
- `admin@utm.my` (admin role)
- `manager@utm.my` (manager role)
- `student@graduate.utm.my` (student role)

Plus 8 sample cats, 6 emergencies, 5 donations, and 4 care history entries.

> ⚠️ **Never run `seed-dev.sql` in production!** The passwords are public.

## Step 4 — Create the Storage bucket

Cat photos are stored in Supabase Storage.

1. In the dashboard, click **Storage** (left sidebar)
2. Click **New bucket**
3. Fill in:
   - **Name:** `uploads`
   - **Public bucket:** ✅ ON (so browser can display uploaded images
     without auth)
4. Click **Save**

The backend will auto-create this bucket on first boot if you forget, but
it's safer to create it manually with the right public setting.

## Step 5 — Collect credentials

You'll need these for the Render backend environment variables.

### 5.1 Project URL and API keys
1. Click the gear icon (bottom-left) → **Project Settings**
2. Click **API** in the left sidebar
3. Copy these values:

| Field in Supabase                | Env var on Render                  |
|----------------------------------|------------------------------------|
| **Project URL**                  | `SUPABASE_URL`                     |
| **Project URL** (same value)     | `NEXT_PUBLIC_SUPABASE_URL`         |
| **anon public** key              | `NEXT_PUBLIC_SUPABASE_ANON_KEY`    |
| **service_role** key             | `SUPABASE_SERVICE_ROLE_KEY`        |

### 5.2 Database connection string
1. In **Project Settings** → **Database**
2. Look for **Connection string** section
3. Pick the **URI** format
4. You'll see something like:
   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
5. Replace `[YOUR-PASSWORD]` (including brackets) with the database password
   you saved in Step 1

### 5.3 Which connection string to use?

Supabase offers two:

| Type    | Host                                   | Port | When to use                                  |
|---------|----------------------------------------|------|----------------------------------------------|
| Pooler  | `aws-0-xxx.pooler.supabase.com`        | 6543 | Serverless functions, many short connections |
| Direct  | `db.xxx.supabase.co`                   | 5432 | Long-running servers (Render, Railway, VPS)  |

**For Render backend, use the Direct connection.** Render is a long-running
process that holds open connections — pooling adds overhead without benefit.
Also, the direct connection uses IPv4, which Render's network handles
reliably (the pooler sometimes resolves to IPv6 which Render can't reach).

So your final `DATABASE_URL` looks like:
```
postgresql://postgres:YOUR-PASSWORD@db.bpuxvbzrgymxlnsnarpr.supabase.co:5432/postgres
```

(Note: for the direct connection, the user is just `postgres`, not
`postgres.project-ref`.)

## Step 6 — Test the connection

Before configuring Render, test that your connection string works locally.

### Using psql (if installed)
```bash
PGPASSWORD='YOUR-PASSWORD' psql \
  "host=db.YOUR-PROJECT.supabase.co port=5432 dbname=postgres user=postgres sslmode=require" \
  -c "SELECT NOW();"
```

You should see a timestamp. If you see "password authentication failed",
your password is wrong — reset it in Supabase → Project Settings → Database
→ Reset database password.

### Using Node.js
```bash
DATABASE_URL="postgresql://postgres:YOUR-PASSWORD@db.YOUR-PROJECT.supabase.co:5432/postgres" \
node -e "
  const { Pool } = require('pg');
  const p = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  p.query('SELECT NOW()')
    .then(r => { console.log('OK', r.rows[0]); process.exit(0); })
    .catch(e => { console.log('FAIL', e.message); process.exit(1); });
"
```

## Step 7 — Apply migrations (if any new ones)

The backend runs migrations automatically on every boot via `migrate.ts`.
When you deploy a new backend version that includes a new
`migrations/0NN_*.sql` file, it will be applied automatically.

To verify migrations ran:
```sql
SELECT * FROM schema_migrations ORDER BY applied_at DESC LIMIT 10;
```

---

## Troubleshooting

### "password authentication failed for user postgres"

The `DATABASE_URL` password doesn't match what Supabase has. **The Supabase
postgres user password is NOT the same as your Supabase account login
password.**

**Fix:**
1. Supabase → Project Settings → Database
2. Click **Reset database password**
3. Copy the new password immediately (shown once)
4. Update `DATABASE_URL` on Render with the new password
5. URL-encode any special characters: `@` → `%40`, `#` → `%23`, etc.

### "connect ENETUNREACH ... :5432" or ":6543"

Render's container is trying IPv6 and can't reach Supabase. The
`database.ts` file already calls `dns.setDefaultResultOrder('ipv4first')`
to fix this, but if you still see this error:

**Fix:** Make sure you're using the **direct** connection string
(`db.xxx.supabase.co:5432`), not the pooler
(`aws-0-xxx.pooler.supabase.com:6543`). The pooler sometimes resolves to
IPv6 which Render's network can't route.

### "self-signed certificate in certificate chain"

Supabase's pooler (port 6543) uses a self-signed cert that Node's trust
store rejects.

**Fix:** Set `DB_SSL_REJECT_UNAUTHORIZED=false` on Render. The connection
is still TLS-encrypted; we just skip identity verification. This is the
standard workaround documented by Supabase.

If you're using the direct connection (port 5432), you can set
`DB_SSL_REJECT_UNAUTHORIZED=true` for stricter security — the direct
connection uses a proper CA-signed cert.

### "relation does not exist"

You forgot to run `catcare-full-setup.sql` in Supabase.

**Fix:** Go to Supabase → SQL Editor → paste the entire contents of
`backend/catcare-full-setup.sql` → Run.

### Can't see uploaded cat photos

Storage bucket isn't public, or the URL is wrong.

**Fix:**
1. Supabase → Storage → click `uploads` bucket → **Edit bucket**
2. Make sure **Public bucket** is ON
3. Verify the photo URL in the cats table:
   ```sql
   SELECT nickname, photo_url FROM cats LIMIT 5;
   ```
4. The URL should look like
   `https://YOUR-PROJECT.supabase.co/storage/v1/object/public/uploads/cat-xxx.jpg`

### Storage upload returns 403

The backend doesn't have the `service_role` key set, or it's wrong.

**Fix:** Supabase → Project Settings → API → copy the **service_role** key
(NOT the anon key). Set it as `SUPABASE_SERVICE_ROLE_KEY` on Render.

### Free tier DB is full

Supabase free tier is 500MB. If you hit the limit:

1. Supabase → Settings → Database → **Disk size** (see current usage)
2. Common culprits:
   - `audit_log` growing fast — add a retention policy:
     ```sql
     DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '90 days';
     ```
   - `refresh_tokens` accumulating expired tokens — clean up:
     ```sql
     DELETE FROM refresh_tokens WHERE expires_at < NOW();
     ```
3. Run `VACUUM ANALYZE` after deletes to reclaim space:
   ```sql
   VACUUM ANALYZE audit_log;
   ```

### Database is paused

Supabase free tier pauses the DB after 7 days of inactivity.

**Fix:** Just visit the dashboard — it auto-resumes within ~30 seconds.
Or upgrade to Supabase Pro ($25/mo) for always-on.
