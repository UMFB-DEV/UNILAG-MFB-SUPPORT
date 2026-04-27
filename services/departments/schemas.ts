import { z } from "zod";

export const departmentsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.string()),
});

export type DepartmentsResponse = z.infer<typeof departmentsResponseSchema>;
