import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),

  JWT_PRIVATE_KEY_B64: z.string().min(1),
  JWT_PUBLIC_KEY_B64: z.string().min(1),
  JWT_ACCESS_TTL: z.string().default('2h'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  JWT_GUEST_TTL: z.string().default('4h'),

  QR_ENCRYPTION_KEY: z.string().length(64, 'Must be 32-byte hex (64 chars)'),
  QR_TOKEN_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(24),

  PORT: z.coerce.number().int().min(1).max(65535).default(4321),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  RATE_LIMIT_LOGIN: z.coerce.number().int().min(1).default(5),
  RATE_LIMIT_QR_VERIFY: z.coerce.number().int().min(1).default(20),
  RATE_LIMIT_ORDER_CREATE: z.coerce.number().int().min(1).default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment validation failed:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const jwtKeys = {
  privateKey: Buffer.from(env.JWT_PRIVATE_KEY_B64, 'base64').toString('utf-8'),
  publicKey: Buffer.from(env.JWT_PUBLIC_KEY_B64, 'base64').toString('utf-8'),
};
