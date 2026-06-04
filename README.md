# CatCare UTM — Campus Cat Management System

A comprehensive web application for managing campus cats and emergency reports at Universiti Teknologi Malaysia (UTM).

## Team Members

| Member | Module | Folder |
|--------|--------|--------|
| Layth Amgad | CCU-S1-01: Authentication | `backend/src/Layth_Amgad-CCU-S1-01-Auth/` |
| Loai Rafaat | CCU-S1-02: Cat Management | `backend/src/Loai_Rafaat-CCU-S1-02-Cats/` |
| Youssef Mostafa | CCU-S1-03: Emergency Reports | `backend/src/Youssef_Mostafa-CCU-S1-03-Emergencies/` |
| Mohamed Abdelgawwad | CCU-S1-04: Foundation | `backend/src/Mohamed_Abdelgawwad-CCU-S1-04-Foundation/` + `frontend/src/lib/`, `frontend/src/components/` |
| Mohamed Amgad | CCU-S1-Map: Map Module | `backend/src/Mohamed_Amgad-CCU-S1-04-Map/` + `frontend/src/app/(main)/map/` |
| Volunteer Module Contributor | CCU-S1-Volunteer: Volunteer Module | `frontend/src/app/(main)/volunteers/` |

## Project Structure

```
catcare-utm/
├── backend/                 # Express.js + TypeScript + PostgreSQL
│   ├── src/
│   │   ├── Layth_Amgad-CCU-S1-01-Auth/       # Auth (login, register, JWT, email verification, password reset, refresh tokens)
│   │   ├── Loai_Rafaat-CCU-S1-02-Cats/       # Cat CRUD + photo upload (Cloudinary) + soft delete
│   │   ├── Youssef_Mostafa-CCU-S1-03-Emergencies/ # Emergency reports + soft delete
│   │   ├── Mohamed_Abdelgawwad-CCU-S1-04-Foundation/ # Shared (DB, env, errors, middleware, utils)
│   │   ├── Mohamed_Amgad-CCU-S1-04-Map/       # Map proxy (rate-limited)
│   │   ├── Layth_Amgad-CCU-S1-28-Donations/   # Donations with admin review
│   │   └── server.ts
│   ├── migrations/          # Database migrations (001-008)
│   ├── catcare-full-setup.sql
│   ├── seed-dev.sql
│   ├── reset-dev.sql
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                # Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui
│   ├── src/
│   │   ├── app/             # Next.js App Router (file-based routing)
│   │   │   ├── (auth)/      # Auth pages (login, register)
│   │   │   ├── (main)/      # Main app pages (dashboard, cats, emergencies, donations, map, volunteers, admin, profile)
│   │   ├── components/      # UI components (auth, layout, cats, emergencies, dashboard, profile, admin)
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
- **Auth:** JWT + bcrypt (access + refresh tokens, email verification, password reset)
- **File Uploads:** Cloudinary (images stored in cloud, no local disk)
- **Validation:** Zod
- **Logging:** Pino
- **Security:** Helmet, CORS, Rate Limiting, CSRF protection

### Frontend
- **Framework:** Next.js 16 (App Router with file-based routing)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **State Management:** Zustand (auth + data cache only)
- **Routing:** Next.js App Router (replaces Zustand currentView navigation)
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
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend-url.vercel.app
ENCRYPTION_KEY=run_openssl_rand_hex_32_to_generate
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Deployment

### Backend (Render)
- **Build Command:** `npm install --include-dev && npm run build`
- **Start Command:** `node dist/server.js`
- Set all environment variables in Render dashboard

### Frontend (Vercel)
- **Framework Preset:** Next.js
- Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in Vercel environment variables

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
# Create .env.local with NEXT_PUBLIC_API_URL and NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
npm run dev
```

## Testing

### Backend
```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/health | No | Health check |
| POST | /api/auth/register | No | Register new user |
| POST | /api/auth/login | No | Login (blocks unverified emails) |
| GET | /api/auth/verify-email | No | Verify email via token |
| POST | /api/auth/forgot-password | No | Request password reset email |
| POST | /api/auth/reset-password | No | Reset password with token |
| POST | /api/auth/refresh | Yes (cookie) | Refresh access token |
| GET | /api/auth/me | Yes | Get current user |
| POST | /api/auth/logout | Yes | Logout (clear cookies) |
| GET | /api/cats | No | List cats (paginated) |
| GET | /api/cats/:id | No | Get cat by ID |
| GET | /api/cats/:id/care-history | No | Get care history for a cat |
| POST | /api/cats | Yes | Create cat (with photo upload to Cloudinary) |
| DELETE | /api/cats/:id | Admin | Soft-delete a cat |
| PATCH | /api/cats/:id/restore | Admin | Restore a soft-deleted cat |
| GET | /api/emergencies | No | List emergencies (paginated) |
| GET | /api/emergencies/:id | No | Get emergency by ID |
| POST | /api/emergencies | Yes | Report emergency |
| PATCH | /api/emergencies/:id/status | Admin | Update emergency status |
| DELETE | /api/emergencies/:id | Admin | Soft-delete an emergency |
| PATCH | /api/emergencies/:id/restore | Admin | Restore a soft-deleted emergency |
| GET | /api/emergencies/priority-feed | No | Priority-sorted emergencies |
| POST | /api/donations | Yes | Create donation |
| GET | /api/donations | Admin | List donations |
| GET | /api/donations/my | Yes | List own donations |
| GET | /api/donations/summary | Admin | Donation summary |
| GET | /api/donations/:id | Yes | Get donation by ID |
| PATCH | /api/donations/:id/review | Admin | Review donation |
| PATCH | /api/donations/:id/approve | Admin | Approve donation |
| PATCH | /api/donations/:id/reject | Admin | Reject donation |
| GET | /api/map/geocode | No | Geocode proxy (rate-limited) |
| GET | /api/map/places | No | Places search proxy (rate-limited) |
