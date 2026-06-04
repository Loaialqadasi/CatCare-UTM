import { Router } from 'express';
import multer from 'multer';
import { validate } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/validate.middleware.js';
import { authMiddleware } from '../Layth_Amgad-CCU-S1-01-Auth/auth.middleware.js';
import { adminMiddleware } from './admin.middleware.js';
import { donationsController } from './donations.controller.js';
import {
  createDonationSchema,
  updateDonationStatusSchema,
  listDonationsQuerySchema,
  donationIdParamSchema
} from './donations.schemas.js';

export const donationsRoutes = Router();

// Multer for receipt uploads — allows images and PDFs
const receiptUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// submit a new donation — needs auth, optional receipt file
donationsRoutes.post(
  '/',
  authMiddleware,
  receiptUpload.single('receipt'),
  validate({ body: createDonationSchema }),
  donationsController.create
);

// MED-07 Fix: Browse all donations — now requires auth + admin
donationsRoutes.get(
  '/',
  authMiddleware,
  adminMiddleware,
  validate({ query: listDonationsQuerySchema }),
  donationsController.list
);

// view own donations — needs auth
donationsRoutes.get(
  '/my',
  authMiddleware,
  donationsController.getMyDonations
);

// MED-07 Fix: Donation summary stats — now requires auth + admin
donationsRoutes.get(
  '/summary',
  authMiddleware,
  adminMiddleware,
  donationsController.getSummary
);

// view a single donation — requires auth
donationsRoutes.get(
  '/:id',
  authMiddleware,
  validate({ params: donationIdParamSchema }),
  donationsController.getById
);

// mark a donation as reviewed — admin only
donationsRoutes.patch(
  '/:id/review',
  authMiddleware,
  adminMiddleware,
  validate({ params: donationIdParamSchema, body: updateDonationStatusSchema }),
  donationsController.review
);

// approve a donation — admin only
donationsRoutes.patch(
  '/:id/approve',
  authMiddleware,
  adminMiddleware,
  validate({ params: donationIdParamSchema }),
  donationsController.approve
);

// reject a donation — admin only
donationsRoutes.patch(
  '/:id/reject',
  authMiddleware,
  adminMiddleware,
  validate({ params: donationIdParamSchema, body: updateDonationStatusSchema }),
  donationsController.reject
);
