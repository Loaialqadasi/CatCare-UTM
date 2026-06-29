import { Router, type Request, type Response, type NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/validate.middleware.js';
import { authMiddleware } from '../Layth_Amgad-CCU-S1-01-Auth/auth.middleware.js';
import { volunteerMiddleware, managerMiddleware, adminMiddleware } from '../Layth_Amgad-CCU-S1-28-Donations/admin.middleware.js';
import { ValidationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { upload } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/upload.js';
import { catsController } from './cats.controller.js';
import { catIdParamSchema, createCatSchema, updateCatSchema, listCatsQuerySchema, healthStatusEnum, careTypeEnum } from './cats.schemas.js';
import { z } from 'zod';

export const catsRoutes = Router();

// ── Magic-bytes validation ──────────────────────────────────────────────
async function validateImageBuffer(req: Request, _res: Response, next: NextFunction) {
  const file = req.file;
  if (!file) return next();

  const buffer = file.buffer;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return next();
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return next();
  // WebP: RIFF....WEBP
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return next();

  return next(
    new ValidationError('Invalid image file. Only real JPG, PNG, or WebP images are allowed.', { field: 'photo' })
  );
}

// ── Rate limiter for upload endpoint ───────────────────────────────────
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many upload attempts. Please try again later.' },
});

// Schema for volunteer health status update
const updateHealthStatusSchema = z.object({
  healthStatus: healthStatusEnum,
});

// FIX: Schema for volunteer care history recording
const createCareHistorySchema = z.object({
  careType: careTypeEnum,
  description: z.string().min(3, 'Description must be at least 3 characters').max(1000).trim(),
});

// ── Routes ─────────────────────────────────────────────────────────────
// NOTE: CSRF protection is applied globally in app.ts via:
//   app.use('/api/cats', optionalAuthMiddleware, csrfProtection);
// This ensures req.user is set before CSRF validation.

// create a cat — auth required, photo optional
catsRoutes.post(
  '/',
  authMiddleware,
  uploadLimiter,
  upload.single('photo'),
  validateImageBuffer,
  validate({ body: createCatSchema }),
  catsController.create
);

// browse cats with search and filters
catsRoutes.get(
  '/',
  validate({ query: listCatsQuerySchema }),
  catsController.list
);

// view a single cat
catsRoutes.get(
  '/:id',
  validate({ params: catIdParamSchema }),
  catsController.getById
);

// view care history for a cat
catsRoutes.get(
  '/:id/care-history',
  validate({ params: catIdParamSchema }),
  catsController.getCareHistory
);

// FIX: Record care history — volunteer or above, with optional photo upload
catsRoutes.post(
  '/:id/care-history',
  authMiddleware,
  volunteerMiddleware,
  upload.single('photo'),
  validateImageBuffer,
  validate({ params: catIdParamSchema, body: createCareHistorySchema }),
  catsController.createCareHistory
);

// FIX: Volunteer health status update — volunteers can update cat health status only
catsRoutes.patch(
  '/:id/health',
  authMiddleware,
  volunteerMiddleware,
  validate({ params: catIdParamSchema, body: updateHealthStatusSchema }),
  catsController.updateHealthStatus
);

// update a cat — manager or above, with optional photo upload
catsRoutes.patch(
  '/:id',
  authMiddleware,
  managerMiddleware,
  upload.single('photo'),
  validateImageBuffer,
  validate({ params: catIdParamSchema, body: updateCatSchema }),
  catsController.update
);

// soft delete a cat — admin only
catsRoutes.delete(
  '/:id',
  authMiddleware,
  adminMiddleware,
  validate({ params: catIdParamSchema }),
  catsController.softDelete
);

// restore a soft-deleted cat — admin only
catsRoutes.patch(
  '/:id/restore',
  authMiddleware,
  adminMiddleware,
  validate({ params: catIdParamSchema }),
  catsController.restore
);
