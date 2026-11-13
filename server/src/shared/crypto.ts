/**
 * AES-256-GCM encryption / decryption for QR token anti-tamper.
 * SHA-256 hashing for O(1) database lookups.
 */
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm' as const;
const IV_LENGTH = 12;    // 96-bit IV for GCM
const TAG_LENGTH = 16;   // 128-bit auth tag
const ENCODING = 'base64url' as const;

function getKey(): Buffer {
  return Buffer.from(env.QR_ENCRYPTION_KEY, 'hex');
}

export interface QRPayload {
  table_id: string;
  outlet_id: string;
  tenant_id: string;
  nonce: string;
  issued_at: number;
}

/**
 * Encrypt a QR payload → base64url ciphertext.
 * Format: iv:ciphertext:authTag (all base64url, concatenated with '.')
 */
export function encryptQRPayload(payload: QRPayload): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  const plaintext = JSON.stringify(payload);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString(ENCODING),
    encrypted.toString(ENCODING),
    authTag.toString(ENCODING),
  ].join('.');
}

/**
 * Decrypt a base64url ciphertext → QRPayload.
 * Throws on tampered, malformed, or wrong-key tokens.
 */
export function decryptQRPayload(encryptedToken: string): QRPayload {
  const parts = encryptedToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed QR token structure');
  }

  const [ivB64, ciphertextB64, tagB64] = parts;
  const key = getKey();
  const iv = Buffer.from(ivB64, ENCODING);
  const ciphertext = Buffer.from(ciphertextB64, ENCODING);
  const authTag = Buffer.from(tagB64, ENCODING);

  if (iv.length !== IV_LENGTH) {
    throw new Error('Invalid IV length');
  }
  if (authTag.length !== TAG_LENGTH) {
    throw new Error('Invalid auth tag length');
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString('utf8')) as QRPayload;
}

/**
 * SHA-256 hash of encrypted token for O(1) database index lookup.
 * Deterministic: same input always produces same hash.
 */
export function hashToken(encryptedToken: string): string {
  return createHash('sha256').update(encryptedToken).digest('hex');
}

/**
 * Generate a cryptographically random nonce (hex).
 */
export function generateNonce(bytes = 16): string {
  return randomBytes(bytes).toString('hex');
}
