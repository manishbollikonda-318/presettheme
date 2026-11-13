import { z } from 'zod';

export const generateQRSchema = z.object({
  table_id: z.string().uuid({ message: 'A valid table_id UUID is strictly required to bind a QR code' }),
  ttl_hours: z.number().int().min(1).max(720).optional().default(24),
});

export const revokeQRSchema = z.object({
  reason: z.string().max(300).optional(),
});

export type GenerateQRInput = z.infer<typeof generateQRSchema>;
export type RevokeQRInput = z.infer<typeof revokeQRSchema>;

