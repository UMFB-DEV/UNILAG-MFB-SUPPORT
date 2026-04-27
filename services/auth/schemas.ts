import { z } from "zod";

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional().nullable(),
  role: z.string(),
  department: z.string().optional().nullable(),
});

export type AuthUser = z.infer<typeof authUserSchema>;

export const registerInputSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  department: z.string().min(2).optional(),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

export const registerAgentInputSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  department: z.string().min(2),
});

export type RegisterAgentInput = z.infer<typeof registerAgentInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const forgotPasswordInputSchema = z.object({
  email: z.string().email(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;

export const resetPasswordInputSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;

export const passwordResetResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export type PasswordResetResponse = z.infer<typeof passwordResetResponseSchema>;

export const authResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z
    .object({
      user: authUserSchema,
      token: z.string(),
    })
    .optional(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

export const meResponseSchema = z.object({
  success: z.boolean(),
  data: authUserSchema.optional(),
});

export type MeResponse = z.infer<typeof meResponseSchema>;
