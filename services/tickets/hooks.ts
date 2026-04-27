"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTicketAction,
  createTicketCommentAction,
  getDepartmentTicketsAction,
  getTicketCommentsAction,
  getTicketsAction,
  takeTicketAction,
  updateTicketStatusAction,
} from "./action";
import type { CreateTicketCommentInput, CreateTicketInput, UpdateTicketStatusInput } from "./schemas";

export function useTicketsQuery({
  token,
  params,
  enabled,
}: {
  token: string | null;
  params?: {
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
    keyword?: string;
  };
  enabled: boolean;
}) {
  return useQuery({
    queryKey: ["tickets", params, token],
    queryFn: async () => {
      if (!token) throw new Error("Missing token");
      return getTicketsAction({ token, params });
    },
    enabled: enabled && Boolean(token),
    retry: false,
  });
}

export function useCreateTicketMutation({
  token,
}: {
  token: string | null;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTicketInput) => {
      if (!token) throw new Error("Missing token");
      return createTicketAction({ token, input });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

export function useDepartmentTicketsQuery({
  token,
  params,
  enabled,
}: {
  token: string | null;
  params?: {
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
    keyword?: string;
  };
  enabled: boolean;
}) {
  return useQuery({
    queryKey: ["tickets", "department", params, token],
    queryFn: async () => {
      if (!token) throw new Error("Missing token");
      return getDepartmentTicketsAction({ token, params });
    },
    enabled: enabled && Boolean(token),
    retry: false,
  });
}

export function useTakeTicketMutation({ token }: { token: string | null }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId }: { ticketId: string }) => {
      if (!token) throw new Error("Missing token");
      return takeTicketAction({ token, ticketId });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

export function useUpdateTicketStatusMutation({ token }: { token: string | null }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, input }: { ticketId: string; input: UpdateTicketStatusInput }) => {
      if (!token) throw new Error("Missing token");
      return updateTicketStatusAction({ token, ticketId, input });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

export function useTicketCommentsQuery({
  token,
  ticketId,
  enabled,
}: {
  token: string | null;
  ticketId: string | null;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: ["tickets", ticketId, "comments", token],
    queryFn: async () => {
      if (!token) throw new Error("Missing token");
      if (!ticketId) throw new Error("Missing ticketId");
      return getTicketCommentsAction({ token, ticketId });
    },
    enabled: enabled && Boolean(token) && Boolean(ticketId),
    retry: false,
  });
}

export function useCreateTicketCommentMutation({ token }: { token: string | null }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ticketId,
      input,
    }: {
      ticketId: string;
      input: CreateTicketCommentInput;
    }) => {
      if (!token) throw new Error("Missing token");
      return createTicketCommentAction({ token, ticketId, input });
    },
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({ queryKey: ["tickets", variables.ticketId, "comments"] });
    },
  });
}
