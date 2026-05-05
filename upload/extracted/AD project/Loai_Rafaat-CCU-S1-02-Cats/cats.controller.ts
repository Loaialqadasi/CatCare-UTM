import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../../shared/errors';
import { success } from '../../shared/response';
import { catsService } from './cats.service';
import { CatListQuery, CreateCatInput } from './cats.types';

export const catsController = {
  // Create new cat profile with optional photo upload
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Missing or invalid token');
      }
      const payload = req.body as Omit<CreateCatInput, 'createdByUserId'>;
      const file = (req as Request & { file?: Express.Multer.File }).file;
      const photoUrl = file ? `/uploads/cats/${file.filename}` : payload.photoUrl ?? null;
      const cat = await catsService.createCat({
        ...payload,
        photoUrl,
        createdByUserId: req.user.id
      });
      success(res, cat, 201);
    } catch (error) {
      next(error);
    }
  },

  // Retrieve paginated list of cat profiles with optional filtering
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as CatListQuery;
      const result = await catsService.listCats(query);
      success(res, result);
    } catch (error) {
      next(error);
    }
  },

  // Get single cat profile by ID
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const cat = await catsService.getCatById(id);
      success(res, cat);
    } catch (error) {
      next(error);
    }
  }
};
