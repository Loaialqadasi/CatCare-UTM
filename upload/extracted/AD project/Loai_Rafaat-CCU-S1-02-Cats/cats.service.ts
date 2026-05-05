import { NotFoundError } from '../../shared/errors';
import { buildPagination, parsePagination } from '../../shared/utils';
import { catsRepository } from './cats.repository';
import { Cat, CatListQuery, CatListResult, CreateCatInput } from './cats.types';

export const catsService = {
  // Create and persist new cat profile
  async createCat(input: CreateCatInput): Promise<Cat> {
    return catsRepository.create(input);
  },

  // Retrieve paginated list of cat profiles with filtering
  async listCats(query: CatListQuery): Promise<CatListResult> {
    const { page, pageSize, offset } = parsePagination(query.page, query.pageSize);
    const [items, totalItems] = await Promise.all([
      catsRepository.list(query.search, query.healthStatus, pageSize, offset),
      catsRepository.count(query.search, query.healthStatus)
    ]);
    return {
      items,
      pagination: buildPagination(page, pageSize, totalItems)
    };
  },

  // Fetch single cat profile by ID
  async getCatById(id: number): Promise<Cat> {
    const cat = await catsRepository.findById(id);
    if (!cat) {
      throw new NotFoundError('Cat not found');
    }
    return cat;
  }
};
