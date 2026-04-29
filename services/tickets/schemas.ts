import { z } from "zod";

export const ticketUserSchema = z.object({
  id: z.string(),
  name: z.string().optional().nullable(),
  email: z.string().email(),
  role: z.string(),
});

export const apiTicketSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  createdAt: z.string(),
  updatedAt: z.string().optional().nullable(),
  resolvedAt: z.string().optional().nullable(),
  createdBy: ticketUserSchema,
  assignedTo: ticketUserSchema.nullable().optional(),
});

export type ApiTicket = z.infer<typeof apiTicketSchema>;

export const createTicketInputSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  category: z.string().min(2),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketInputSchema>;

export const createTicketResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: apiTicketSchema.optional(),
});

export type CreateTicketResponse = z.infer<typeof createTicketResponseSchema>;

export const takeTicketResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z
    .object({
      id: z.string(),
      title: z.string().optional(),
      status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
      assignedToId: z.string().optional().nullable(),
      assignedTo: ticketUserSchema.optional().nullable(),
    })
    .optional(),
});

export type TakeTicketResponse = z.infer<typeof takeTicketResponseSchema>;

export const updateTicketStatusInputSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
});

export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusInputSchema>;

export const updateTicketStatusResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: apiTicketSchema.optional(),
});

export type UpdateTicketStatusResponse = z.infer<typeof updateTicketStatusResponseSchema>;

export const assignTicketInputSchema = z.object({
  assignedToId: z.string(),
});

export type AssignTicketInput = z.infer<typeof assignTicketInputSchema>;

export const assignTicketResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z
    .object({
      id: z.string(),
      assignedToId: z.string().optional().nullable(),
      assignedTo: ticketUserSchema.optional().nullable(),
    })
    .optional(),
});

export type AssignTicketResponse = z.infer<typeof assignTicketResponseSchema>;

export const ticketCommentSchema = z.object({
  id: z.string(),
  message: z.string(),
  isInternal: z.boolean(),
  createdAt: z.string(),
  user: ticketUserSchema,
});

export type TicketComment = z.infer<typeof ticketCommentSchema>;

export const ticketCommentsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(ticketCommentSchema),
});

export type TicketCommentsResponse = z.infer<typeof ticketCommentsResponseSchema>;

export const createTicketCommentInputSchema = z.object({
  message: z.string().min(3),
  isInternal: z.boolean().optional(),
});

export type CreateTicketCommentInput = z.infer<typeof createTicketCommentInputSchema>;

export const createTicketCommentResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: ticketCommentSchema.optional(),
});

export type CreateTicketCommentResponse = z.infer<typeof createTicketCommentResponseSchema>;

export const ticketsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(apiTicketSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    })
    .optional(),
});

export type TicketsResponse = z.infer<typeof ticketsResponseSchema>;
