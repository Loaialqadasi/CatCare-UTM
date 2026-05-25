import { Router, type Request, type Response, type NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { validate } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/validate.middleware.js';
import { authMiddleware } from '../Layth_Amgad-CCU-S1-01-Auth/auth.middleware.js';
import { ValidationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { catsController } from './cats.controller.js';
import { catIdParamSchema, createCatSchema, listCatsQuerySchema } from './cats.schemas.js';

export const catsRoutes = Router();

const uploadDir = path.join(process.cwd(), 'uploads', 'cats');
fs.mkdirSync(uploadDir, { recursive: true });

// only accept these image types
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const mimeExtensionMap: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

// save uploads to disk with random filenames to prevent path traversal
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const extension = mimeExtensionMap[file.mimetype];
    if (!extension) {
      return cb(new ValidationError('Only JPG, PNG, or WEBP images are allowed', { field: 'photo' }), '');
    }
    const randomId = crypto.randomBytes(6).toString('hex');
    const filename = `cat-${Date.now()}-${randomId}${extension}`;
    cb(null, filename);
  }
});

// double-check MIME type before saving
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(new ValidationError('Only JPG, PNG, or WEBP images are allowed', { field: 'photo' }));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// MED-01 Fix: Stricter rate limiter on file upload endpoint
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many upload attempts. Please try again later.',
  },
});

// ── Magic-bytes validation ──────────────────────────────────────────────
// Reads the first 12 bytes of a file and checks against known image
// signatures. This prevents MIME-type spoofing (CRIT-3).
async function checkMagicBytes(filePath: string): Promise<boolean> {
  const buffer = Buffer.alloc(12);
  const fd = await fs.promises.open(filePath, 'r');
  try {
    await fd.read(buffer, 0, 12, 0);
  } finally {
    await fd.close();
  }

  // JPEG: starts with FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  // PNG: starts with 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  )
    return true;
  // WebP: starts with RIFF....WEBP
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  )
    return true;

  return false;
}

/** Post-upload middleware: validates actual file content via magic bytes.
 *  Runs AFTER multer has saved the file to disk but BEFORE the controller.
 *  If validation fails the uploaded file is deleted and a 400 is returned. */
async function validateImageFile(req: Request, _res: Response, next: NextFunction) {
  const file = req.file;
  if (!file) return next(); // No file uploaded — photo is optional

  const isValid = await checkMagicBytes(file.path);
  if (!isValid) {
    // Delete the invalid file from disk
    await fs.promises.unlink(file.path).catch(() => {});
    return next(
      new ValidationError('Invalid image file. Only real JPG, PNG, or WebP images are allowed.', {
        field: 'photo',
      }),
    );
  }
  next();
}

// create a cat — needs auth + optional photo upload
catsRoutes.post(
  '/',
  authMiddleware,
  uploadLimiter,
  upload.single('photo'),
  validateImageFile, // CRIT-3: magic-bytes validation after upload
  validate({ body: createCatSchema }),
  catsController.create
);

// browse cats with search and filters
catsRoutes.get('/', validate({ query: listCatsQuerySchema }), catsController.list);

// view a single cat
catsRoutes.get('/:id', validate({ params: catIdParamSchema }), catsController.getById);

// view care history for a cat
catsRoutes.get('/:id/care-history', validate({ params: catIdParamSchema }), catsController.getCareHistory);
