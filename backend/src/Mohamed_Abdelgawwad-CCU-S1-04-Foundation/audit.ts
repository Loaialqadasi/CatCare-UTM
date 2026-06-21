import type { Request } from 'express';
import { db } from './database.js';
import { logger } from './logger.js';

/**
 * Lightweight audit logger — writes a row to audit_log for security-relevant
 * actions. Failures are logged but never block the calling request, so a
 * broken audit log never breaks the user flow.
 *
 * Example:
 *   audit(req, 'user.role.update', { target_type: 'user', target_id: '42',
 *           metadata: { oldRole: 'student', newRole: 'manager' } });
 */
export interface AuditEvent {
  action: string;
  target_type?: string;
  target_id?: string | number;
  metadata?: Record<string, unknown>;
}

export async function audit(req: Request | undefined, event: AuditEvent): Promise<void> {
  try {
    const actor = req?.user;
    const sql = `
      INSERT INTO audit_log
        (actor_user_id, actor_email, action, target_type, target_id, metadata, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    const params = [
      actor?.id ?? null,
      actor?.email ?? null,
      event.action,
      event.target_type ?? null,
      event.target_id != null ? String(event.target_id) : null,
      event.metadata ? JSON.stringify(event.metadata) : null,
      req?.ip ?? null,
      req?.get('user-agent')?.slice(0, 500) ?? null,
    ];
    await db.query(sql, params);
  } catch (err) {
    // Audit failures must never break the request flow.
    logger.error({ err, event }, 'audit log write failed (non-blocking)');
  }
}
