/**
 * Per-endpoint rate limiters.
 * Uses express-rate-limit with in-memory store (swap to Redis for multi-instance).
 */
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const loginLimiter = rateLimit({
  windowMs: 60_000,
  max: env.RATE_LIMIT_LOGIN,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 1 minute.', code: 'RATE_LIMIT_EXCEEDED' },
});

export const qrVerifyLimiter = rateLimit({
  windowMs: 60_000,
  max: env.RATE_LIMIT_QR_VERIFY,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many QR verification attempts.', code: 'RATE_LIMIT_EXCEEDED' },
});

export const orderCreateLimiter = rateLimit({
  windowMs: 60_000,
  max: env.RATE_LIMIT_ORDER_CREATE,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Order creation rate limit exceeded.', code: 'RATE_LIMIT_EXCEEDED' },
});
