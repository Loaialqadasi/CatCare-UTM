import { NextFunction, Request, Response } from 'express';
import { AuthorizationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';

export const adminMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AuthorizationError('Admin access required'));
  }
  next();
};
