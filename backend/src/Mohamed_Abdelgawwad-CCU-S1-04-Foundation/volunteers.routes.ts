import { Router } from 'express';
import { validate } from './validate.middleware.js';
import { authMiddleware } from '../Layth_Amgad-CCU-S1-01-Auth/auth.middleware.js';
import { adminMiddleware } from '../Layth_Amgad-CCU-S1-28-Donations/admin.middleware.js';
import { volunteersController } from './volunteers.controller.js';
import { z } from 'zod';

export const volunteersRoutes = Router();

const createVolunteerSchema = z.object({
  studentName: z.string().min(2).max(200).trim(),
  studentId: z.string().min(1).max(50).trim(),
  age: z.coerce.number().int().min(16).max(100),
  faculty: z.string().min(2).max(200).trim(),
  interests: z.string().min(10).max(1000).trim(),
});

const updateVolunteerStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

// Submit volunteer application — needs auth
volunteersRoutes.post(
  '/',
  authMiddleware,
  validate({ body: createVolunteerSchema }),
  volunteersController.create
);

// Get my volunteer applications — needs auth
volunteersRoutes.get(
  '/my',
  authMiddleware,
  volunteersController.getMyVolunteerings
);

// List all volunteer applications — admin only
volunteersRoutes.get(
  '/',
  authMiddleware,
  adminMiddleware,
  volunteersController.list
);

// Update volunteer application status — admin only
volunteersRoutes.patch(
  '/:id/status',
  authMiddleware,
  adminMiddleware,
  validate({ body: updateVolunteerStatusSchema }),
  volunteersController.updateStatus
);
