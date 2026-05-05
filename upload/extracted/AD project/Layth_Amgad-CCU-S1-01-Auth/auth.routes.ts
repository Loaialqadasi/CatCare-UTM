import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { authLimiter } from '../../middleware/rate-limiter.middleware';
import { authController } from './auth.controller';
import { loginSchema, registerSchema } from './auth.schemas';

export const authRoutes = Router();

// POST /auth/register - Register new user (rate limited: 5 attempts per 15 min per IP)
authRoutes.post('/register', authLimiter, validate({ body: registerSchema }), authController.register);

// POST /auth/login - Authenticate user and return JWT token (rate limited: 5 attempts per 15 min per IP)
authRoutes.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);

// GET /auth/me - Retrieve authenticated user profile (requires valid token)
authRoutes.get('/me', authMiddleware, authController.me);
