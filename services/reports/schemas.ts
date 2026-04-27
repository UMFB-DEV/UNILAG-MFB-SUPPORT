import { z } from "zod";

export const ticketsPerAgentSchema = z.object({
  agentId: z.string().optional(),
  agentEmail: z.string().email(),
  ticketCount: z.number(),
});

export const reportsSummarySchema = z.object({
  totalTickets: z.number(),
  openTickets: z.number(),
  closedTickets: z.number(),
  averageResolutionHours: z.number().nullable().optional(),
  ticketsPerAgent: z.array(ticketsPerAgentSchema).optional(),
});

export type ReportsSummary = z.infer<typeof reportsSummarySchema>;

export const reportsSummaryResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: reportsSummarySchema.optional(),
});

export type ReportsSummaryResponse = z.infer<typeof reportsSummaryResponseSchema>;
