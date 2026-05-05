import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { db } from '../../config/database';
import { DatabaseError } from '../../shared/errors';
import {
  EmergencyReport,
  EmergencyReportWithCat,
  EmergencyPriority,
  EmergencyStatus,
  EmergencyType,
  CreateEmergencyInput
} from './emergencies.types';

interface EmergencyRow extends RowDataPacket {
  id: number;
  cat_id: number | null;
  title: string;
  description: string;
  emergency_type: EmergencyType;
  priority: EmergencyPriority;
  status: EmergencyStatus;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  reported_by_user_id: number | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  cat_nickname?: string | null;
}

// Map database row to emergency domain model (without cat info)
const mapEmergency = (row: EmergencyRow): EmergencyReport => ({
  id: row.id,
  catId: row.cat_id,
  title: row.title,
  description: row.description,
  emergencyType: row.emergency_type,
  priority: row.priority,
  status: row.status,
  locationName: row.location_name,
  latitude: row.latitude,
  longitude: row.longitude,
  reportedByUserId: row.reported_by_user_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  resolvedAt: row.resolved_at
});

// Map database row to emergency domain model with linked cat info
const mapEmergencyWithCat = (row: EmergencyRow): EmergencyReportWithCat => ({
  ...mapEmergency(row),
  cat: row.cat_id && row.cat_nickname ? { id: row.cat_id, nickname: row.cat_nickname } : null
});

// Base SELECT query with LEFT JOIN to include cat information
const baseSelect =
  'SELECT er.id, er.cat_id, er.title, er.description, er.emergency_type, er.priority, er.status, er.location_name, er.latitude, er.longitude, er.reported_by_user_id, er.created_at, er.updated_at, er.resolved_at, c.nickname as cat_nickname FROM emergency_reports er LEFT JOIN cats c ON er.cat_id = c.id';

export const emergenciesRepository = {
  // Create new emergency report in database
  async create(input: CreateEmergencyInput): Promise<EmergencyReportWithCat> {
    const [result] = await db.execute<ResultSetHeader>(
      'INSERT INTO emergency_reports (cat_id, title, description, emergency_type, priority, status, location_name, latitude, longitude, reported_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        input.catId ?? null,
        input.title,
        input.description,
        input.emergencyType,
        input.priority,
        'open',
        input.locationName,
        input.latitude ?? null,
        input.longitude ?? null,
        input.reportedByUserId
      ]
    );
    const created = await this.findById(result.insertId);
    if (!created) {
      throw new DatabaseError('Failed to load created emergency report');
    }
    return created;
  },

  // Fetch emergency report by ID with linked cat data
  async findById(id: number): Promise<EmergencyReportWithCat | null> {
    const [rows] = await db.execute<EmergencyRow[]>(`${baseSelect} WHERE er.id = ? LIMIT 1`, [id]);
    if (rows.length === 0) {
      return null;
    }
    return mapEmergencyWithCat(rows[0]);
  },

  // Retrieve paginated list with optional status and priority filtering
  async list(
    status?: EmergencyStatus,
    priority?: EmergencyPriority,
    limit = 10,
    offset = 0
  ): Promise<EmergencyReportWithCat[]> {
    const params: Array<string | number> = [];
    const conditions: string[] = [];
    if (status) {
      conditions.push('er.status = ?');
      params.push(status);
    }
    if (priority) {
      conditions.push('er.priority = ?');
      params.push(priority);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `${baseSelect} ${whereClause} ORDER BY er.created_at DESC LIMIT ? OFFSET ?`;
    const [rows] = await db.execute<EmergencyRow[]>(query, [...params, limit, offset]);
    return rows.map(mapEmergencyWithCat);
  },

  // Count emergency reports matching status and priority criteria
  async count(status?: EmergencyStatus, priority?: EmergencyPriority): Promise<number> {
    const params: Array<string | number> = [];
    const conditions: string[] = [];
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (priority) {
      conditions.push('priority = ?');
      params.push(priority);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM emergency_reports ${whereClause}`,
      params
    );
    return Number(rows[0]?.count ?? 0);
  },

  // Get priority-sorted feed of active emergencies (open or in_progress)
  async listPriorityFeed(): Promise<EmergencyReportWithCat[]> {
    const query = `${baseSelect} WHERE er.status IN ('open', 'in_progress') ORDER BY FIELD(er.priority, 'critical', 'high', 'medium', 'low'), er.created_at DESC, er.id DESC`;
    const [rows] = await db.execute<EmergencyRow[]>(query);
    return rows.map(mapEmergencyWithCat);
  },

  // Update emergency report status; let DB set resolved_at via NOW() to avoid timezone mismatch
  async updateStatus(id: number, status: EmergencyStatus): Promise<EmergencyReportWithCat | null> {
    await db.execute<ResultSetHeader>(
      `UPDATE emergency_reports
       SET status = ?,
           resolved_at = CASE WHEN ? = 'resolved' THEN NOW() ELSE NULL END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, status, id]
    );
    return this.findById(id);
  }
};
