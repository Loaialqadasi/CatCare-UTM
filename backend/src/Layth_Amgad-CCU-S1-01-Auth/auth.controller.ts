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
const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  maxAge: 15 * 60 * 1000, // 15 minutes — short-lived access token
  path: '/',
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — long-lived refresh token
  path: '/',
};

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body as RegisterInput);
      // Set HttpOnly cookies for both access and refresh tokens
      res.cookie('token', result.token, ACCESS_COOKIE_OPTIONS);
      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
      success(res, { user: result.user }, 201);
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body as LoginInput);
      // Set HttpOnly cookies for both access and refresh tokens
      res.cookie('token', result.token, ACCESS_COOKIE_OPTIONS);
      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
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

  // CRIT-1 Fix: Logout endpoint to clear the HttpOnly cookies
  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie('token', { path: '/', sameSite: ACCESS_COOKIE_OPTIONS.sameSite, secure: ACCESS_COOKIE_OPTIONS.secure });
      res.clearCookie('refreshToken', { path: '/', sameSite: REFRESH_COOKIE_OPTIONS.sameSite, secure: REFRESH_COOKIE_OPTIONS.secure });
      success(res, { message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  },

  // Forgot password — generates a reset token
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body as { email: string };
      const result = await authService.forgotPassword(email);
      success(res, result);
    } catch (error) {
      next(error);
    }
  },

  // Reset password — verifies the token and updates the password
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body as { token: string; password: string };
      const result = await authService.resetPassword(token, password);
      success(res, result);
    } catch (error) {
      next(error);
    }
  },

  // Refresh token — issues a new access token using the refresh token cookie
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        return next(new AuthenticationError('Refresh token not found'));
      }
      const result = await authService.refreshToken(refreshToken);
      // Set the new access token cookie
      res.cookie('token', result.token, ACCESS_COOKIE_OPTIONS);
      success(res, { message: 'Token refreshed successfully' });
    } catch (error) {
      next(error);
    }
  },

  // ─── Admin: User Management ───

  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await authService.listUsers();
      success(res, users);
    } catch (error) {
      next(error);
    }
  },

  async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { role } = req.body as { role: string };
      const user = await authService.updateUserRole(id, role);
      success(res, user);
    } catch (error) {
      next(error);
    }
  },
};
