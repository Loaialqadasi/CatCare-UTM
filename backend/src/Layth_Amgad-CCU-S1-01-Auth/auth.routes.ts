import { Router } from 'express';
import { validate } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/validate.middleware.js';
import { authMiddleware } from './auth.middleware.js';
import { adminMiddleware } from '../Layth_Amgad-CCU-S1-28-Donations/admin.middleware.js';
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
// Admin: List all users
authRoutes.get('/users', authMiddleware, adminMiddleware, authController.listUsers);
// Admin: Update user role
const updateUserRoleSchema = z.object({
  role: z.enum(['student', 'volunteer', 'admin']),
});
authRoutes.patch('/users/:id/role', authMiddleware, adminMiddleware, validate({ body: updateUserRoleSchema }), authController.updateUserRole);
