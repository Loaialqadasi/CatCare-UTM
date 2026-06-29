import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { success } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/response.js';
import { uploadImage } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/upload.js';
import { catsService } from './cats.service.js';
import { CatListQuery, CreateCatInput, UpdateCatInput, CreateCareHistoryInput } from './cats.types.js';

export const catsController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Missing or invalid token');
      }
      const payload = req.body as Omit<CreateCatInput, 'createdByUserId' | 'photoUrl'>;
      let photoUrl: string | null = null;

      // If a file was uploaded, send it to storage
      if (req.file) {
        const result = await uploadImage(req.file.buffer);
        photoUrl = result.url;
      }

      const cat = await catsService.createCat({
        ...payload,
        photoUrl,
        createdByUserId: req.user.id,
      });
      success(res, cat, 201);
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as CatListQuery;
      if (query.cursor) {
        const result = await catsService.listCatsCursor(query);
        success(res, result);
      } else {
        const result = await catsService.listCats(query);
        success(res, result);
      }
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const cat = await catsService.getCatById(id);
      success(res, cat);
    } catch (error) {
      next(error);
    }
  },

  async getCareHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const careHistory = await catsService.getCareHistory(id);
      success(res, careHistory);
    } catch (error) {
      next(error);
    }
  },

  // FIX: New endpoint — volunteers can record care history with optional photo
  async createCareHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Missing or invalid token');
      }
      const catId = Number(req.params.id);
      const { careType, description } = req.body;

      // If a photo was uploaded, send it to storage
      let photoUrl: string | null = null;
      if (req.file) {
        const result = await uploadImage(req.file.buffer, 'catcare-utm/care-history');
        photoUrl = result.url;
      }

      const entry = await catsService.createCareHistory({
        catId,
        careType,
        description,
        performedBy: req.user.fullName || req.user.email,
        performedByUserId: req.user.id,
        photoUrl,
      });
      success(res, entry, 201);
    } catch (error) {
      next(error);
    }
  },

  async softDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      await catsService.softDeleteCat(id);
      success(res, { message: 'Cat soft deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const cat = await catsService.restoreCat(id);
      success(res, cat);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const payload = req.body as UpdateCatInput;
      let photoUrl: string | null | undefined = payload.photoUrl;

      // If a new photo was uploaded, send it to storage
      if (req.file) {
        const result = await uploadImage(req.file.buffer);
        photoUrl = result.url;
      }

      const cat = await catsService.updateCat(id, {
        ...payload,
        photoUrl,
      });
      success(res, cat);
    } catch (error) {
      next(error);
    }
  },

  // FIX: New endpoint for volunteers to update only the cat's health status
  async updateHealthStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { healthStatus } = req.body as { healthStatus: string };
      const cat = await catsService.updateCat(id, { healthStatus } as UpdateCatInput);
      success(res, cat);
    } catch (error) {
      next(error);
    }
  }
};
