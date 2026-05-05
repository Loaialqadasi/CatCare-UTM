import { Response } from 'express';

// Format successful API response with data and status code
export const success = <T>(res: Response, data: T, statusCode = 200): Response => {
  return res.status(statusCode).json({ success: true, data });
};
