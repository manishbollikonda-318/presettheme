import { z } from 'zod';

export const orderItemInputSchema = z.object({
  menu_item_id: z.string().min(1).max(100),
  quantity: z.number().int().min(1).max(99),
  extras: z.array(z.string().trim().max(100)).max(10).optional().default([]),
  notes: z.string().trim().max(300).optional().default(''),
});

export const createOrderSchema = z.object({
  order_type: z.enum(['dine_in', 'takeaway', 'delivery']).default('dine_in'),
  customer_name: z.string().trim().max(100).optional().default(''),
  customer_phone: z
    .string({ required_error: 'Customer phone number is mandatory for fraud prevention' })
    .trim()
    .min(10, { message: 'Customer phone number must contain at least 10 digits' })
    .max(20, { message: 'Customer phone number is too long' })
    .regex(/^[+]?[0-9\s\-()]{10,20}$/, { message: 'Invalid phone number format' }),
  table_id: z.string().uuid().optional(),
  table_number: z.string().trim().max(20).optional(),
  tableNumber: z.string().trim().max(20).optional(),
  outlet_id: z.string().uuid().optional(),
  promo_code: z.string().trim().max(30).optional(),
  notes: z.string().trim().max(500).optional().default(''),
  items: z.array(orderItemInputSchema).min(1, 'Order must contain at least one item').max(50),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['cooking', 'ready', 'completed', 'cancelled']),
  reason: z.string().trim().max(300).optional(),
});

export const orderFilterQuerySchema = z.object({
  status: z.enum(['new', 'cooking', 'ready', 'completed', 'cancelled']).optional(),
  table_id: z.string().uuid().optional(),
  outlet_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderFilterQuery = z.infer<typeof orderFilterQuerySchema>;
