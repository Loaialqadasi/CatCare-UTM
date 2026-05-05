export type ErrorDetails = Record<string, unknown>;

// Base application error class with HTTP status code and error code
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: ErrorDetails;

  constructor(message: string, code: string, statusCode: number, details: ErrorDetails = {}) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
  }
}

// Validation error for invalid input data - HTTP 400
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details: ErrorDetails = {}) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

// Authentication error for missing or invalid tokens - HTTP 401
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', details: ErrorDetails = {}) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
  }
}

// Authorization error for insufficient permissions - HTTP 403
export class AuthorizationError extends AppError {
  constructor(message = 'Not authorized', details: ErrorDetails = {}) {
    super(message, 'AUTHORIZATION_ERROR', 403, details);
  }
}

// Not found error for missing resources - HTTP 404
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details: ErrorDetails = {}) {
    super(message, 'NOT_FOUND', 404, details);
  }
}

// Conflict error for duplicate resources - HTTP 409
export class ConflictError extends AppError {
  constructor(message = 'Conflict', details: ErrorDetails = {}) {
    super(message, 'CONFLICT', 409, details);
  }
}

// Database error for query or connection failures - HTTP 500
export class DatabaseError extends AppError {
  constructor(message = 'Database error', details: ErrorDetails = {}) {
    super(message, 'DATABASE_ERROR', 500, details);
  }
}
