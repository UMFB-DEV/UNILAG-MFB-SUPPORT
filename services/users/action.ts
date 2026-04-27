import {
  createUserInputSchema,
  createUserResponseSchema,
  updateUserResponseSchema,
  updateUserDepartmentInputSchema,
  updateUserRoleInputSchema,
  usersResponseSchema,
  type CreateUserInput,
  type CreateUserResponse,
  type UpdateUserResponse,
  type UpdateUserDepartmentInput,
  type UpdateUserRoleInput,
  type UsersResponse,
} from "./schemas";

const BASE_URL = "https://unilag-mfb-support-backend.onrender.com";

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

export async function getUsersAction({ token }: { token: string }): Promise<UsersResponse> {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[admin endpoint] GET /users");
  }
  const res = await fetch(`${BASE_URL}/users`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const raw = await parseJsonSafe(res);

  if (!res.ok) {
    const msg =
      raw && typeof raw === "object" && "message" in raw && typeof raw.message === "string"
        ? raw.message
        : `Request failed (${res.status})`;
    throw new ApiRequestError({ status: res.status, message: msg, raw });
  }

  const normalized =
    raw &&
    typeof raw === "object" &&
    "data" in raw &&
    Array.isArray((raw as { data?: unknown }).data)
      ? {
          ...raw,
          data: (raw as { data: unknown[] }).data.map((u) => {
            if (!u || typeof u !== "object") return u;
            const obj = u as { name?: unknown; email?: unknown };
            const email = typeof obj.email === "string" ? obj.email : "";
            const fallbackName = email ? email.split("@")[0] : "Unknown";
            const name = typeof obj.name === "string" && obj.name.trim() ? obj.name : fallbackName;
            return { ...obj, name };
          }),
        }
      : raw;

  const parsed = usersResponseSchema.parse(normalized);
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[admin endpoint] GET /users response", parsed);
  }
  return parsed;
}

export async function createUserAction({
  token,
  input,
}: {
  token: string;
  input: CreateUserInput;
}): Promise<CreateUserResponse> {
  const payload = createUserInputSchema.parse(input);

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[admin endpoint] POST /users", { payload: { ...payload, password: "***" } });
  }

  const res = await fetch(`${BASE_URL}/users`, {
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
      raw && typeof raw === "object" && "message" in raw && typeof raw.message === "string"
        ? raw.message
        : `Request failed (${res.status})`;
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[admin endpoint] POST /users error", { status: res.status, message: msg, raw });
    }
    throw new ApiRequestError({ status: res.status, message: msg, raw });
  }

  const normalized =
    raw &&
    typeof raw === "object" &&
    "data" in raw &&
    raw.data &&
    typeof raw.data === "object"
      ? {
          ...raw,
          data: (() => {
            const obj = raw.data as { name?: unknown; email?: unknown };
            const email = typeof obj.email === "string" ? obj.email : "";
            const fallbackName = email ? email.split("@")[0] : "Unknown";
            const name = typeof obj.name === "string" && obj.name.trim() ? obj.name : fallbackName;
            return { ...obj, name };
          })(),
        }
      : raw;

  const parsed = createUserResponseSchema.parse(normalized);
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[admin endpoint] POST /users response", parsed);
  }
  return parsed;
}

export async function updateUserDepartmentAction({
  token,
  userId,
  input,
}: {
  token: string;
  userId: string;
  input: UpdateUserDepartmentInput;
}): Promise<UpdateUserResponse> {
  const payload = updateUserDepartmentInputSchema.parse(input);

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[admin endpoint] PATCH /users/:id (department)", { userId, payload });
  }

  const res = await fetch(`${BASE_URL}/users/${encodeURIComponent(userId)}`, {
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
      raw && typeof raw === "object" && "message" in raw && typeof raw.message === "string"
        ? raw.message
        : `Request failed (${res.status})`;
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[admin endpoint] PATCH /users/:id (department) error", {
        status: res.status,
        message: msg,
        raw,
      });
    }
    throw new ApiRequestError({ status: res.status, message: msg, raw });
  }

  const normalized =
    raw &&
    typeof raw === "object" &&
    "data" in raw &&
    raw.data &&
    typeof raw.data === "object"
      ? {
          ...raw,
          data: (() => {
            const obj = raw.data as { name?: unknown; email?: unknown };
            const email = typeof obj.email === "string" ? obj.email : "";
            const fallbackName = email ? email.split("@")[0] : "Unknown";
            const name = typeof obj.name === "string" && obj.name.trim() ? obj.name : fallbackName;
            return { ...obj, name };
          })(),
        }
      : raw;

  const parsed = updateUserResponseSchema.parse(normalized);
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[admin endpoint] PATCH /users/:id (department) response", parsed);
  }
  return parsed;
}

export async function updateUserRoleAction({
  token,
  userId,
  input,
}: {
  token: string;
  userId: string;
  input: UpdateUserRoleInput;
}): Promise<UpdateUserResponse> {
  const payload = updateUserRoleInputSchema.parse(input);

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[admin endpoint] PATCH /users/:id", { userId, payload });
  }

  const res = await fetch(`${BASE_URL}/users/${encodeURIComponent(userId)}`, {
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
      raw && typeof raw === "object" && "message" in raw && typeof raw.message === "string"
        ? raw.message
        : `Request failed (${res.status})`;
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[admin endpoint] PATCH /users/:id error", { status: res.status, message: msg, raw });
    }
    throw new ApiRequestError({ status: res.status, message: msg, raw });
  }

  const normalized =
    raw &&
    typeof raw === "object" &&
    "data" in raw &&
    raw.data &&
    typeof raw.data === "object"
      ? {
          ...raw,
          data: (() => {
            const obj = raw.data as { name?: unknown; email?: unknown };
            const email = typeof obj.email === "string" ? obj.email : "";
            const fallbackName = email ? email.split("@")[0] : "Unknown";
            const name = typeof obj.name === "string" && obj.name.trim() ? obj.name : fallbackName;
            return { ...obj, name };
          })(),
        }
      : raw;

  const parsed = updateUserResponseSchema.parse(normalized);
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[admin endpoint] PATCH /users/:id response", parsed);
  }
  return parsed;
}
