import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthenticationError } from '../shared/errors';
import { AuthUser, JwtPayload } from '../shared/types';

// Extend Express Request to include authenticated user data
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Verify JWT token from Authorization header and attach user to request
export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Missing or invalid token'));
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = {
      id: payload.id,
      fullName: payload.fullName,
      email: payload.email,
      role: payload.role
    };
    next();
  } catch (error) {
    next(new AuthenticationError('Missing or invalid token'));
  }
};
