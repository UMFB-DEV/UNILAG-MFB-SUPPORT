import { z } from "zod";

export const apiUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["user", "agent", "admin"]),
  department: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
});

export type ApiUser = z.infer<typeof apiUserSchema>;

export const usersResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.array(apiUserSchema).optional(),
});

export type UsersResponse = z.infer<typeof usersResponseSchema>;

export const updateUserRoleInputSchema = z.object({
  role: z.enum(["user", "agent", "admin"]),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleInputSchema>;

export const updateUserDepartmentInputSchema = z.object({
  department: z.string().nullable(),
});

export type UpdateUserDepartmentInput = z.infer<typeof updateUserDepartmentInputSchema>;

export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(["user", "agent", "admin"]),
  department: z.string().nullable().optional(),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createUserResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: apiUserSchema.optional(),
});

export type CreateUserResponse = z.infer<typeof createUserResponseSchema>;

export const updateUserResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: apiUserSchema.optional(),
});

export type UpdateUserResponse = z.infer<typeof updateUserResponseSchema>;
