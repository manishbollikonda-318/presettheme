export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string = 'INTERNAL_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication required', code = 'AUTH_REQUIRED') {
    super(401, message, code);
    this.name = 'AuthError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions', code = 'FORBIDDEN') {
    super(403, message, code);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource', code = 'NOT_FOUND') {
    super(404, `${resource} not found`, code);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super(429, 'Too many requests', 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class QRTokenError extends AppError {
  constructor(message = 'Invalid or expired QR token', code = 'QR_INVALID') {
    super(403, message, code);
    this.name = 'QRTokenError';
  }
}
