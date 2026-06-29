import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/validate.middleware.js';
import { authMiddleware } from './auth.middleware.js';
import { adminMiddleware, adminOnlyMiddleware } from '../Layth_Amgad-CCU-S1-28-Donations/admin.middleware.js';
import { csrfProtection } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/csrf.js';
import { authLimiter } from './rate-limiter.middleware.js';
import { authController } from './auth.controller.js';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema, adminResetPasswordSchema, passwordSchema, emailSchema } from './auth.schemas.js';
import { z } from 'zod';

export const authRoutes = Router();

// 5 attempts per 15 min per IP — stops brute force
authRoutes.post('/register', authLimiter, validate({ body: registerSchema }), authController.register);
authRoutes.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
// needs a valid JWT to get the user profile
authRoutes.get('/me', authMiddleware, authController.me);
// CRIT-1 Fix: Logout endpoint to clear HttpOnly cookie
// SECURITY: Add auth middleware so logout validates the user session
authRoutes.post('/logout', authMiddleware, authController.logout);
// Password reset endpoints
authRoutes.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), authController.forgotPassword);
authRoutes.post('/reset-password', authLimiter, validate({ body: resetPasswordSchema }), authController.resetPassword);
// Refresh token endpoint — issues new access token from refresh token cookie
// H-3 FIX: Rate limit the refresh endpoint to prevent abuse
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, error: 'Too many refresh attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
authRoutes.post('/refresh', refreshLimiter, authController.refreshToken);

// Change password (authenticated user)
// FIX: authMiddleware MUST run before csrfProtection so req.user is set during CSRF validation
authRoutes.patch('/change-password', authMiddleware, csrfProtection, validate({ body: changePasswordSchema }), authController.changePassword);

// Admin reset password for a user
// FIX: authMiddleware MUST run before csrfProtection so req.user is set during CSRF validation
authRoutes.patch('/users/:id/password', authMiddleware, csrfProtection, adminOnlyMiddleware, validate({ body: adminResetPasswordSchema }), authController.adminResetPassword);

// Email verification endpoint — verifies the token sent to the user's email
const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});
authRoutes.post('/verify-email', validate({ body: verifyEmailSchema }), authController.verifyEmail);

// Resend verification email
const resendVerificationSchema = z.object({
  email: emailSchema,
});
authRoutes.post('/resend-verification', authLimiter, validate({ body: resendVerificationSchema }), authController.resendVerification);

// ─── Admin: User Management CRUD ───
// H-1 FIX: User management endpoints now require admin-only access

// List all users (GET — no CSRF needed)
authRoutes.get('/users', authMiddleware, adminOnlyMiddleware, authController.listUsers);

// Create a new user (admin creates account for someone)
// H-5 FIX: Require proper password (8 chars + special char) for admin-created users
// Uses shared passwordSchema and emailSchema from auth.schemas.ts to avoid
// duplicating validation logic — a single source of truth for password rules.
const adminCreateUserSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['student', 'volunteer', 'manager', 'admin']).default('student'),
});
// FIX: authMiddleware MUST run before csrfProtection so req.user is set during CSRF validation
authRoutes.post('/users', authMiddleware, csrfProtection, adminOnlyMiddleware, validate({ body: adminCreateUserSchema }), authController.adminCreateUser);

// Update user details (name, email)
const updateUserSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100).optional(),
  email: z.string().email('Must be a valid email').optional(),
});
// FIX: authMiddleware MUST run before csrfProtection so req.user is set during CSRF validation
authRoutes.patch('/users/:id', authMiddleware, csrfProtection, adminOnlyMiddleware, validate({ body: updateUserSchema }), authController.updateUser);

// Update user role
const updateUserRoleSchema = z.object({
  role: z.enum(['student', 'volunteer', 'manager', 'admin']),
});
// FIX: authMiddleware MUST run before csrfProtection so req.user is set during CSRF validation
// This was the root cause of the CSRF token error on role change
authRoutes.patch('/users/:id/role', authMiddleware, csrfProtection, adminOnlyMiddleware, validate({ body: updateUserRoleSchema }), authController.updateUserRole);

// Delete a user
const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Invalid user ID'),
});
// FIX: authMiddleware MUST run before csrfProtection so req.user is set during CSRF validation
authRoutes.delete('/users/:id', authMiddleware, csrfProtection, adminOnlyMiddleware, validate({ params: userIdParamSchema }), authController.deleteUser);
