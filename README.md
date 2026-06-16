<<<<<<< HEAD
# CatCare UTM — Sprint 4: Layth Amgad

## Developer Info
- **Name:** Layth Amgad
- **Matric:** A23CS4024
- **Role:** Authentication Developer & Admin User Management

## Sprint 4 Contribution

### 1. Complete Password Reset Flow (UC18)
- Forgot-password with SHA-256 hashed tokens, 1-hour expiry, single-use enforcement, email delivery via Nodemailer
- Reset-password with token validation, password update, and refresh token revocation

### 2. Server-Side Refresh Token Storage (C-3 Fix)
- SHA-256 hashed tokens in database, validated on every refresh, revoked on logout/password-change/admin-action
- POST /api/auth/refresh with rate limiting (50/15min)

### 3. Change Password (UC19)
- PATCH /api/auth/change-password with current password verification and refresh token revocation

### 4. Email Verification Infrastructure (UC16)
- POST /api/auth/verify-email and POST /api/auth/resend-verification with typed JWT tokens and branded HTML emails

### 5. Admin User Management (UC21)
- Full CRUD: list, create, update, delete users, change role, admin reset password
- Self-action prevention (cannot change own role or delete own account)
- Super-admin protection (admin@utm.my role cannot be modified)
- adminOnlyMiddleware (managers blocked from user management — H-1 fix)

### 6. Auth Module Schema & Type Updates
- passwordSchema (8+ chars + special char), user creation/update schemas, role change schema
- Manager role added, refresh token types, password reset types

### 7. Frontend Auth & Admin Pages
- Forgot Password (2-step), Reset Password, Verify Email (NEW)
- Admin Users page (stats, table, CRUD dialogs, role change, password reset)
- Profile page with change password, dashboard stats, sidebar/header updates
- API client with token refresh, CSRF management, and all new endpoint functions
=======
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
>>>>>>> c4c05d1dbba72ca5ab6c54197d794c3c574d081e

## New API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
<<<<<<< HEAD
| POST | `/api/auth/forgot-password` | Request password reset token |
| POST | `/api/auth/reset-password` | Reset password with token |
| PATCH | `/api/auth/change-password` | Change own password |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/verify-email` | Verify email |
| POST | `/api/auth/resend-verification` | Resend verification email |
| GET | `/api/auth/users` | List users (admin-only) |
| POST | `/api/auth/users` | Create user (admin-only) |
| PATCH | `/api/auth/users/:id` | Update user (admin-only) |
| PATCH | `/api/auth/users/:id/role` | Change role (admin-only) |
| DELETE | `/api/auth/users/:id` | Delete user (admin-only) |
| PATCH | `/api/auth/users/:id/password` | Admin reset password |

## Push Order: 4th (LAST — Auth touches the most shared files)
=======
| DELETE | `/api/cats/:id` | Soft delete cat (admin-only) |
| PATCH | `/api/cats/:id/restore` | Restore soft-deleted cat |
| POST | `/api/volunteers` | Submit volunteer application |
| GET | `/api/volunteers/my` | View own applications |
| GET | `/api/volunteers` | List all (admin/manager) |
| PATCH | `/api/volunteers/:id/status` | Approve/reject (admin/manager) |

## Push Order: 3rd (After migrations and tests — features depend on DB schema)
>>>>>>> c4c05d1dbba72ca5ab6c54197d794c3c574d081e
