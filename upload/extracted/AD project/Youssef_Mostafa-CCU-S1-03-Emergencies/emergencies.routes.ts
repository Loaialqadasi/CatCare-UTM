import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { emergenciesController } from './emergencies.controller';
import {
  createEmergencySchema,
  emergencyIdParamSchema,
  listEmergenciesQuerySchema,
  updateEmergencyStatusSchema
} from './emergencies.schemas';

export const emergenciesRoutes = Router();

// POST /emergencies - Create new emergency report (authenticated users only)
emergenciesRoutes.post('/', authMiddleware, validate({ body: createEmergencySchema }), emergenciesController.create);

// GET /emergencies - List emergency reports with pagination and filtering
emergenciesRoutes.get('/', validate({ query: listEmergenciesQuerySchema }), emergenciesController.list);

// GET /emergencies/priority-feed - Get high-priority active emergencies sorted by urgency
emergenciesRoutes.get('/priority-feed', emergenciesController.priorityFeed);

// PATCH /emergencies/:id/status - Update emergency report status (authenticated users only)
emergenciesRoutes.patch(
  '/:id/status',
  authMiddleware,
  validate({ params: emergencyIdParamSchema, body: updateEmergencyStatusSchema }),
  emergenciesController.updateStatus
);

// GET /emergencies/:id - Fetch single emergency report by ID
emergenciesRoutes.get('/:id', validate({ params: emergencyIdParamSchema }), emergenciesController.getById);
