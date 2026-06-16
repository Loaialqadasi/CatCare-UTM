import { Router } from 'express';
import { validate } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/validate.middleware.js';
import { authMiddleware } from './auth.middleware.js';
import { adminMiddleware } from '../Layth_Amgad-CCU-S1-28-Donations/admin.middleware.js';
import { csrfProtection } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/csrf.js';
import { authLimiter } from './rate-limiter.middleware.js';
import { authController } from './auth.controller.js';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schemas.js';
import { z } from 'zod';

export const authRoutes = Router();

// 5 attempts per 15 min per IP — stops brute force
authRoutes.post('/register', authLimiter, validate({ body: registerSchema }), authController.register);
authRoutes.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
// needs a valid JWT to get the user profile
authRoutes.get('/me', authMiddleware, authController.me);
// CRIT-1 Fix: Logout endpoint to clear HttpOnly cookie
authRoutes.post('/logout', authController.logout);
// Password reset endpoints
authRoutes.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), authController.forgotPassword);
authRoutes.post('/reset-password', authLimiter, validate({ body: resetPasswordSchema }), authController.resetPassword);
// Refresh token endpoint — issues new access token from refresh token cookie
authRoutes.post('/refresh', authController.refreshToken);

// ─── Admin: User Management CRUD ───

// List all users (GET — no CSRF needed)
authRoutes.get('/users', authMiddleware, adminMiddleware, authController.listUsers);

// Create a new user (admin creates account for someone)
const adminCreateUserSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Must be a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  role: z.enum(['student', 'volunteer', 'manager', 'admin']).default('student'),
});
authRoutes.post('/users', csrfProtection, authMiddleware, adminMiddleware, validate({ body: adminCreateUserSchema }), authController.adminCreateUser);

// Update user details (name, email)
const updateUserSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100).optional(),
  email: z.string().email('Must be a valid email').optional(),
});
authRoutes.patch('/users/:id', csrfProtection, authMiddleware, adminMiddleware, validate({ body: updateUserSchema }), authController.updateUser);

// Update user role
const updateUserRoleSchema = z.object({
  role: z.enum(['student', 'volunteer', 'manager', 'admin']),
});
authRoutes.patch('/users/:id/role', csrfProtection, authMiddleware, adminMiddleware, validate({ body: updateUserRoleSchema }), authController.updateUserRole);

// Delete a user
const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Invalid user ID'),
});
authRoutes.delete('/users/:id', csrfProtection, authMiddleware, adminMiddleware, validate({ params: userIdParamSchema }), authController.deleteUser);
