# CatCare UTM — Campus Cat Management System

> A full-stack web application for managing campus cats, emergency reports,
> donations, volunteers, and an interactive campus map at Universiti Teknologi
> Malaysia (UTM).

[![Backend: Node.js](https://img.shields.io/badge/backend-Node.js%2024-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Frontend: Next.js 16](https://img.shields.io/badge/frontend-Next.js%2016-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![DB: PostgreSQL](https://img.shields.io/badge/db-PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Storage: Supabase](https://img.shields.io/badge/storage-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Language: TypeScript](https://img.shields.io/badge/lang-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Project Structure](#project-structure)
6. [Quick Start](#quick-start)
7. [Environment Variables](#environment-variables)
8. [Database Setup](#database-setup)
9. [Deployment](#deployment)
10. [Testing](#testing)
11. [Security](#security)
12. [RBAC Matrix](#rbac-matrix)
13. [Team](#team)
14. [License](#license)

---

## Overview

CatCare UTM is a community-driven platform that helps UTM students, staff, and
volunteers coordinate the care of the campus cat population. Users can browse
the directory of campus cats, file emergency reports for injured or missing
animals, donate to the food/vet fund, apply to become a verified volunteer,
and explore an interactive Leaflet map of campus landmarks.

The project is built as a university capstone (SCSJ3104 — Software
Construction & Development, Group 02) and follows industry best practices:
typed end-to-end (TypeScript), CI/CD on Render + Vercel, automated migrations,
audit logging, per-session CSRF protection, role-based access control, and
soft-delete data retention.

## Features

### Authentication & Authorization
- Email-restricted registration (`@utm.my` / `@graduate.utm.my` only)
- HttpOnly JWT cookies (15-min access + 7-day refresh)
- Refresh-token rotation stored server-side (revocable)
- Per-session CSRF protection (double-submit cookie pattern)
- Password reset flow (SHA-256 token, 1-hour expiry, single-use)
- Email verification (typed JWT tokens, branded HTML email)
- Four roles: `student`, `volunteer`, `manager`, `admin`

### Cat Management
- CRUD operations with optional photo upload (magic-byte validated)
- Soft-delete with restore capability (preserves audit trail)
- Health-status color coding on map and listing
- Trigram indexes for fuzzy nickname/location search
- Care-history log per cat (feeding, medical, grooming, shelter, rescue)

### Emergency Reporting
- Six emergency types (injury, sickness, missing, feeding_urgent, danger, other)
- Four priority levels (low, medium, high, critical)
- Status workflow (open → in_progress → resolved/cancelled)
- Priority feed for the public dashboard
- Soft-delete with restore

### Donations
- Receipt upload with magic-byte validation
- AES-256-CBC encryption for sensitive donor data at rest
- Admin review workflow (pending → reviewed → approved/rejected)
- Summary dashboard with totals and pending counts

### Volunteer Management
- Application form with validation
- Status workflow (pending → approved/rejected)
- Per-user application history
- Manager-or-admin review interface

### Interactive Campus Map
- Leaflet-based map centered on UTM Skudai campus
- 21 landmark buildings with type filters
- Cat markers color-coded by health status
- Emergency markers with priority indicators
- Building search with autocomplete
- Click-to-pin location picker for cat/emergency forms
- Malaysia-only geocoding (boundary-restricted)

### Admin Tools
- User management: create, update, delete, change role, reset password
- Primary admin (`admin@utm.my`) protected from role change and deletion
- Soft-delete with restore for cats and emergencies
- Audit log of all security-relevant actions

## Tech Stack

| Layer         | Technology                                                |
|---------------|-----------------------------------------------------------|
| Frontend      | Next.js 16, React 18, TypeScript, Tailwind CSS, shadcn/ui |
| Maps          | react-leaflet, Leaflet                                    |
| Backend       | Node.js, Express, TypeScript                              |
| Database      | PostgreSQL (Supabase)                                     |
| ORM/Driver    | node-postgres (`pg`)                                      |
| Auth          | JWT (jsonwebtoken), bcryptjs, HttpOnly cookies            |
| Validation    | Zod (both frontend and backend)                           |
| File Storage  | Supabase Storage                                          |
| Email         | Nodemailer (HTML templates)                               |
| Security      | Helmet, CORS, express-rate-limit, CSRF double-submit      |
| Logging       | pino (structured JSON logs)                               |
| Tests         | Jest, supertest                                           |
| CI/CD         | Render (backend), Vercel (frontend)                       |

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       Browser (User)                              │
│  Next.js 16 app on Vercel ───── HTTPS ─────┐                     │
└────────────────────────────────────────────┼─────────────────────┘
                                             │
                              HttpOnly cookies (token, refreshToken)
                              + X-CSRF-Token header
                                             │
                                             ▼
┌──────────────────────────────────────────────────────────────────┐
│              Express + TypeScript Backend (Render)                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │
│  │ Auth MW      │→│ CSRF MW      │→│ Rate Limiter │              │
│  └──────────────┘ └──────────────┘ └──────────────┘              │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │       Route handlers (Cats/Emergencies/Donations/...)    │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │       Zod validation → Service → Repository (pg)         │    │
│  └──────────────────────────────────────────────────────────┘    │
└────────────┬────────────────────────────────────┬────────────────┘
             │                                    │
             ▼                                    ▼
   ┌──────────────────┐                ┌──────────────────┐
   │ PostgreSQL       │                │ Supabase Storage │
   │ (Supabase DB)    │                │  (uploads bucket)│
   └──────────────────┘                └──────────────────┘
```

### Key Design Decisions

1. **Cookie-based auth over Authorization header** — The frontend and backend
   are on different domains (Vercel ↔ Render), so we use `SameSite=None;
   Secure` HttpOnly cookies. This prevents XSS-based token exfiltration while
   still supporting cross-origin requests.

2. **Per-session CSRF** — CSRF tokens are bound to either the user ID
   (authenticated) or an anonymous session cookie (unauthenticated). This
   prevents token swapping between users.

3. **Soft delete over hard delete** — Cats and emergencies are soft-deleted
   (`deleted_at` column) with a partial index. This preserves data for audits
   and lets admins restore accidentally deleted records.

4. **IPv4-forced DNS** — Render's containers can't route IPv6 to Supabase.
   `database.ts` calls `dns.setDefaultResultOrder('ipv4first')` and passes a
   custom `lookup` function to the pg pool as a belt-and-suspenders fix.

5. **RBAC with role hierarchy** — Roles have a rank (`student=0`,
   `volunteer=1`, `manager=2`, `admin=3`). The `requireRole(minRole)` middleware
   grants access to anyone at or above the rank, eliminating repetitive
   `role === 'admin' || role === 'manager'` checks.

6. **Audit log** — Every security-relevant action (login, role change, user
   delete, password reset) is written to `audit_log` non-blocking. Failures
   are logged but never break the user flow.

## Project Structure

```
catcare-utm/
├── backend/
│   ├── src/
│   │   ├── Layth_Amgad-CCU-S1-01-Auth/          # Auth, RBAC, CSRF, rate limiting
│   │   ├── Loai_Rafaat-CCU-S1-02-Cats/          # Cat CRUD + photo upload
│   │   ├── Youssef_Mostafa-CCU-S1-03-Emergencies/ # Emergency reports
│   │   ├── Layth_Amgad-CCU-S1-28-Donations/     # Donations + admin review
│   │   ├── Mohamed_Amgad-CCU-S1-04-Map/         # Map / geocode proxy
│   │   ├── Mohamed_Abdelgawwad-CCU-S1-04-Foundation/
│   │   │   ├── app.ts                 # Express app setup (Helmet, CORS, cookies)
│   │   │   ├── server.ts              # Entry point
│   │   │   ├── database.ts            # pg Pool (IPv4-forced, SSL-aware)
│   │   │   ├── env.ts                 # Typed environment validation
│   │   │   ├── migrate.ts             # Auto-runs pending migrations on boot
│   │   │   ├── audit.ts               # Non-blocking audit logger
│   │   │   ├── csrf.ts                # Per-session CSRF (double-submit)
│   │   │   ├── errors.ts              # Typed HTTP errors
│   │   │   ├── logger.ts              # pino structured logger
│   │   │   ├── mailer.ts              # Nodemailer + HTML templates
│   │   │   ├── supabase-storage.ts    # Supabase Storage uploads
│   │   │   ├── upload.ts              # Multer (in-memory) + magic-byte check
│   │   │   └── types.ts               # UserRole, ROLE_RANK, hasMinRole()
│   │   ├── __tests__/                 # Jest + supertest integration tests
│   │   └── server.ts
│   ├── migrations/                    # 001-017 idempotent SQL migrations
│   ├── catcare-full-setup.sql         # Full schema (for fresh installs)
│   ├── seed-dev.sql                   # Idempotent dev seed (3 users + sample data)
│   ├── reset-dev.sql                  # Truncate-and-reset for development
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/                # Login, register, forgot/reset password
│   │   │   ├── (main)/                # Authenticated pages
│   │   │   │   ├── admin/             # Admin/manager panel (RBAC-guarded)
│   │   │   │   ├── cats/              # Cat listing, detail, create
│   │   │   │   ├── dashboard/         # Personalised dashboard
│   │   │   │   ├── donations/         # My donations + create
│   │   │   │   ├── emergencies/       # Emergency listing + create
│   │   │   │   ├── map/               # Interactive campus map
│   │   │   │   ├── profile/           # Profile + change password
│   │   │   │   └── volunteers/        # Volunteer application
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx               # Landing page
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui primitives
│   │   │   ├── layout/                # Sidebar, header
│   │   │   ├── auth/                  # Forms
│   │   │   ├── cats/                  # Cat-card, detail, list, create-form
│   │   │   ├── emergencies/           # Cards, list, detail, create
│   │   │   ├── donations/             # Forms, detail, dashboard
│   │   │   ├── dashboard/             # Stat cards, recent feeds
│   │   │   ├── map/                   # LocationPicker (click-to-pin)
│   │   │   └── profile/               # User profile
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── api-client.ts          # Typed fetch wrapper with auto-refresh
│   │   │   ├── store.ts               # Zustand global store
│   │   │   ├── types.ts               # Frontend types + ROLE_META + hasMinRole
│   │   │   ├── validators.ts          # Frontend password validation
│   │   │   └── utils.ts               # shadcn helpers (cn)
│   └── package.json
│
├── DEPLOYMENT-GUIDE.md                # Step-by-step Render + Vercel deploy
├── SUPABASE-DATABASE-SETUP-GUIDE.md   # Supabase DB + Storage setup
└── README.md                          # This file
```

## Quick Start

### Prerequisites
- Node.js 20+ (24 recommended)
- A PostgreSQL database (local, Supabase, Neon, or Render)
- A Supabase project (for file storage)

### 1. Clone & install
```bash
git clone https://github.com/Loaialqadasi/catcare-backend-.git
cd catcare-backend-
npm install --include=dev
```

### 2. Configure environment
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your Supabase credentials (see Environment Variables below)
```

### 3. Initialize the database
Run `catcare-full-setup.sql` in your Supabase SQL Editor (or `psql`), then
optionally run `seed-dev.sql` to get 3 test users (`admin@utm.my`,
`manager@utm.my`, `student@graduate.utm.my` — password `password123`).

### 4. Run the backend
```bash
cd backend
npm run dev   # starts on http://localhost:3001
```

### 5. Run the frontend
```bash
cd frontend
npm install
npm run dev   # starts on http://localhost:3000
```

## Environment Variables

### Backend (`backend/.env`)
```bash
NODE_ENV=development
PORT=3001

# Database — use EITHER DATABASE_URL (recommended) OR individual DB_* vars
DATABASE_URL=postgresql://postgres:PASSWORD@db.YOUR-PROJECT.supabase.co:5432/postgres
DB_SSL_REJECT_UNAUTHORIZED=false

# Auth secrets (generate with `openssl rand -hex 32`)
JWT_SECRET=...
JWT_REFRESH_SECRET=...
ENCRYPTION_KEY=...           # 32-byte hex for AES-256-CBC
CSRF_SECRET=...

# Frontend URL (for CORS, cookie domain, email links)
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Supabase (file storage)
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_BUCKET=uploads

# Email (optional in dev — see mailer.ts for in-app fallback)
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM="CatCare UTM <noreply@utm.my>"
```

### Frontend (`frontend/.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Database Setup

See [`SUPABASE-DATABASE-SETUP-GUIDE.md`](./SUPABASE-DATABASE-SETUP-GUIDE.md)
for a complete walkthrough. In short:

1. Create a Supabase project.
2. Run `catcare-full-setup.sql` in the SQL Editor (creates types, tables,
   indexes, triggers).
3. (Optional) Run `seed-dev.sql` for dev test data.
4. Create a Storage bucket named `uploads` (or let the backend auto-create it
   on first boot).
5. Copy the connection string into `DATABASE_URL`.

Migrations are idempotent and run automatically on backend startup — no manual
intervention needed for ongoing schema changes.

## Deployment

See [`DEPLOYMENT-GUIDE.md`](./DEPLOYMENT-GUIDE.md) for the full guide.

**TL;DR:**
- **Backend** → Render Web Service. Build: `npm install --include=dev && npm run build`. Start: `node dist/server.js`. Set all env vars.
- **Frontend** → Vercel. Auto-deploys from GitHub. Set `NEXT_PUBLIC_API_URL`.
- **Database** → Supabase (free tier works fine for capstone use).

## Testing

### Backend

```bash
cd backend
npm test
```

The test suite (`__tests__/api.test.ts`) covers:
- Auth: register, login, refresh, logout, change-password, forgot/reset
- RBAC: admin-only endpoints reject non-admins; manager role respected
- CSRF: missing/invalid token rejected; per-user tokens not interchangeable
- Cats: CRUD, soft delete, restore, photo upload validation
- Emergencies: CRUD, status update, priority feed
- Donations: create, list, admin review workflow
- Validation: weak passwords, non-UTM emails, invalid IDs all rejected

### Frontend

```bash
cd Frontend
npm run verify    # typecheck + lint + tests in one command
npm run test      # just the unit tests
npm run test:watch    # TDD mode
npm run test:coverage # with V8 coverage report
```

The frontend test suite (`src/__tests__/`) covers:
- **Normalizers** — every raw → typed model conversion (Cat, Emergency, Donation, User, Volunteer, CareHistory)
- **apiFetch** — CSRF token attachment, 401 refresh + retry, CSRF dedupe, exempt-endpoint handling
- **Zustand store** — auth state transitions, data cache freshness logic, filter-key invalidation
- **Edge middleware** — route protection (public/protected routes, redirect param preservation, cookie-based auth hint)

## Security

| Threat                | Mitigation                                                |
|-----------------------|-----------------------------------------------------------|
| XSS token theft       | HttpOnly + Secure cookies (no JS access)                  |
| CSRF                  | Per-session double-submit cookie + X-CSRF-Token header    |
| SQL injection         | Parameterized queries everywhere (no string concat)       |
| Brute force login     | Rate limiter: 5 attempts / 15 min / IP                    |
| File upload attacks   | Magic-byte validation (JPEG/PNG/WebP only) + size limit   |
| Weak passwords        | Zod schema: 8+ chars + special character                  |
| Refresh token replay  | Server-side hash storage, revocable, 7-day expiry         |
| Session fixation      | New token on every login, old refresh tokens revoked      |
| Account takeover      | Primary admin (`admin@utm.my`) protected from role change |
| Sensitive data at rest| AES-256-CBC encryption for donation donor info            |
| Information disclosure| Helmet security headers (CSP, HSTS, X-Frame-Options)      |
| Audit gap             | All security-relevant actions logged to `audit_log`       |

## RBAC Matrix

| Capability                    | student | volunteer | manager | admin |
|-------------------------------|:-------:|:---------:|:-------:|:-----:|
| Browse cats                   |    ✓    |     ✓     |    ✓    |   ✓   |
| Report emergency              |    ✓    |     ✓     |    ✓    |   ✓   |
| Donate                        |    ✓    |     ✓     |    ✓    |   ✓   |
| Apply to volunteer            |    ✓    |     ✓     |    ✓    |   ✓   |
| Record care history           |         |     ✓     |    ✓    |   ✓   |
| Manage cats (CRUD)            |         |           |    ✓    |   ✓   |
| Triage emergencies (status)   |         |           |    ✓    |   ✓   |
| Review volunteer applications |         |           |    ✓    |   ✓   |
| Review donations              |         |           |         |   ✓   |
| Manage users (CRUD/roles)     |         |           |         |   ✓   |
| Reset user passwords          |         |           |         |   ✓   |

## Team

| Member                | Module                                   | Folder                                                  |
|-----------------------|------------------------------------------|---------------------------------------------------------|
| Layth Amgad           | Auth & User Management                   | `backend/src/Layth_Amgad-CCU-S1-01-Auth/`               |
| Loai Rafaat           | Cat Management                           | `backend/src/Loai_Rafaat-CCU-S1-02-Cats/`               |
| Youssef Mostafa       | Emergency Reports                        | `backend/src/Youssef_Mostafa-CCU-S1-03-Emergencies/`    |
| Mohamed Abdelgawwad   | Foundation, DB, Security                 | `backend/src/Mohamed_Abdelgawwad-CCU-S1-04-Foundation/` |
| Mohamed Amgad         | Campus Map & Geocoding                   | `backend/src/Mohamed_Amgad-CCU-S1-04-Map/`              |

**Course:** SCSJ3104 — Software Construction & Development, Group 02
**Institution:** Universiti Teknologi Malaysia (UTM)

## License

Internal academic project for UTM. Not for redistribution without written
permission from the project team.
