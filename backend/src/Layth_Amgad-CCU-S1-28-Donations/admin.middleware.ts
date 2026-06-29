import { NextFunction, Request, Response } from 'express';
import { AuthorizationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';

export type UserRole = 'student' | 'volunteer' | 'manager' | 'admin';

const ROLE_RANK: Record<UserRole, number> = {
  student: 0,
  volunteer: 1,
  manager: 2,
  admin: 3,
};

function hasMinRole(userRole: string, minRole: UserRole): boolean {
  return (ROLE_RANK[userRole as UserRole] ?? -1) >= ROLE_RANK[minRole];
}

/** Manager or above — use for: managing cats, emergencies, volunteers */
export const managerMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user || !hasMinRole(req.user.role, 'manager')) {
    return next(new AuthorizationError('Manager access required'));
  }
  next();
};

/** Admin or above — use for: managing users, reviewing donations */
export const adminMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user || !hasMinRole(req.user.role, 'admin')) {
    return next(new AuthorizationError('Admin access required'));
  }
  next();
};

/** Admin-only — same as adminMiddleware, explicit alias for user management */
export const adminOnlyMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user || !hasMinRole(req.user.role, 'admin')) {
    return next(new AuthorizationError('Admin access required'));
  }
  next();
};

/** Volunteer or above — use for: updating cat status, recording care history */
export const volunteerMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user || !hasMinRole(req.user.role, 'volunteer')) {
    return next(new AuthorizationError('Volunteer access required'));
  }
  next();
};
