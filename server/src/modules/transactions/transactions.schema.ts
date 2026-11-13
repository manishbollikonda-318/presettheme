import { z } from 'zod';

export const settleTransactionSchema = z.object({
  order_id: z.string().uuid(),
  payment_method: z.enum(['cash', 'card', 'upi', 'wallet', 'comp']),
  amount: z.number().positive().max(999999.99),
  gateway_ref: z.string().trim().max(255).optional(),
});

export const transactionFilterSchema = z.object({
  outlet_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'captured', 'failed', 'refunded']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type SettleTransactionInput = z.infer<typeof settleTransactionSchema>;
export type TransactionFilterInput = z.infer<typeof transactionFilterSchema>;
