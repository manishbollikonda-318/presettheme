import { query, getClient } from '../../config/db.js';
import { encryptQRPayload, decryptQRPayload, hashToken, generateNonce } from '../../shared/crypto.js';
import { signGuestSession } from '../../shared/jwt.js';
import { QRTokenError, NotFoundError, ConflictError } from '../../shared/errors.js';
import { logger } from '../../shared/logger.js';

interface TableRow {
  id: string;
  outlet_id: string;
  table_number: string;
  is_active: boolean;
}

interface QRTokenRow {
  id: string;
  table_id: string;
  encrypted_token: string;
  token_hash: string;
  expires_at: string;
  is_revoked: boolean;
}

interface SessionRow {
  id: string;
  table_id: string;
}

export interface GeneratedQR {
  qr_token_id: string;
  encrypted_token: string;
  qr_url: string;
  table_number: string;
  expires_at: string;
}

export interface VerifiedSession {
  session_id: string;
  access_token: string;
  token_type: 'Bearer';
  table: {
    id: string;
    number: string;
  };
  tenant_id: string;
  outlet_id: string;
}

/**
 * Generate an encrypted QR token for a specific table.
 * Revokes any existing active tokens for that table.
 */
export async function generateQRToken(
  tableId: string,
  tenantId: string,
  ttlHours: number
): Promise<GeneratedQR> {
  // Verify table exists and belongs to tenant's outlet
  const tableResult = await query<TableRow & { tenant_id: string }>(
    `SELECT t.id, t.outlet_id, t.table_number, t.is_active, o.tenant_id
     FROM tables t
     JOIN outlets o ON o.id = t.outlet_id
     WHERE t.id = $1 AND o.tenant_id = $2`,
    [tableId, tenantId]
  );

  const table = tableResult.rows[0];
  if (!table) {
    throw new NotFoundError('Table');
  }
  if (!table.is_active) {
    throw new ConflictError('Table is not active');
  }

  // Revoke all existing active tokens for this table
  await query(
    `UPDATE qr_tokens SET is_revoked = true WHERE table_id = $1 AND is_revoked = false`,
    [tableId]
  );

  // Build and encrypt payload
  const nonce = generateNonce();
  const payload = {
    table_id: tableId,
    outlet_id: table.outlet_id,
    tenant_id: tenantId,
    nonce,
    issued_at: Math.floor(Date.now() / 1000),
  };

  const encryptedToken = encryptQRPayload(payload);
  const tokenHash = hashToken(encryptedToken);
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  // Persist to database
  const insertResult = await query<{ id: string }>(
    `INSERT INTO qr_tokens (table_id, encrypted_token, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [tableId, encryptedToken, tokenHash, expiresAt.toISOString()]
  );

  const qrTokenId = insertResult.rows[0].id;

  logger.info({ qrTokenId, tableId, ttlHours }, 'QR token generated');

  return {
    qr_token_id: qrTokenId,
    encrypted_token: encryptedToken,
    qr_url: `/qr/verify/${encodeURIComponent(encryptedToken)}`,
    table_number: table.table_number,
    expires_at: expiresAt.toISOString(),
  };
}

/**
 * Verify an encrypted QR token → create session → issue guest JWT.
 * Full anti-tamper pipeline:
 *   1. SHA-256 hash → O(1) DB lookup
 *   2. Check not revoked + not expired
 *   3. AES-256-GCM decrypt → extract table/outlet/tenant
 *   4. Verify table is active
 *   5. Create or reuse active session
 *   6. Issue guest-scoped JWT
 */
export async function verifyQRToken(encryptedToken: string): Promise<VerifiedSession> {
  // Step 1: Hash-based lookup
  const tokenHash = hashToken(encryptedToken);

  const tokenResult = await query<QRTokenRow>(
    `SELECT id, table_id, encrypted_token, token_hash, expires_at, is_revoked
     FROM qr_tokens
     WHERE token_hash = $1
     LIMIT 1`,
    [tokenHash]
  );

  const tokenRow = tokenResult.rows[0];
  if (!tokenRow) {
    throw new QRTokenError('QR code not recognized', 'QR_NOT_FOUND');
  }

  // Step 2: Revocation + expiry check
  if (tokenRow.is_revoked) {
    throw new QRTokenError('QR code has been revoked', 'QR_REVOKED');
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    throw new QRTokenError('QR code has expired', 'QR_EXPIRED');
  }

  // Step 3: Decrypt and verify integrity
  let decrypted;
  try {
    decrypted = decryptQRPayload(tokenRow.encrypted_token);
  } catch {
    throw new QRTokenError('QR code integrity check failed', 'QR_TAMPERED');
  }

  // Step 4: Verify table is active
  const tableResult = await query<TableRow>(
    `SELECT id, outlet_id, table_number, is_active
     FROM tables
     WHERE id = $1`,
    [decrypted.table_id]
  );

  const table = tableResult.rows[0];
  if (!table || !table.is_active) {
    throw new QRTokenError('Table is no longer active', 'TABLE_INACTIVE');
  }

  // Step 5: Find or create active session
  const client = await getClient();
  let sessionId: string;

  try {
    await client.query('BEGIN');

    // Check for existing active session on this table from this QR
    const existingSession = await client.query<SessionRow>(
      `SELECT id FROM active_sessions
       WHERE table_id = $1 AND qr_token_id = $2 AND status = 'active'
       LIMIT 1`,
      [decrypted.table_id, tokenRow.id]
    );

    if (existingSession.rows[0]) {
      sessionId = existingSession.rows[0].id;
    } else {
      // Close any stale sessions for this table
      await client.query(
        `UPDATE active_sessions SET status = 'abandoned', closed_at = now()
         WHERE table_id = $1 AND status = 'active'`,
        [decrypted.table_id]
      );

      // Create new session
      const sessionResult = await client.query<{ id: string }>(
        `INSERT INTO active_sessions (table_id, qr_token_id)
         VALUES ($1, $2)
         RETURNING id`,
        [decrypted.table_id, tokenRow.id]
      );
      sessionId = sessionResult.rows[0].id;
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // Step 6: Issue guest-scoped JWT
  const accessToken = signGuestSession({
    sub: sessionId,
    tid: decrypted.tenant_id,
    tbl: decrypted.table_id,
  });

  logger.info({ sessionId, tableId: decrypted.table_id }, 'QR verified, session created');

  return {
    session_id: sessionId,
    access_token: accessToken,
    token_type: 'Bearer',
    table: {
      id: table.id,
      number: table.table_number,
    },
    tenant_id: decrypted.tenant_id,
    outlet_id: decrypted.outlet_id,
  };
}

/**
 * Revoke a QR token by ID. Closes associated active sessions.
 */
export async function revokeQRToken(qrTokenId: string, tenantId: string): Promise<void> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Verify ownership via table → outlet → tenant chain
    const verifyResult = await client.query<{ id: string }>(
      `SELECT qt.id
       FROM qr_tokens qt
       JOIN tables t ON t.id = qt.table_id
       JOIN outlets o ON o.id = t.outlet_id
       WHERE qt.id = $1 AND o.tenant_id = $2 AND qt.is_revoked = false`,
      [qrTokenId, tenantId]
    );

    if (!verifyResult.rows[0]) {
      throw new NotFoundError('QR token');
    }

    // Revoke the token
    await client.query(
      `UPDATE qr_tokens SET is_revoked = true WHERE id = $1`,
      [qrTokenId]
    );

    // Close any active sessions tied to this QR
    await client.query(
      `UPDATE active_sessions SET status = 'closed', closed_at = now()
       WHERE qr_token_id = $1 AND status = 'active'`,
      [qrTokenId]
    );

    await client.query('COMMIT');

    logger.info({ qrTokenId }, 'QR token revoked');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * List active (non-revoked, non-expired) QR tokens for an outlet.
 */
export async function listActiveTokens(tenantId: string, outletId?: string) {
  let sql = `
    SELECT qt.id, qt.table_id, t.table_number, qt.issued_at, qt.expires_at,
           qt.encrypted_token
    FROM qr_tokens qt
    JOIN tables t ON t.id = qt.table_id
    JOIN outlets o ON o.id = t.outlet_id
    WHERE o.tenant_id = $1
      AND qt.is_revoked = false
      AND qt.expires_at > now()
  `;
  const params: unknown[] = [tenantId];

  if (outletId) {
    sql += ` AND o.id = $2`;
    params.push(outletId);
  }

  sql += ` ORDER BY t.table_number ASC`;

  const result = await query(sql, params);
  return result.rows;
}
