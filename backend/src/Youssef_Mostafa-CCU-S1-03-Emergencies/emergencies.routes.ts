import { Router } from 'express';
import { authMiddleware } from '../Layth_Amgad-CCU-S1-01-Auth/auth.middleware.js';
import { adminMiddleware } from '../Layth_Amgad-CCU-S1-28-Donations/admin.middleware.js';
import { validate } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/validate.middleware.js';
import { emergenciesController } from './emergencies.controller.js';
import {
  createEmergencySchema,
  emergencyIdParamSchema,
  listEmergenciesQuerySchema,
  updateEmergencyStatusSchema
} from './emergencies.schemas.js';

export const emergenciesRoutes = Router();

// report a new emergency — needs to be logged in
emergenciesRoutes.post('/', authMiddleware, validate({ body: createEmergencySchema }), emergenciesController.create);

// browse all emergencies with filters
emergenciesRoutes.get('/', validate({ query: listEmergenciesQuerySchema }), emergenciesController.list);

// priority feed — public, no auth needed
emergenciesRoutes.get('/priority-feed', emergenciesController.priorityFeed);

// MED-08 Fix: Change emergency status — now requires admin role
// Only admins (and volunteers with proper role) should change emergency status
emergenciesRoutes.patch(
  '/:id/status',
  authMiddleware,
  adminMiddleware,
  validate({ params: emergencyIdParamSchema, body: updateEmergencyStatusSchema }),
  emergenciesController.updateStatus
);

// view a single emergency
emergenciesRoutes.get('/:id', validate({ params: emergencyIdParamSchema }), emergenciesController.getById);

// soft delete an emergency — admin only
emergenciesRoutes.delete(
  '/:id',
  authMiddleware,
  adminMiddleware,
  validate({ params: emergencyIdParamSchema }),
  emergenciesController.softDelete
);

// restore a soft-deleted emergency — admin only
emergenciesRoutes.patch(
  '/:id/restore',
  authMiddleware,
  adminMiddleware,
  validate({ params: emergencyIdParamSchema }),
  emergenciesController.restore
);
