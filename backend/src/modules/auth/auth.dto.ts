// backend/src/modules/auth/auth.dto.ts
import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email().max(255).transform((val) => val.toLowerCase()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/\d/, 'Password must contain a number')
    .regex(/[@$!%*?&]/, 'Password must contain a special character (@$!%*?&)'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  workspaceName: z.string().min(2, 'Workspace name must be at least 2 characters').max(100).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email().max(255).transform((val) => val.toLowerCase()),
  password: z.string().min(1).max(128),
});

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type RefreshDto = z.infer<typeof RefreshSchema>;
