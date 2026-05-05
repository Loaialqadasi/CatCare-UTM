import { NextFunction, Request, Response } from 'express';
import { AuthorizationError } from '../shared/errors.js';
import { UserRole } from '../shared/types.js';

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

export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new AuthorizationError('Authentication required'));
  }

  if (req.user.role !== 'admin') {
    return next(new AuthorizationError('Admin access required'));
  }

  next();
};

export const requireVolunteer = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new AuthorizationError('Authentication required'));
  }

  if (req.user.role !== 'volunteer' && req.user.role !== 'admin') {
    return next(new AuthorizationError('Volunteer access required'));
  }

  next();
};
