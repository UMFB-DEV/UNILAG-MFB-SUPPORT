import { z } from "zod";

export const ticketsPerAgentSchema = z.object({
  agentId: z.string(),
  agentEmail: z.string().email(),
  ticketCount: z.number(),
  averageAssignedToResolvedMinutes: z.number().nullable().optional(),
});

export const reportsSummarySchema = z.object({
  totalTickets: z.number(),
  openTickets: z.number(),
  inProgressTickets: z.number(),
  resolvedTickets: z.number(),
  closedTickets: z.number(),
  averageResolutionMinutes: z.number().nullable().optional(),
  averageAssignedToResolvedMinutes: z.number().nullable().optional(),
  ticketsPerAgent: z.array(ticketsPerAgentSchema).optional(),
});

export type ReportsSummary = z.infer<typeof reportsSummarySchema>;

export const reportsSummaryResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: reportsSummarySchema.optional(),
});

export type ReportsSummaryResponse = z.infer<typeof reportsSummaryResponseSchema>;
