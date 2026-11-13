/**
 * JWT utility: RS256 sign/verify for staff and guest tokens.
 * Separate token types prevent scope escalation.
 */
import jwt, { type Algorithm, type SignOptions, type JwtPayload } from 'jsonwebtoken';
import { jwtKeys, env } from '../config/env.js';
import { AuthError } from './errors.js';

const ALGORITHM: Algorithm = 'RS256';

// ── Token payload types ──

export interface StaffTokenPayload {
  sub: string;       // staff UUID
  tid: string;       // tenant UUID
  oid: string;       // outlet UUID
  role: string;      // admin | manager | cashier | waiter | kitchen
  scope: 'staff';
}

export interface GuestTokenPayload {
  sub: string;       // session UUID
  tid: string;       // tenant UUID
  tbl: string;       // table UUID
  scope: 'guest';
}

export interface RefreshTokenPayload {
  sub: string;
  tid: string;
  scope: 'refresh';
}

export type TokenPayload = StaffTokenPayload | GuestTokenPayload | RefreshTokenPayload;

// ── Sign ──

function sign(payload: object, expiresIn: string): string {
  const options: SignOptions = {
    algorithm: ALGORITHM,
    expiresIn: expiresIn as any,
    issuer: 'loc-qr-platform',
  };
  return jwt.sign(payload, jwtKeys.privateKey, options);
}

export function signStaffAccess(payload: Omit<StaffTokenPayload, 'scope'>): string {
  return sign({ ...payload, scope: 'staff' }, env.JWT_ACCESS_TTL);
}

export function signStaffRefresh(sub: string, tid: string): string {
  return sign({ sub, tid, scope: 'refresh' }, env.JWT_REFRESH_TTL);
}

export function signGuestSession(payload: Omit<GuestTokenPayload, 'scope'>): string {
  return sign({ ...payload, scope: 'guest' }, env.JWT_GUEST_TTL);
}

// ── Verify ──

export function verify(token: string): TokenPayload & JwtPayload {
  try {
    const decoded = jwt.verify(token, jwtKeys.publicKey, {
      algorithms: [ALGORITHM],
      issuer: 'loc-qr-platform',
    });
    if (typeof decoded === 'string') {
      throw new AuthError('Invalid token format');
    }
    return decoded as TokenPayload & JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AuthError('Token expired', 'TOKEN_EXPIRED');
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new AuthError('Invalid token', 'TOKEN_INVALID');
    }
    throw new AuthError('Token verification failed');
  }
}

export function verifyStaff(token: string): StaffTokenPayload & JwtPayload {
  const payload = verify(token);
  if (payload.scope !== 'staff') {
    throw new AuthError('Staff token required', 'WRONG_SCOPE');
  }
  return payload as StaffTokenPayload & JwtPayload;
}

export function verifyGuest(token: string): GuestTokenPayload & JwtPayload {
  const payload = verify(token);
  if (payload.scope !== 'guest') {
    throw new AuthError('Guest token required', 'WRONG_SCOPE');
  }
  return payload as GuestTokenPayload & JwtPayload;
}

export function verifyRefresh(token: string): RefreshTokenPayload & JwtPayload {
  const payload = verify(token);
  if (payload.scope !== 'refresh') {
    throw new AuthError('Refresh token required', 'WRONG_SCOPE');
  }
  return payload as RefreshTokenPayload & JwtPayload;
}
