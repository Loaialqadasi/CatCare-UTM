// Layth Amgad — CCU-S1-28 | Donations & Admin Approval Module

import { Router } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { validate } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/validate.middleware.js';
import { authMiddleware } from '../Layth_Amgad-CCU-S1-01-Auth/auth.middleware.js';
import { ValidationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { adminMiddleware } from './admin.middleware.js';
import { donationsController } from './donations.controller.js';
import {
  donationIdParamSchema,
  reviewDonationSchema,
  submitDonationSchema
} from './donations.schemas.js';

export const donationsRoutes = Router();

// make sure the upload folder exists before multer tries to save anything
const uploadDir = path.join(process.cwd(), 'uploads', 'receipts');
fs.mkdirSync(uploadDir, { recursive: true });

// only allow image formats that a bank receipt would realistically come as
const allowedReceiptTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);
const mimeExtensionMap: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic'
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const extension = mimeExtensionMap[file.mimetype];
    if (!extension) {
      return cb(
        new ValidationError('Only JPG, PNG, WEBP or HEIC images are accepted', { field: 'receipt' }),
        ''
      );
    }
    // random hex suffix so two donors with the same name don't overwrite each other
    const randomId = crypto.randomBytes(8).toString('hex');
    const filename = `receipt-${Date.now()}-${randomId}${extension}`;
    cb(null, filename);
  }
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (!allowedReceiptTypes.has(file.mimetype)) {
    return cb(new ValidationError('Only JPG, PNG, WEBP or HEIC images are accepted', { field: 'receipt' }));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB — receipts can be high-res phone photos
});

// --- public-ish routes (no auth needed) ---

// anyone can check the fundraising progress bar
donationsRoutes.get('/progress', donationsController.getProgress);

// donors submit here — no login required so anyone can donate
donationsRoutes.post(
  '/',
  upload.single('receipt'),
  validate({ body: submitDonationSchema }),
  donationsController.submit
);

// --- admin-only routes ---

// list all pending receipts waiting for review
donationsRoutes.get(
  '/pending',
  authMiddleware,
  adminMiddleware,
  donationsController.getPending
);

// approve or reject a single donation
donationsRoutes.patch(
  '/:id/review',
  authMiddleware,
  adminMiddleware,
  validate({ params: donationIdParamSchema, body: reviewDonationSchema }),
  donationsController.review
);
