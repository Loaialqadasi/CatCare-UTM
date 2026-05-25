import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { success } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/response.js';
import { authService } from './auth.service.js';
import { LoginInput, RegisterInput } from './auth.types.js';
import { env } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/env.js';

// CRIT-1 Fix: Cookie options for HttpOnly JWT
// IMPORTANT: sameSite must be 'none' in production because the frontend (Vercel)
// and backend (Render) are on different domains. 'lax' cookies are NOT sent
// with cross-origin POST requests, which would break login/register/logout.
// 'none' requires secure:true (HTTPS), which both Vercel and Render provide.
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — matches JWT_EXPIRES_IN
  path: '/',
};

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body as RegisterInput);
      // CRIT-1 Fix: Set HttpOnly cookie instead of returning token in body
      res.cookie('token', result.token, COOKIE_OPTIONS);
      success(res, { user: result.user }, 201);
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body as LoginInput);
      // CRIT-1 Fix: Set HttpOnly cookie instead of returning token in body
      res.cookie('token', result.token, COOKIE_OPTIONS);
      success(res, { user: result.user });
    } catch (error) {
      next(error);
    }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        return next(new AuthenticationError('Missing or invalid token'));
      }
      const user = await authService.getMe(req.user.id);
      success(res, user);
    } catch (error) {
      next(error);
    }
  },

  // CRIT-1 Fix: Logout endpoint to clear the HttpOnly cookie
  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie('token', { path: '/', sameSite: COOKIE_OPTIONS.sameSite, secure: COOKIE_OPTIONS.secure });
      success(res, { message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  },

  // MED-9: Password reset skeleton — email sending not yet configured
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body as { email: string };
      // TODO: Generate reset token, store in DB, send email with reset link
      // For now, always return success to prevent email enumeration
      success(res, { message: 'If an account with that email exists, a reset link has been sent.' });
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Verify token, update password hash, invalidate token
      // For now, return not implemented
      res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Password reset is not yet configured. Contact an admin.' } });
    } catch (error) {
      next(error);
    }
  }
};
