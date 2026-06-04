import { NotFoundError } from './errors.js';
import { buildPagination, parsePagination } from './utils.js';
import { volunteersRepository } from './volunteers.repository.js';
import { CreateVolunteerInput, VolunteerListQuery } from './volunteers.types.js';

export const volunteersService = {
  async create(input: CreateVolunteerInput, userId: number) {
    return volunteersRepository.create(input, userId);
  },

  async list(query: VolunteerListQuery) {
    const { page, pageSize } = parsePagination(query.page, query.pageSize);
    const [items, totalItems] = await volunteersRepository.list(page, pageSize, query.status);
    return {
      items,
      pagination: buildPagination(page, pageSize, totalItems),
    };
  },

  async getMyVolunteerings(userId: number) {
    return volunteersRepository.findByUserId(userId);
  },

  async updateStatus(id: number, status: 'approved' | 'rejected') {
    const updated = await volunteersRepository.updateStatus(id, status);
    if (!updated) throw new NotFoundError('Volunteer application not found');
    return updated;
  },
};
