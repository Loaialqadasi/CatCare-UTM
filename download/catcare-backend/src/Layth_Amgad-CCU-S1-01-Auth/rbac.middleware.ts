import { NextFunction, Request, Response } from 'express';
import { AuthorizationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { UserRole } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/types.js';

// only let users with specific roles through
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthorizationError('Authentication required'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError('Insufficient permissions for this action'));
    }
    next();
  };
};

// shorthand for admin-only routes
export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new AuthorizationError('Authentication required'));
  }
  if (req.user.role !== 'admin') {
    return next(new AuthorizationError('Admin access required'));
  }
  next();
};

// volunteers and admins can access, students cannot
export const requireVolunteer = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new AuthorizationError('Authentication required'));
  }
  if (req.user.role !== 'volunteer' && req.user.role !== 'admin') {
    return next(new AuthorizationError('Volunteer access required'));
  }
  next();
};
