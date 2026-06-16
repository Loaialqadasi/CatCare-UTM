import { NextFunction, Request, Response } from 'express';
import { AuthorizationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';

// H-1 FIX: Differentiate between admin and manager roles.
// Managers can manage cats, emergencies, and donations (operational tasks).
// Only admins can manage users, change roles, and delete accounts.

/**
 * Admin OR Manager middleware — allows both admin and manager roles.
 * Use for: managing cats, reviewing donations, updating emergency status.
 */
export const adminMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
    return next(new AuthorizationError('Admin or Manager access required'));
  }
  next();
};

/**
 * Admin-only middleware — restricts access to admin role only.
 * Use for: user management, role changes, account deletion.
 */
export const adminOnlyMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AuthorizationError('Admin access required'));
  }
  next();
};
