import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(60),
  emoji: z.string().max(10).optional(),
  sort_order: z.number().int().min(0).max(32767).optional().default(0),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  is_active: z.boolean().optional(),
});

export const createMenuItemSchema = z.object({
  category_id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  description: z.string().max(1000).optional(),
  price: z.number().min(0).max(999999.99),
  image_url: z.string().url().max(2048).optional(),
  rating: z.number().min(0).max(5).optional().default(0),
  extras: z.array(z.string().trim().max(100)).max(20).optional().default([]),
  is_available: z.boolean().optional().default(true),
  sort_order: z.number().int().min(0).max(32767).optional().default(0),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const toggleStockSchema = z.object({
  is_available: z.boolean(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type ToggleStockInput = z.infer<typeof toggleStockSchema>;
