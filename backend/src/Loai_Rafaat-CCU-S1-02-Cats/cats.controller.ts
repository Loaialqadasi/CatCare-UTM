import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { success } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/response.js';
import { uploadToCloudinary } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/upload.js';
import { catsService } from './cats.service.js';
import { CatListQuery, CreateCatInput } from './cats.types.js';

export const catsController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Missing or invalid token');
      }
      const payload = req.body as Omit<CreateCatInput, 'createdByUserId' | 'photoUrl'>;
      let photoUrl: string | null = null;

      // If a file was uploaded, send it to Cloudinary (or local fallback in dev)
      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer);
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
  }
};
