import { NotFoundError, ValidationError } from '../../shared/errors';
import { buildPagination, parsePagination } from '../../shared/utils';
import { catsRepository } from '../cats/cats.repository';
import { emergenciesRepository } from './emergencies.repository';
import {
  CreateEmergencyInput,
  EmergencyListQuery,
  EmergencyListResult,
  EmergencyReportWithCat,
  EmergencyStatus
} from './emergencies.types';

// Define valid status transitions for emergency workflow
const statusTransitions: Record<EmergencyStatus, EmergencyStatus[]> = {
  open: ['in_progress', 'resolved', 'cancelled'],
  in_progress: ['open', 'resolved', 'cancelled'],
  resolved: ['open', 'in_progress', 'cancelled'],
  cancelled: []
};

export const emergenciesService = {
  // Create new emergency report with optional cat link validation
  async createEmergency(input: CreateEmergencyInput): Promise<EmergencyReportWithCat> {
    if (input.catId) {
      const exists = await catsRepository.existsById(input.catId);
      if (!exists) {
        throw new NotFoundError('Cat not found');
      }
    }
    return emergenciesRepository.create(input);
  },

  // Retrieve paginated emergency reports with filtering
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

  // Fetch single emergency report by ID
  async getEmergencyById(id: number): Promise<EmergencyReportWithCat> {
    const report = await emergenciesRepository.findById(id);
    if (!report) {
      throw new NotFoundError('Emergency report not found');
    }
    return report;
  },

  // Get priority-sorted feed of active emergency reports
  async listPriorityFeed(): Promise<EmergencyReportWithCat[]> {
    return emergenciesRepository.listPriorityFeed();
  },

  // Update emergency status with validation of allowed transitions
  async updateStatus(id: number, status: EmergencyStatus): Promise<EmergencyReportWithCat> {
    const report = await emergenciesRepository.findById(id);
    if (!report) {
      throw new NotFoundError('Emergency report not found');
    }

    // Validate that the status transition is allowed
    if (status !== report.status && !statusTransitions[report.status].includes(status)) {
      throw new ValidationError('Invalid status transition', { from: report.status, to: status });
    }

    // Let the DB set resolved_at with NOW() to avoid app/DB timezone mismatch
    const updated = await emergenciesRepository.updateStatus(id, status);
    if (!updated) {
      throw new NotFoundError('Emergency report not found');
    }
    return updated;
  }
};
