import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email().max(255).toLowerCase().trim(),
  password: z.string().min(6).max(128),
});

export const refreshSchema = z.object({
  refresh_token: z.string().min(1).max(4096),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
