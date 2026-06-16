# CatCare UTM — Sprint 4: Loai Rafaat

## Developer Info
- **Name:** Loai Rafaat
- **Matric:** A23EC9010
- **Role:** Sprint Lead / Cat Management & Volunteer Developer

## Sprint 4 Contribution

### 1. Cat Module — Soft Delete & Restore
- All 6 cat module files updated with soft delete (DELETE /api/cats/:id) and restore (PATCH /api/cats/:id/restore) functionality, admin-only access, and listing filter to exclude soft-deleted records

### 2. Volunteer Management System (NEW — UC17)
- **`volunteers.controller.ts`**: Submit application, view own, admin list with pagination/filtering, approve/reject
- **`volunteers.repository.ts`**: CRUD with status filtering, pagination, user-scoped queries
- **`volunteers.routes.ts`**: POST /api/volunteers, GET /api/volunteers/my, GET /api/volunteers (admin), PATCH /api/volunteers/:id/status
- **`volunteers.service.ts`**: Validation (age 16-100, interests 10+ chars), status transitions, duplicate prevention
- **`volunteers.types.ts`**: VolunteerStatus enum, Volunteer type, CreateVolunteerFormData type

### 3. Donation Module — Access Control Fixes
- **`admin.middleware.ts`**: Updated to support admin AND manager roles
- **`donations.controller.ts`**: Auth + admin/manager required for listing/summary (MED-07 fix)
- **`donations.routes.ts`**: Added auth and admin middleware to listing and summary routes

### 4. Frontend Updates
- Volunteer application page, admin volunteer management, admin cats with soft delete/restore

## New API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| DELETE | `/api/cats/:id` | Soft delete cat (admin-only) |
| PATCH | `/api/cats/:id/restore` | Restore soft-deleted cat |
| POST | `/api/volunteers` | Submit volunteer application |
| GET | `/api/volunteers/my` | View own applications |
| GET | `/api/volunteers` | List all (admin/manager) |
| PATCH | `/api/volunteers/:id/status` | Approve/reject (admin/manager) |

## Push Order: 3rd (After migrations and tests — features depend on DB schema)
