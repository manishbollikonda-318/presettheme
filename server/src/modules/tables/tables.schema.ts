import { z } from 'zod';

export const createTableSchema = z.object({
  outlet_id: z.string().uuid(),
  table_number: z.string().trim().min(1).max(10),
  capacity: z.number().int().min(1).max(50).optional().default(4),
  is_active: z.boolean().optional().default(true),
});

export const updateTableSchema = z.object({
  table_number: z.string().trim().min(1).max(10).optional(),
  capacity: z.number().int().min(1).max(50).optional(),
  is_active: z.boolean().optional(),
});

export const closeSessionSchema = z.object({
  reason: z.enum(['completed', 'abandoned']).optional().default('completed'),
});

export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
export type CloseSessionInput = z.infer<typeof closeSessionSchema>;
