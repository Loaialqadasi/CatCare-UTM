# CatCare UTM — Campus Cat Management System

A comprehensive web application for managing campus cats and emergency reports at Universiti Teknologi Malaysia (UTM).

## Team Members

| Member | Module | Folder |
|--------|--------|--------|
| Layth Amgad | CCU-S1-01: Authentication | `backend/src/auth/` |
| Loai Rafaat | CCU-S1-02: Cat Management | `backend/src/cats/` |
| Youssef Mostafa | CCU-S1-03: Emergency Reports | `backend/src/emergencies/` |
| Mohamed Abdelgawwad | CCU-S1-04: Foundation | `backend/src/foundation/` + `frontend/src/lib/`, `frontend/src/components/` |

## Project Structure

```
catcare-utm/
├── backend/                 # Express.js + TypeScript + PostgreSQL
│   ├── src/
│   │   ├── auth/            # Auth (login, register, JWT)
│   │   ├── cats/            # Cat CRUD + photo upload
│   │   ├── emergencies/     # Emergency reports
│   │   ├── foundation/      # Shared (DB, env, errors, middleware)
│   │   └── server.ts
│   ├── catcare-full-setup.sql
│   ├── seed-dev.sql
│   ├── reset-dev.sql
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                # Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   ├── components/      # UI components (auth, layout, cats, emergencies, dashboard, profile)
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # API client, store, types
│   ├── public/              # Static assets (logo.svg)
│   ├── package.json
│   └── next.config.ts
│
└── README.md
```

## Tech Stack

### Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL (Render)
- **Auth:** JWT + bcrypt
- **Validation:** Zod
- **Logging:** Pino
- **Security:** Helmet, CORS, Rate Limiting

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand
- **HTTP Client:** Native fetch
- **Notifications:** Sonner

## Demo Accounts

Contact the project admin for demo account credentials. Do not store passwords in version control.

## Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=10000
DATABASE_HOST=your-db-host.render.com
DATABASE_PORT=5432
DATABASE_USER=your_db_user
DATABASE_PASSWORD=your_db_password
DATABASE_NAME=catcare_utm
JWT_SECRET=your_jwt_secret_minimum_32_characters
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend-url.vercel.app
ENCRYPTION_KEY=run_openssl_rand_hex_32_to_generate
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
```

## Deployment

### Backend (Render)
- **Build Command:** `npm install --include-dev && npm run build`
- **Start Command:** `node dist/server.js`
- Set all environment variables in Render dashboard

### Frontend (Vercel)
- **Framework Preset:** Next.js
- Set `NEXT_PUBLIC_API_URL` in Vercel environment variables

## Getting Started

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in your database credentials
npm run dev
```

### Frontend
```bash
cd frontend
npm install
# Create .env.local with NEXT_PUBLIC_API_URL
npm run dev
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/health | No | Health check |
| POST | /api/auth/register | No | Register new user |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Yes | Get current user |
| GET | /api/cats | No | List cats (paginated) |
| GET | /api/cats/:id | No | Get cat by ID |
| POST | /api/cats | Yes | Create cat (with photo upload) |
| GET | /api/emergencies | No | List emergencies (paginated) |
| GET | /api/emergencies/:id | No | Get emergency by ID |
| POST | /api/emergencies | Yes | Report emergency |
| PATCH | /api/emergencies/:id/status | Admin | Update emergency status |
| GET | /api/emergencies/priority-feed | No | Priority-sorted emergencies |
| POST | /api/donations | Yes | Create donation |
| GET | /api/donations | Admin | List donations |
| GET | /api/donations/my | Yes | List own donations |
| GET | /api/donations/summary | Admin | Donation summary |
| GET | /api/donations/:id | Yes | Get donation by ID |
| PATCH | /api/donations/:id/review | Admin | Review donation |
| PATCH | /api/donations/:id/approve | Admin | Approve donation |
| PATCH | /api/donations/:id/reject | Admin | Reject donation |
