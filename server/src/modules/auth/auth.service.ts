import argon2 from 'argon2';
import { query } from '../../config/db.js';
import { signStaffAccess, signStaffRefresh, verifyRefresh } from '../../shared/jwt.js';
import { AuthError, NotFoundError } from '../../shared/errors.js';
import { logger } from '../../shared/logger.js';

interface StaffRow {
  id: string;
  tenant_id: string;
  outlet_id: string | null;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  avatar: string;
  title: string | null;
  is_active: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string;
    title: string | null;
    tenant_id: string;
    outlet_id: string | null;
  };
}

/**
 * Authenticate staff by email + password → JWT pair.
 * Argon2id verification. Updates last_login_at on success.
 */
export async function loginStaff(email: string, password: string): Promise<AuthTokens> {
  const result = await query<StaffRow>(
    `SELECT id, tenant_id, outlet_id, name, email, password_hash, role, avatar, title, is_active
     FROM staff
     WHERE email = $1
     LIMIT 1`,
    [email]
  );

  const staff = result.rows[0];
  if (!staff) {
    // Constant-time: hash a dummy to prevent timing attacks
    await argon2.hash('dummy-password-timing-safe');
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  if (!staff.is_active) {
    throw new AuthError('Account is deactivated', 'ACCOUNT_DISABLED');
  }

  const validPassword = await argon2.verify(staff.password_hash, password);
  if (!validPassword) {
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Update last_login_at (fire-and-forget)
  query('UPDATE staff SET last_login_at = now() WHERE id = $1', [staff.id]).catch((err) => {
    logger.warn({ err, staffId: staff.id }, 'Failed to update last_login_at');
  });

  const outletId = staff.outlet_id ?? '';
  const accessToken = signStaffAccess({
    sub: staff.id,
    tid: staff.tenant_id,
    oid: outletId,
    role: staff.role,
  });
  const refreshToken = signStaffRefresh(staff.id, staff.tenant_id);

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'Bearer',
    expires_in: '2h',
    user: {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      avatar: staff.avatar,
      title: staff.title,
      tenant_id: staff.tenant_id,
      outlet_id: staff.outlet_id,
    },
  };
}

/**
 * Rotate access token using a valid refresh token.
 * Re-fetches staff record to pick up any role/status changes.
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  const payload = verifyRefresh(refreshToken);

  const result = await query<StaffRow>(
    `SELECT id, tenant_id, outlet_id, name, email, role, avatar, title, is_active, password_hash
     FROM staff
     WHERE id = $1 AND tenant_id = $2
     LIMIT 1`,
    [payload.sub, payload.tid]
  );

  const staff = result.rows[0];
  if (!staff) {
    throw new NotFoundError('Staff account');
  }
  if (!staff.is_active) {
    throw new AuthError('Account has been deactivated', 'ACCOUNT_DISABLED');
  }

  const outletId = staff.outlet_id ?? '';
  const newAccessToken = signStaffAccess({
    sub: staff.id,
    tid: staff.tenant_id,
    oid: outletId,
    role: staff.role,
  });
  const newRefreshToken = signStaffRefresh(staff.id, staff.tenant_id);

  return {
    access_token: newAccessToken,
    refresh_token: newRefreshToken,
    token_type: 'Bearer',
    expires_in: '2h',
    user: {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      avatar: staff.avatar,
      title: staff.title,
      tenant_id: staff.tenant_id,
      outlet_id: staff.outlet_id,
    },
  };
}

/**
 * Hash a plaintext password with Argon2id.
 * Used during seeding and password changes.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return argon2.hash(plaintext, {
    type: argon2.argon2id,
    memoryCost: 65536,  // 64 MB
    timeCost: 3,
    parallelism: 4,
  });
}
