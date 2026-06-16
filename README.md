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

## New API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
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
