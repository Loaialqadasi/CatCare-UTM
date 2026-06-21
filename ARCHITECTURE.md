# CatCare UTM — Architecture

This document explains the high-level architecture and the "why" behind the
major design choices. For day-to-day setup, see `README.md`. For deployment,
see `DEPLOYMENT-GUIDE.md`.

## High-level diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (User)                            │
│  Next.js 16 app on Vercel ─── HTTPS ───┐                        │
└────────────────────────────────────────┼────────────────────────┘
                                         │ HttpOnly cookies:
                                         │   token (15 min)
                                         │   refreshToken (7 d)
                                         │ + X-CSRF-Token header
                                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Express + TypeScript Backend (Render)               │
│                                                                  │
│  Request pipeline:                                               │
│    Helmet → CORS → Cookies → Logger → RateLimit →                │
│    Auth (optional) → CSRF → Validation → Route → Response        │
│                                                                  │
│  Each route follows:                                             │
│    Route → Controller → Service → Repository (pg) → DB           │
│                              ↓                                    │
│                          audit() (non-blocking)                  │
└──────────────┬──────────────────────────────────┬────────────────┘
               │                                  │
               ▼                                  ▼
   ┌──────────────────┐                ┌──────────────────┐
   │ PostgreSQL       │                │ Supabase Storage │
   │ (Supabase DB)    │                │  (uploads bucket)│
   └──────────────────┘                └──────────────────┘
```

## Layered backend

The backend follows a classic three-layer architecture per module:

```
cats.routes.ts       ← Express route + middleware chain + Zod schema binding
    ↓
cats.controller.ts   ← HTTP-only concerns (parse params, call service, send response)
    ↓
cats.service.ts      ← Business rules (validation, side effects, audit hooks)
    ↓
cats.repository.ts   ← Pure data access (parameterized SQL via pg.Pool)
    ↓
PostgreSQL
```

**Why this matters:** keeping HTTP, business, and data layers separate makes
each piece testable in isolation. The controller doesn't know about SQL. The
repository doesn't know about HTTP. The service orchestrates both.

## Database connection

`database.ts` is the single point of contact with Postgres. It exports one
shared `pg.Pool` (`db`), configured for:

1. **IPv4-forced DNS** — Render's containers can't route IPv6 to Supabase.
   `dns.setDefaultResultOrder('ipv4first')` plus a custom `lookup` function
   forces IPv4 resolution.
2. **SSL with `rejectUnauthorized=false`** — Supabase's pooler (port 6543)
   uses a self-signed cert that Node's trust store rejects. The connection
   is still TLS-encrypted; we just skip identity verification.
3. **`DB_SSL_REJECT_UNAUTHORIZED=true`** — flip this to enforce cert
   verification when using the direct connection (port 5432) which has a
   proper CA-signed cert.

## Migrations

`migrate.ts` runs on every backend boot:

1. Ensures the `schema_migrations` table exists.
2. Reads all `migrations/*.sql` files in numeric order.
3. For each file not yet recorded in `schema_migrations`, executes it inside
   a transaction and records the filename.
4. If any migration fails, the server **does not start** — fail-fast
   prevents a broken schema from serving traffic.

All migrations are **idempotent** (`CREATE TABLE IF NOT EXISTS`,
`CREATE INDEX IF NOT EXISTS`, `ALTER TYPE ... ADD VALUE IF NOT EXISTS`).
This is critical because Supabase's free tier occasionally restarts the
backend mid-migration, and idempotent migrations make re-runs safe.

## Authentication & sessions

### Token lifecycle
```
1. User submits login form
2. Backend verifies bcrypt hash → issues:
     - access token (JWT, 15 min) → set as HttpOnly cookie 'token'
     - refresh token (JWT, 7 d)   → set as HttpOnly cookie 'refreshToken'
3. Backend stores SHA-256(refreshToken) in refresh_tokens table
4. Frontend stores user object in Zustand (no token in JS memory)
5. On every API call, browser auto-sends cookies
6. When access token expires, frontend calls /api/auth/refresh
   - Backend verifies refresh token against DB
   - Issues new access token
7. On logout, backend revokes the refresh token row and clears cookies
```

### Why cookies (not Authorization header)?
- **XSS protection**: HttpOnly cookies can't be read by JavaScript. Even if
  an attacker injects a script, they can't exfiltrate the token — they can
  only make requests on the user's behalf, which CSRF protection blocks.
- **Automatic refresh**: the browser handles cookie attachment; the frontend
  doesn't need to manage tokens in memory or localStorage.

### CSRF: per-session double-submit
The CSRF token is bound to either:
- The user's ID (for authenticated requests), or
- An anonymous `catcare-session-id` cookie (for unauthenticated requests like
  login/register).

The `csrfProtection` middleware checks that the `X-CSRF-Token` header matches
the cookie-derived expected value. Tokens are not interchangeable between
users.

## RBAC

Roles have a rank:
```
student (0) < volunteer (1) < manager (2) < admin (3)
```

The `requireRole(minRole)` middleware grants access to anyone at or above
the rank. The `hasMinRole(userRole, minRole)` helper does the same check in
frontend code.

See `README.md → RBAC Matrix` for the full capability breakdown.

## Audit log

Every security-relevant action writes a row to `audit_log`:

| Field           | Example                                  |
|-----------------|------------------------------------------|
| `actor_user_id` | 1                                        |
| `actor_email`   | admin@utm.my                             |
| `action`        | `user.role.update`                       |
| `target_type`   | `user`                                   |
| `target_id`     | `42`                                     |
| `metadata`      | `{"oldRole":"student","newRole":"manager"}` |
| `ip_address`    | 1.2.3.4                                  |
| `user_agent`    | Mozilla/5.0 ...                          |
| `created_at`    | 2026-06-19 10:30:00+00                   |

Failures are logged via pino but **never** block the request — a broken
audit log must not break the user flow.

## Soft delete

Cats and emergencies use a `deleted_at TIMESTAMPTZ NULL` column:
- `DELETE /api/cats/:id` sets `deleted_at = NOW()`
- `GET /api/cats` filters `WHERE deleted_at IS NULL` (with a partial index
  for performance)
- `PATCH /api/cats/:id/restore` clears `deleted_at`

This preserves referential integrity (foreign keys to deleted cats still
work for historical records) and gives admins an "undo" button.

## Frontend architecture

### App Router structure
```
app/
├── (auth)/          ← Route group: public auth pages (no sidebar)
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   └── reset-password/
├── (main)/          ← Route group: authenticated app (with sidebar)
│   ├── admin/       ← Admin/manager panel (RBAC-guarded)
│   ├── cats/
│   ├── dashboard/
│   ├── donations/
│   ├── emergencies/
│   ├── map/
│   ├── profile/
│   └── volunteers/
├── layout.tsx       ← Root layout (theme provider, toaster)
└── page.tsx         ← Landing page
```

### State management
- **Zustand** for global state (current user, sidebar state) — see
  `lib/store.ts`.
- **Local `useState`** for component-specific state (forms, dialogs).
- **Server state** lives in the components (fetch on mount, refetch on
  mutation). No React Query — the data is simple enough that direct
  `useEffect` + `useState` is fine.

### API client
`lib/api-client.ts` is a typed wrapper around `fetch` that:
- Adds `credentials: 'include'` (sends cookies cross-origin)
- Adds `X-CSRF-Token` header (fetched once from `/api/csrf-token`)
- On 401, automatically tries `/api/auth/refresh` once and retries
- On refresh failure, logs out and redirects to `/login`

## Map module

The campus map (`app/(main)/map/utm-map.tsx`) uses `react-leaflet`. Key
features:

- **Cat markers** color-coded by health status (`healthy`=green,
  `needs_attention`=amber, `injured`=red, `unknown`=grey)
- **Emergency markers** with red pin and `!` symbol
- **21 campus buildings** with type-based colors (faculty, residential,
  admin, library, mosque, sports, food, transport, gate)
- **Building search** with type-filter pills
- **Click-to-pin** location picker (`components/map/location-picker.tsx`)
  used in the Create Cat and Create Emergency forms

The geocoding endpoint (`/api/map/geocode`) is a server-side proxy to
Nominatim (OpenStreetMap) with rate limiting and Malaysia bounding box
restriction — prevents abuse and ensures results are local.

## Performance

- **Indexes**: high-frequency query paths have composite indexes (e.g.
  `(status, created_at DESC)` for donations dashboard, `(priority, created_at
  DESC) WHERE deleted_at IS NULL` for emergency priority feed).
- **Partial indexes**: soft-deleted rows are excluded from partial indexes,
  keeping the hot path fast.
- **Trigram indexes**: `pg_trgm` GIN indexes on `cats.nickname` and
  `cats.location_name` enable fast ILIKE search.
- **Connection pool**: `pg.Pool` with `max=10` handles concurrent requests
  without exhausting DB connections.
- **Lazy loading**: Leaflet (and the LocationPicker) are dynamically
  imported only on pages that need them.
- **Code splitting**: Next.js App Router automatically code-splits per
  route.

## Observability

- **pino** structured JSON logs — easy to ship to Datadog/LogDNA later.
- **Request ID** — every request gets a unique ID logged with every line
  (plumbing in `app.ts`).
- **Audit log** — see above.
- **Error middleware** — converts known errors (AuthenticationError,
  AuthorizationError, ValidationError, NotFoundError) into proper HTTP
  responses with consistent JSON shape. Unknown errors are logged with
  stack trace and returned as 500.
