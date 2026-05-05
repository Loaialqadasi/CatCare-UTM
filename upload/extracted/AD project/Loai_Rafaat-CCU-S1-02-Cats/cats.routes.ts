import { Router } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { validate } from '../../middleware/validate.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { ValidationError } from '../../shared/errors';
import { catsController } from './cats.controller';
import { catIdParamSchema, createCatSchema, listCatsQuerySchema } from './cats.schemas';

export const catsRoutes = Router();

const uploadDir = path.join(process.cwd(), 'uploads', 'cats');
fs.mkdirSync(uploadDir, { recursive: true });

// Whitelist of allowed image MIME types
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const mimeExtensionMap: Record<string, string> = {
	'image/jpeg': '.jpg',
	'image/png': '.png',
	'image/webp': '.webp'
};

// Configure multer for secure file storage with random filenames
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
		// Generate random filename to prevent path traversal and guess attacks
		const randomId = crypto.randomBytes(6).toString('hex');
		const filename = `cat-${Date.now()}-${randomId}${extension}`;
		cb(null, filename);
	}
});

// Validate MIME type before accepting file
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
	if (!allowedMimeTypes.has(file.mimetype)) {
		return cb(new ValidationError('Only JPG, PNG, or WEBP images are allowed', { field: 'photo' }));
	}
	cb(null, true);
};

// Configure multer with size and type restrictions
const upload = multer({
	storage,
	fileFilter,
	limits: { fileSize: 5 * 1024 * 1024 }
});

// POST /cats - Create new cat profile (requires authentication and photo upload)
catsRoutes.post(
	'/',
	authMiddleware,
	upload.single('photo'),
	validate({ body: createCatSchema }),
	catsController.create
);

// GET /cats - List cat profiles with pagination and filtering
catsRoutes.get('/', validate({ query: listCatsQuerySchema }), catsController.list);

// GET /cats/:id - Fetch single cat profile by ID
catsRoutes.get('/:id', validate({ params: catIdParamSchema }), catsController.getById);
