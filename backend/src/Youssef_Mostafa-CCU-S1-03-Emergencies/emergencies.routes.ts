import { Router } from 'express';
import { authMiddleware } from '../Layth_Amgad-CCU-S1-01-Auth/auth.middleware.js';
import { managerMiddleware, adminMiddleware, volunteerMiddleware } from '../Layth_Amgad-CCU-S1-28-Donations/admin.middleware.js';
import { csrfProtection } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/csrf.js';
import { validate } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/validate.middleware.js';
import { emergenciesController } from './emergencies.controller.js';
import {
  createEmergencySchema,
  emergencyIdParamSchema,
  listEmergenciesQuerySchema,
  updateEmergencyStatusSchema,
  submitProofSchema
} from './emergencies.schemas.js';

export const emergenciesRoutes = Router();

// report a new emergency — needs to be logged in (CSRF already applied globally on /api/emergencies)
emergenciesRoutes.post('/', authMiddleware, validate({ body: createEmergencySchema }), emergenciesController.create);

// browse all emergencies with filters
emergenciesRoutes.get('/', validate({ query: listEmergenciesQuerySchema }), emergenciesController.list);

// priority feed — public, no auth needed
emergenciesRoutes.get('/priority-feed', emergenciesController.priorityFeed);

// MED-08 Fix: Change emergency status — now requires manager role
// Managers and admins can change emergency status
emergenciesRoutes.patch(
  '/:id/status',
  authMiddleware,
  managerMiddleware,
  validate({ params: emergencyIdParamSchema, body: updateEmergencyStatusSchema }),
  emergenciesController.updateStatus
);

// Submit fix proof — volunteer or above can submit proof
emergenciesRoutes.patch(
  '/:id/proof',
  authMiddleware,
  volunteerMiddleware,
  validate({ params: emergencyIdParamSchema, body: submitProofSchema }),
  emergenciesController.submitProof
);

// view a single emergency
emergenciesRoutes.get('/:id', validate({ params: emergencyIdParamSchema }), emergenciesController.getById);

// soft delete an emergency — admin only (CSRF protected)
emergenciesRoutes.delete(
  '/:id',
  authMiddleware,
  adminMiddleware,
  csrfProtection,
  validate({ params: emergencyIdParamSchema }),
  emergenciesController.softDelete
);

// restore a soft-deleted emergency — admin only (CSRF protected)
emergenciesRoutes.patch(
  '/:id/restore',
  authMiddleware,
  adminMiddleware,
  csrfProtection,
  validate({ params: emergencyIdParamSchema }),
  emergenciesController.restore
);
