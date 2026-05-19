import { assignTicketInputSchema, assignTicketResponseSchema, createTicketCommentInputSchema, createTicketCommentResponseSchema, createTicketInputSchema, createTicketResponseSchema, takeTicketResponseSchema, ticketCommentsResponseSchema, updateTicketStatusInputSchema, updateTicketStatusResponseSchema, ticketsResponseSchema, type AssignTicketInput, type AssignTicketResponse, type CreateTicketCommentInput, type CreateTicketCommentResponse, type CreateTicketInput, type CreateTicketResponse, type TakeTicketResponse, type TicketCommentsResponse, type TicketsResponse, type UpdateTicketStatusInput, type UpdateTicketStatusResponse } from "./schemas";

import { BASE_URL } from "../base-url";

type ApiError = {
  status: number;
  message: string;
};

class ApiRequestError extends Error {
  status: number;
  raw: unknown;

  constructor({ status, message, raw }: { status: number; message: string; raw: unknown }) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.raw = raw;
  }
}

async function parseJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function deleteTicketAction({ token, ticketId }: { token: string; ticketId: string }): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[endpoint] DELETE /tickets/:id", { ticketId });
  }

  const res = await fetch(`${BASE_URL}/tickets/${encodeURIComponent(ticketId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 204) return;

  const raw = await parseJsonSafe(res);
  if (!res.ok) {
    const msg =
      raw &&
      typeof raw === "object" &&
      "message" in raw &&
      typeof raw.message === "string"
        ? raw.message
        : `Request failed (${res.status})`;
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[endpoint] DELETE /tickets/:id error", { status: res.status, message: msg, raw });
    }
    throw new ApiRequestError({ status: res.status, message: msg, raw });
  }
}

export async function getTicketsAction({
  token,
  params,
}: {
  token: string;
  params?: {
    status?: string;
    priority?: string;
    createdBy?: string;
    assignedTo?: string;
    page?: number;
    limit?: number;
    keyword?: string;
  };
}): Promise<TicketsResponse> {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[endpoint] GET /tickets", params ?? null);
  }
  const url = new URL(`${BASE_URL}/tickets`);
  if (params) {
    if (params.status) url.searchParams.set("status", params.status);
    if (params.priority) url.searchParams.set("priority", params.priority);
    if (params.createdBy) url.searchParams.set("createdBy", params.createdBy);
    if (params.assignedTo) url.searchParams.set("assignedTo", params.assignedTo);
    if (params.keyword) url.searchParams.set("keyword", params.keyword);
    if (params.page) url.searchParams.set("page", String(params.page));
    if (params.limit) url.searchParams.set("limit", String(params.limit));
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const raw = await parseJsonSafe(res);

  if (!res.ok) {
    const msg =
      raw &&
      typeof raw === "object" &&
      "message" in raw &&
      typeof raw.message === "string"
        ? raw.message
        : `Request failed (${res.status})`;
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[endpoint] GET /tickets error", { status: res.status, message: msg, raw });
    }
    throw new ApiRequestError({ status: res.status, message: msg, raw });
  }

  const parsed = ticketsResponseSchema.parse(raw);
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[tickets] GET /tickets response", parsed);
  }
  return parsed;
}

export async function takeTicketAction({
  token,
  ticketId,
}: {
  token: string;
  ticketId: string;
}): Promise<TakeTicketResponse> {
  const res = await fetch(`${BASE_URL}/tickets/${encodeURIComponent(ticketId)}/take`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const raw = await parseJsonSafe(res);

  if (!res.ok) {
    const msg =
      raw &&
      typeof raw === "object" &&
      "message" in raw &&
      typeof raw.message === "string"
        ? raw.message
        : `Request failed (${res.status})`;
    throw new ApiRequestError({ status: res.status, message: msg, raw });
  }

  return takeTicketResponseSchema.parse(raw);
}

export async function updateTicketStatusAction({
  token,
  ticketId,
  input,
}: {
  token: string;
  ticketId: string;
  input: UpdateTicketStatusInput;
}): Promise<UpdateTicketStatusResponse> {
  const payload = updateTicketStatusInputSchema.parse(input);
  const res = await fetch(`${BASE_URL}/tickets/${encodeURIComponent(ticketId)}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const raw = await parseJsonSafe(res);

  if (!res.ok) {
    const msg =
      raw &&
      typeof raw === "object" &&
      "message" in raw &&
      typeof raw.message === "string"
        ? raw.message
        : `Request failed (${res.status})`;
    throw new ApiRequestError({ status: res.status, message: msg, raw });
  }

  return updateTicketStatusResponseSchema.parse(raw);
}

export async function assignTicketAction({
  token,
  ticketId,
  input,
}: {
  token: string;
  ticketId: string;
  input: AssignTicketInput;
}): Promise<AssignTicketResponse> {
  const payload = assignTicketInputSchema.parse(input);
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[endpoint] PATCH /tickets/:id/assign", { ticketId, payload });
  }

  const res = await fetch(`${BASE_URL}/tickets/${encodeURIComponent(ticketId)}/assign`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 204) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[endpoint] PATCH /tickets/:id/assign response", {
        status: res.status,
        contentType: res.headers.get("content-type"),
        body: "<no content>",
      });
    }
    return { success: true };
  }

  const resClone = res.clone();
  const raw = await parseJsonSafe(res);
  let rawText: string | null = null;
  if (!raw) {
    try {
      rawText = await resClone.text();
    } catch {
      rawText = null;
    }
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[endpoint] PATCH /tickets/:id/assign response", {
      status: res.status,
      contentType: res.headers.get("content-type"),
      raw,
      rawText,
    });
  }

  if (!res.ok) {
    const msg =
      raw &&
      typeof raw === "object" &&
      "message" in raw &&
      typeof raw.message === "string"
        ? raw.message
        : `Request failed (${res.status})`;
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[endpoint] PATCH /tickets/:id/assign error", { status: res.status, message: msg, raw });
    }
    throw new ApiRequestError({ status: res.status, message: msg, raw });
  }

  if (!raw) {
    return { success: true };
  }

  const parsed = assignTicketResponseSchema.safeParse(raw);
  if (!parsed.success) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[endpoint] PATCH /tickets/:id/assign parse error", { raw, error: parsed.error });
    }
    return { success: true };
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[tickets] PATCH /tickets/:id/assign response", parsed.data);
  }
  return parsed.data;
}

export async function getTicketCommentsAction({
  token,
  ticketId,
}: {
  token: string;
  ticketId: string;
}): Promise<TicketCommentsResponse> {
  const res = await fetch(`${BASE_URL}/tickets/${encodeURIComponent(ticketId)}/comments`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const raw = await parseJsonSafe(res);

  if (!res.ok) {
    const msg =
      raw &&
      typeof raw === "object" &&
      "message" in raw &&
      typeof raw.message === "string"
        ? raw.message
        : `Request failed (${res.status})`;
    throw new ApiRequestError({ status: res.status, message: msg, raw });
  }

  return ticketCommentsResponseSchema.parse(raw);
}

export async function createTicketCommentAction({
  token,
  ticketId,
  input,
}: {
  token: string;
  ticketId: string;
  input: CreateTicketCommentInput;
}): Promise<CreateTicketCommentResponse> {
  const payload = createTicketCommentInputSchema.parse(input);
  const res = await fetch(`${BASE_URL}/tickets/${encodeURIComponent(ticketId)}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      message: payload.message,
      isInternal: payload.isInternal ?? false,
    }),
  });

  if (res.status === 204) {
    return { success: true };
  }

  const raw = await parseJsonSafe(res);

  if (!res.ok) {
    const msg =
      raw &&
      typeof raw === "object" &&
      "message" in raw &&
      typeof raw.message === "string"
        ? raw.message
        : `Request failed (${res.status})`;
    throw new ApiRequestError({ status: res.status, message: msg, raw });
  }

  if (!raw) {
    return { success: true };
  }

  const parsed = createTicketCommentResponseSchema.safeParse(raw);
  if (!parsed.success) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[endpoint] POST /tickets/:id/comments parse error", { raw, error: parsed.error });
    }
    return { success: true };
  }

  return parsed.data;
}

export async function createTicketAction({
  token,
  input,
}: {
  token: string;
  input: CreateTicketInput;
}): Promise<CreateTicketResponse> {
  const payload = createTicketInputSchema.parse(input);

  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("category", payload.category);
  if (payload.priority) {
    formData.append("priority", payload.priority);
  }
  if (payload.image) {
    formData.append("image", payload.image);
  }

  const res = await fetch(`${BASE_URL}/tickets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const raw = await parseJsonSafe(res);

  if (!res.ok) {
    const msg =
      raw &&
      typeof raw === "object" &&
      "message" in raw &&
      typeof raw.message === "string"
        ? raw.message
        : `Request failed (${res.status})`;
    throw new ApiRequestError({ status: res.status, message: msg, raw });
  }

  return createTicketResponseSchema.parse(raw);
}

export async function getDepartmentTicketsAction({
  token,
  params,
}: {
  token: string;
  params?: {
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
    keyword?: string;
  };
}): Promise<TicketsResponse> {
  const url = new URL(`${BASE_URL}/tickets/department`);
  if (params) {
    if (params.status) url.searchParams.set("status", params.status);
    if (params.priority) url.searchParams.set("priority", params.priority);
    if (params.keyword) url.searchParams.set("keyword", params.keyword);
    if (params.page) url.searchParams.set("page", String(params.page));
    if (params.limit) url.searchParams.set("limit", String(params.limit));
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const raw = await parseJsonSafe(res);

  if (!res.ok) {
    const msg =
      raw &&
      typeof raw === "object" &&
      "message" in raw &&
      typeof raw.message === "string"
        ? raw.message
        : `Request failed (${res.status})`;
    throw new ApiRequestError({ status: res.status, message: msg, raw });
  }

  const parsed = ticketsResponseSchema.parse(raw);
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[tickets] GET /tickets/department response", parsed);
  }
  return parsed;
}
