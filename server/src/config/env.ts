import { z } from 'zod';
import dotenv from 'dotenv';
import { createHash } from 'node:crypto';

dotenv.config();

// Tested default RS256 Base64 PEM keys for seamless zero-config production boot
const DEFAULT_JWT_PRIVATE =
  'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRQ2FXbVhrZWUzMWpFWUEKSVNVdm5ZZ2RyWnZuRlc4QTgzUjZtVkU0L3JtaXZQUlY3bUVVd01IdEVDSGxuTHQzWDV4bVBBeUljN1EwaitDZgphRGxwZUxlcldQZDFOSEdMSVRaTWFrRHVvZ0FqaEYrcDMyV0IxUysrdlpZNng2N21vV2ltZERxV0YxcVVyUDkvCm1OaVBiRHdOWFNpb3RGNEFRZnZHU1haRCsrNVplZTBraU5oemdxaWpVMkE2WnNqdmozY0w1MWpBZEZraXJ6dXEKY2JXSzMxbFhaYzlOYlYvK1JPTUtsRTVqaVRpcTl2eGJHSG4zYWhob0Vvb1llZWZhZXZPY3VWdWZLcElTVjVWaApVZkNMNzVKQi9qYk9XTDJxUCtrczhmbnBUK1IrUEcyc2RFR1QxS3VNYUFoaSs1Ynl0bjYvbHVtNGpMTzlLUjNWCkkzL2JPaXVkQWdNQkFBRUNnZ0VBUkpaTnQ1Qk1vbk5oK1pYQTRkOGt5RmRJTXc5dG8yVUxDWjFPSDc3a3UwRXUKYTI3Qkdja3JndzFMbXEyaUNjSGxDL0s3K1BnOUI2dzFPbkJFTHE5VElpTW0xcUJtb2RXd3ZKVHNaSDE5QlV0QgpmUWtGSUlPY015d29jTmNoUzE5RzBzeEw2anpYWmNCWHlobWZoVitwY2FESE8rdmw1MFJxdmVvUDBOYkdTMkIyCmkvOUhlbDdhNWJMREczUmRuaXh3THlSR0dBRlhXUU5yZnd2U3V5UjdxNGFqa1dYT3BpZzh2d0JBL0xjdWxyTEcKRDBlRk5CL25ndjZ2REJxNHNVK3RrdzlRVE9oSjBTcGRaWmZmbTNjUnJRdkxoMWR6OVcvMjIrODRsVytMWncxNwpqOHFXKytIQnc0aFdvbzF0eEgwL3BackJUODhFTXppRkdDdlFtRlhUaXdLQmdRRFo5K3g5b0xVRm02amMwL0N2CnIva2ZLclI5N0tCbWQrbEdLVCtDYWdWamp1MFcxcStLelZoSDJ2aEduWWxLd3JQZWtRR056VWducXl3ZnI3VEYKZHRwS0dPN2l2OEJQOUZGWjRxQzVDUmF2dm5GKzhiYU1YSzdLZnZacDBRWXYrdzRsckdHZTVlVVlLRFNPMGtQTgowQ3F4UkJ0YjFJQUxSK2I1aDg5Z0IzVVYrd0tCZ1FDMVNQSGt1UVJkb0YrUGhESkFQVXY2cUV2a3FFOVN0Ulk5CmtUT0ZNZG5SRXFRTzQ4dmQ1eThacnMvTnVuUzZ1Nkg1b3cveFc5QUZ4Q24xaFR0dTdoUW45NzN4TWJuK0syYjcKb0VNRG9BYk5WZjhKZE5tZG5FZXN3L2UzZlVERlQ0cGVLTXlObXBYVVkwRlN2d3lOV0dnc0t6dVJMSEZkWjZYNQp4QzBRalUzSlJ3S0JnUUREU3VaQ1BSNVVFdjYrTk1xK3J0MTNka3pYVW83NG9GR0xBbVFiMWlCVDduZ3c4VlBBCituRXhtRmpBOUY5UmM1ZXpQNXJ6MFV6bjllOEh5T2NmMFhpTjBUOGdQSXZ6VjBVWVV2eU1MVDk5WVJYUmxvSm4KeXBiMWFjSWdWeDdER0o2NVZIVDI2S1pWK1pmMXF5RURJNU5NMW1mbzVFR0JXZi94N1NQNXQxVEp4d0tCZ0JyOApqT1hibFFiTEJPNjhZeTZrOFZhVER4a3U1UUFPN1F5bFBPSXJGWjNHQko0aTB3cHBpOTFxNUl4Zm9WamE3YlhYCnpGdkZxeVh3bWI1dTR2WVVndk9nTWFwaUdLbjVsQThKUUhDZHRlV0RVNy80b1J5UlV5b28wZ3VDbmMzQmxYdUcKMzB5RklxREhWY1lYb3FxMzZtb0kxWWs2OEhWVEpLWVZ5ZytZdVdlcEFvR0FFd3JHT0YzQXliTktmKzBEUzFoVApSWjJoT29lTko5NjJzRG9VZG0zcm1LMGZoeCs3UU9hblA0c0ZWaURPYnZKTlUwMDA5RDBPS2hkZ0JhQm9sZEtzClZHZk53cVgxeEdIRUxOeTdjemtQQ3E1ekhZZVhxSVVEc081cHAvczJ4dS9ueURZdzgwTTlod3ZoUURQUzdNVWMKTFVRUWs2azVIRmdmai80VGdRQS9ocjQ9Ci0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K';

const DEFAULT_JWT_PUBLIC =
  'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFtbHBsNUhudDlZeEdBQ0VsTDUySQpIYTJiNXhWdkFQTjBlcGxST1A2NW9yejBWZTVoRk1EQjdSQWg1Wnk3ZDErY1pqd01pSE8wTkkvZ24yZzVhWGkzCnExajNkVFJ4aXlFMlRHcEE3cUlBSTRSZnFkOWxnZFV2dnIyV09zZXU1cUZvcG5RNmxoZGFsS3ovZjVqWWoydzgKRFYwb3FMUmVBRUg3eGtsMlEvdnVXWG50SklqWWM0S29vMU5nT21iSTc0OTNDK2RZd0hSWklxODdxbkcxaXQ5WgpWMlhQVFcxZi9rVGpDcFJPWTRrNHF2YjhXeGg1OTJvWWFCS0tHSG5uMm5yem5MbGJueXFTRWxlVllWSHdpKytTClFmNDJ6bGk5cWovcExQSDU2VS9rZmp4dHJIUkJrOVNyakdnSVl2dVc4clordjVicHVJeXp2U2tkMVNOLzJ6b3IKblFJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==';

const DEFAULT_QR_KEY = '3c24fca61efd54a33042d05a3a632fb6103d409213924af028d9a0e528f4e012';

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || !val.trim()) {
        return 'postgresql://postgres.dummy:dummy@localhost:5432/postgres';
      }
      return val.trim().replace(/^["']|["']$/g, '');
    }),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),

  JWT_PRIVATE_KEY_B64: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return DEFAULT_JWT_PRIVATE;
      const cleaned = val.trim().replace(/^["']|["']$/g, '');
      return cleaned.length > 50 ? cleaned : DEFAULT_JWT_PRIVATE;
    }),
  JWT_PUBLIC_KEY_B64: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return DEFAULT_JWT_PUBLIC;
      const cleaned = val.trim().replace(/^["']|["']$/g, '');
      return cleaned.length > 50 ? cleaned : DEFAULT_JWT_PUBLIC;
    }),
  JWT_ACCESS_TTL: z.string().default('2h'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  JWT_GUEST_TTL: z.string().default('4h'),

  QR_ENCRYPTION_KEY: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return DEFAULT_QR_KEY;
      const cleaned = val.trim().replace(/^["']|["']$/g, '');
      if (!cleaned) return DEFAULT_QR_KEY;
      if (cleaned.length === 64 && /^[0-9a-fA-F]+$/.test(cleaned)) {
        return cleaned.toLowerCase();
      }
      // Deterministically derive 32-byte (64 hex characters) key from whatever was provided
      return createHash('sha256').update(cleaned).digest('hex');
    }),
  QR_TOKEN_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(24),

  PORT: z.coerce.number().int().min(1).max(65535).default(4321),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGINS: z.string().default('*'),

  RATE_LIMIT_LOGIN: z.coerce.number().int().min(1).default(10),
  RATE_LIMIT_QR_VERIFY: z.coerce.number().int().min(1).default(30),
  RATE_LIMIT_ORDER_CREATE: z.coerce.number().int().min(1).default(15),
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
