import { Router } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { validate } from '../../middleware/validate.middleware.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { ValidationError } from '../../shared/errors.js';
import { catsController } from './cats.controller.js';
import { catIdParamSchema, createCatSchema, listCatsQuerySchema } from './cats.schemas.js';

export const catsRoutes = Router();

const uploadDir = path.join(process.cwd(), 'uploads', 'cats');
fs.mkdirSync(uploadDir, { recursive: true });

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const mimeExtensionMap: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

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

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(new ValidationError('Only JPG, PNG, or WEBP images are allowed', { field: 'photo' }));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

catsRoutes.post(
  '/',
  authMiddleware,
  upload.single('photo'),
  validate({ body: createCatSchema }),
  catsController.create
);

catsRoutes.get('/', validate({ query: listCatsQuerySchema }), catsController.list);

catsRoutes.get('/:id', validate({ params: catIdParamSchema }), catsController.getById);
