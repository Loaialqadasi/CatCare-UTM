import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { success } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/response.js';
import { uploadImage } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/upload.js';
import { emergenciesService } from './emergencies.service.js';
import { CreateEmergencyInput, EmergencyListQuery, UpdateEmergencyStatusInput } from './emergencies.types.js';

export const emergenciesController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Missing or invalid token');
      }
      const payload = req.body as Omit<CreateEmergencyInput, 'reportedByUserId'>;
      const report = await emergenciesService.createEmergency({
        ...payload,
        reportedByUserId: req.user.id
      });
      success(res, report, 201);
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as EmergencyListQuery;
      if (query.cursor) {
        const result = await emergenciesService.listEmergenciesCursor(query);
        success(res, result);
      } else {
        const result = await emergenciesService.listEmergencies(query);
        success(res, result);
      }
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const report = await emergenciesService.getEmergencyById(id);
      success(res, report);
    } catch (error) {
      next(error);
    }
  },

  async priorityFeed(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await emergenciesService.listPriorityFeed();
      success(res, items);
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const payload = req.body as UpdateEmergencyStatusInput;
      const report = await emergenciesService.updateStatus(id, payload.status);
      success(res, report);
    } catch (error) {
      next(error);
    }
  },

  async softDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      await emergenciesService.softDeleteEmergency(id);
      success(res, { message: 'Emergency report soft deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const report = await emergenciesService.restoreEmergency(id);
      success(res, report);
    } catch (error) {
      next(error);
    }
  },

  // FIX: Submit fix proof — now supports image upload via multer
  // If req.file is present, it's uploaded to Supabase storage and the URL is saved
  async submitProof(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Missing or invalid token');
      }
      const id = Number(req.params.id);
      const { proofNotes } = req.body;

      // If a proof image was uploaded, send it to storage
      let proofImageUrl: string | null = null;
      if (req.file) {
        const result = await uploadImage(req.file.buffer, 'catcare-utm/proofs');
        proofImageUrl = result.url;
      }

      const report = await emergenciesService.submitProof(id, proofNotes, proofImageUrl, req.user.id);
      success(res, report);
    } catch (error) {
      next(error);
    }
  }
};
