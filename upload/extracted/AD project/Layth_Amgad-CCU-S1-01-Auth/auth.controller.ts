import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../../shared/errors';
import { success } from '../../shared/response';
import { authService } from './auth.service';
import { LoginInput, RegisterInput } from './auth.types';

export const authController = {
  // Handle user registration with email validation and password hashing
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body as RegisterInput);
      success(res, result, 201);
    } catch (error) {
      next(error);
    }
  },

  // Handle user login by verifying credentials and issuing JWT token
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body as LoginInput);
      success(res, result);
    } catch (error) {
      next(error);
    }
  },

  // Return authenticated user profile from token claims
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
  }
};
