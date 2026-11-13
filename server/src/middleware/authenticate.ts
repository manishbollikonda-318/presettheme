/**
 * JWT authentication middleware.
 * Extracts Bearer token, verifies RS256, attaches decoded payload to req.
 * Supports both staff and guest tokens.
 */
import type { Request, Response, NextFunction } from 'express';
import { verify, type TokenPayload } from '../shared/jwt.js';
import { AuthError } from '../shared/errors.js';
import type { JwtPayload } from 'jsonwebtoken';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      token?: TokenPayload & JwtPayload;
    }
  }
}

function extractBearer(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

/**
 * Require any valid JWT (staff or guest).
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (!token) {
    next(new AuthError('Missing authorization header'));
    return;
  }
  try {
    req.token = verify(token);
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Require a staff JWT specifically (reject guest tokens).
 */
export function authenticateStaff(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (!token) {
    next(new AuthError('Missing authorization header'));
    return;
  }
  try {
    const decoded = verify(token);
    if (decoded.scope !== 'staff') {
      next(new AuthError('Staff authentication required', 'WRONG_SCOPE'));
      return;
    }
    req.token = decoded;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Allow both staff and guest tokens (for menu/order endpoints).
 */
export function authenticateAny(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (!token) {
    next(new AuthError('Missing authorization header'));
    return;
  }
  try {
    req.token = verify(token);
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional auth — attaches token if present, continues without if not.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (!token) {
    next();
    return;
  }
  try {
    req.token = verify(token);
  } catch {
    // Token invalid but auth is optional — continue without
  }
  next();
}
