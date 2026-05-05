import { logger } from '../config/logger';
import { AuthUser } from '../shared/types';

export interface AuditLog {
  action: string;
  userId: number | null;
  userEmail: string | null;
  resourceType: string;
  resourceId: number | null;
  changes?: Record<string, unknown>;
  status: 'success' | 'failure';
  errorMessage?: string;
  timestamp: string;
  ipAddress?: string;
}

// Log all critical actions for security and compliance auditing
export const auditLogger = {
  // Log successful authentication events
  logLogin(user: AuthUser, ipAddress?: string): void {
    const log: AuditLog = {
      action: 'LOGIN',
      userId: user.id,
      userEmail: user.email,
      resourceType: 'user',
      resourceId: user.id,
      status: 'success',
      timestamp: new Date().toISOString(),
      ipAddress
    };
    logger.info(log, 'User login');
  },

  // Log user registration
  logRegister(user: AuthUser, ipAddress?: string): void {
    const log: AuditLog = {
      action: 'REGISTER',
      userId: user.id,
      userEmail: user.email,
      resourceType: 'user',
      resourceId: user.id,
      status: 'success',
      timestamp: new Date().toISOString(),
      ipAddress
    };
    logger.info(log, 'User registration');
  },

  // Log password reset request
  logPasswordResetRequest(email: string, success: boolean, ipAddress?: string): void {
    const log: AuditLog = {
      action: 'PASSWORD_RESET_REQUEST',
      userId: null,
      userEmail: email,
      resourceType: 'user',
      resourceId: null,
      status: success ? 'success' : 'failure',
      timestamp: new Date().toISOString(),
      ipAddress
    };
    logger.info(log, 'Password reset request');
  },

  // Log cat profile creation
  logCatCreate(userId: number, catId: number, catNickname: string): void {
    const log: AuditLog = {
      action: 'CAT_CREATED',
      userId,
      userEmail: null,
      resourceType: 'cat',
      resourceId: catId,
      changes: { nickname: catNickname },
      status: 'success',
      timestamp: new Date().toISOString()
    };
    logger.info(log, 'Cat profile created');
  },

  // Log emergency report creation
  logEmergencyCreate(userId: number, reportId: number, priority: string): void {
    const log: AuditLog = {
      action: 'EMERGENCY_CREATED',
      userId,
      userEmail: null,
      resourceType: 'emergency',
      resourceId: reportId,
      changes: { priority },
      status: 'success',
      timestamp: new Date().toISOString()
    };
    logger.info(log, 'Emergency report created');
  },

  // Log emergency status update
  logEmergencyStatusChange(userId: number, reportId: number, oldStatus: string, newStatus: string): void {
    const log: AuditLog = {
      action: 'EMERGENCY_STATUS_UPDATED',
      userId,
      userEmail: null,
      resourceType: 'emergency',
      resourceId: reportId,
      changes: { oldStatus, newStatus },
      status: 'success',
      timestamp: new Date().toISOString()
    };
    logger.info(log, 'Emergency status updated');
  },

  // Log failed authentication attempts
  logFailedLogin(email: string, ipAddress?: string): void {
    const log: AuditLog = {
      action: 'LOGIN_FAILED',
      userId: null,
      userEmail: email,
      resourceType: 'user',
      resourceId: null,
      status: 'failure',
      errorMessage: 'Invalid credentials',
      timestamp: new Date().toISOString(),
      ipAddress
    };
    logger.warn(log, 'Failed login attempt');
  },

  // Log unauthorized access attempts
  logUnauthorizedAccess(userId: number | null, action: string, resource: string, ipAddress?: string): void {
    const log: AuditLog = {
      action: `UNAUTHORIZED_${action}`,
      userId: userId || null,
      userEmail: null,
      resourceType: resource,
      resourceId: null,
      status: 'failure',
      errorMessage: 'Insufficient permissions',
      timestamp: new Date().toISOString(),
      ipAddress
    };
    logger.warn(log, 'Unauthorized access attempt');
  }
};
