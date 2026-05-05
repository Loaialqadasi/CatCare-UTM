import { NotFoundError, ValidationError } from '../../shared/errors.js';
import { buildPagination, parsePagination } from '../../shared/utils.js';
import { catsRepository } from '../cats/cats.repository.js';
import { emergenciesRepository } from './emergencies.repository.js';
import {
  CreateEmergencyInput,
  EmergencyListQuery,
  EmergencyListResult,
  EmergencyReportWithCat,
  EmergencyStatus
} from './emergencies.types.js';

const statusTransitions: Record<EmergencyStatus, EmergencyStatus[]> = {
  open: ['in_progress', 'resolved', 'cancelled'],
  in_progress: ['open', 'resolved', 'cancelled'],
  resolved: ['open', 'in_progress', 'cancelled'],
  cancelled: []
};

export const emergenciesService = {
  async createEmergency(input: CreateEmergencyInput): Promise<EmergencyReportWithCat> {
    if (input.catId) {
      const exists = await catsRepository.existsById(input.catId);
      if (!exists) {
        throw new NotFoundError('Cat not found');
      }
    }
    return emergenciesRepository.create(input);
  },

  async listEmergencies(query: EmergencyListQuery): Promise<EmergencyListResult> {
    const { page, pageSize, offset } = parsePagination(query.page, query.pageSize);
    const [items, totalItems] = await Promise.all([
      emergenciesRepository.list(query.status, query.priority, pageSize, offset),
      emergenciesRepository.count(query.status, query.priority)
    ]);
    return {
      items,
      pagination: buildPagination(page, pageSize, totalItems)
    };
  },

  async getEmergencyById(id: number): Promise<EmergencyReportWithCat> {
    const report = await emergenciesRepository.findById(id);
    if (!report) {
      throw new NotFoundError('Emergency report not found');
    }
    return report;
  },

  async listPriorityFeed(): Promise<EmergencyReportWithCat[]> {
    return emergenciesRepository.listPriorityFeed();
  },

  async updateStatus(id: number, status: EmergencyStatus): Promise<EmergencyReportWithCat> {
    const report = await emergenciesRepository.findById(id);
    if (!report) {
      throw new NotFoundError('Emergency report not found');
    }

    if (status !== report.status && !statusTransitions[report.status].includes(status)) {
      throw new ValidationError('Invalid status transition', { from: report.status, to: status });
    }

    const updated = await emergenciesRepository.updateStatus(id, status);
    if (!updated) {
      throw new NotFoundError('Emergency report not found');
    }
    return updated;
  }
};
