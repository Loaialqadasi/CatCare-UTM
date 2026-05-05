import { NextFunction, Request, Response } from 'express';
import { NotFoundError } from '../shared/errors';

// Handle requests to non-existent routes
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
};
