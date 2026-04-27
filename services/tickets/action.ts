import { createTicketCommentInputSchema, createTicketCommentResponseSchema, createTicketInputSchema, createTicketResponseSchema, takeTicketResponseSchema, ticketCommentsResponseSchema, updateTicketStatusInputSchema, updateTicketStatusResponseSchema, ticketsResponseSchema, type CreateTicketCommentInput, type CreateTicketCommentResponse, type CreateTicketInput, type CreateTicketResponse, type TakeTicketResponse, type TicketCommentsResponse, type TicketsResponse, type UpdateTicketStatusInput, type UpdateTicketStatusResponse } from "./schemas";

const BASE_URL = "https://unilag-mfb-support-backend.onrender.com";

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

export async function getTicketsAction({
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
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[endpoint] GET /tickets", params ?? null);
  }
  const url = new URL(`${BASE_URL}/tickets`);
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

  return createTicketCommentResponseSchema.parse(raw);
}

export async function createTicketAction({
  token,
  input,
}: {
  token: string;
  input: CreateTicketInput;
}): Promise<CreateTicketResponse> {
  const payload = createTicketInputSchema.parse(input);
  const res = await fetch(`${BASE_URL}/tickets`, {
    method: "POST",
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
