import { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { logger } from '../config/logger';
import { AppError, ValidationError } from '../shared/errors';

// Global error handler - catches all errors and formats responses
export const errorHandler = (error: unknown, _req: Request, res: Response, next: NextFunction): void => {
  if (res.headersSent) {
    return next(error);
  }

  let appError: AppError;

  if (error instanceof MulterError) {
    // Handle file upload errors with user-friendly messages
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'File too large. Maximum size is 5MB.'
      : 'Invalid file upload.';
    appError = new ValidationError(message, { field: error.field, code: error.code });
  } else {
    // Use existing app error or create generic server error
    appError = error instanceof AppError
      ? error
      : new AppError('Internal server error', 'INTERNAL_SERVER_ERROR', 500);
  }

  // Log server errors for debugging and monitoring
  if (appError.statusCode >= 500) {
    logger.error({ err: error }, 'Unhandled error');
  }

  res.status(appError.statusCode).json({
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      details: appError.details
    }
  });
};
