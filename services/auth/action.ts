import {
  authResponseSchema,
  forgotPasswordInputSchema,
  loginInputSchema,
  meResponseSchema,
  passwordResetResponseSchema,
  registerAgentInputSchema,
  registerInputSchema,
  resetPasswordInputSchema,
  updateProfileInputSchema,
  updateProfileResponseSchema,
  type AuthResponse,
  type ForgotPasswordInput,
  type LoginInput,
  type MeResponse,
  type PasswordResetResponse,
  type RegisterAgentInput,
  type RegisterInput,
  type ResetPasswordInput,
  type UpdateProfileInput,
  type UpdateProfileResponse,
} from "./schemas";

const BASE_URL = "https://unilag-mfb-support-backend.onrender.com";

const DEBUG_AUTH = process.env.NODE_ENV !== "production";

type ApiError = {
  status: number;
  message: string;
};

async function parseJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function updateProfileAction({
  token,
  input,
}: {
  token: string;
  input: UpdateProfileInput;
}): Promise<UpdateProfileResponse> {
  const payload = updateProfileInputSchema.parse(input);
  const raw = await requestJson<unknown>({ path: "/auth/profile", method: "PATCH", body: payload, token });
  try {
    return updateProfileResponseSchema.parse(raw);
  } catch (e) {
    if (DEBUG_AUTH) {
      // eslint-disable-next-line no-console
      console.error("[auth] update-profile parse error", e);
    }
    throw e;
  }
}

export async function forgotPasswordAction(input: ForgotPasswordInput): Promise<PasswordResetResponse> {
  const payload = forgotPasswordInputSchema.parse(input);
  const raw = await requestJson<unknown>({ path: "/auth/forgot-password", method: "POST", body: payload });
  try {
    return passwordResetResponseSchema.parse(raw);
  } catch (e) {
    if (DEBUG_AUTH) {
      // eslint-disable-next-line no-console
      console.error("[auth] forgot-password parse error", e);
    }
    throw e;
  }
}

export async function resetPasswordAction(input: ResetPasswordInput): Promise<PasswordResetResponse> {
  const payload = resetPasswordInputSchema.parse(input);
  const raw = await requestJson<unknown>({ path: "/auth/reset-password", method: "POST", body: payload });
  try {
    return passwordResetResponseSchema.parse(raw);
  } catch (e) {
    if (DEBUG_AUTH) {
      // eslint-disable-next-line no-console
      console.error("[auth] reset-password parse error", e);
    }
    throw e;
  }
}

export async function registerAgentAction(input: RegisterAgentInput): Promise<AuthResponse> {
  const payload = registerAgentInputSchema.parse(input);
  const raw = await requestJson<unknown>({ path: "/auth/register-agent", method: "POST", body: payload });
  try {
    return authResponseSchema.parse(raw);
  } catch (e) {
    if (DEBUG_AUTH) {
      // eslint-disable-next-line no-console
      console.error("[auth] register-agent parse error", e);
    }
    throw e;
  }
}

async function requestJson<T>({
  path,
  method,
  body,
  token,
}: {
  path: string;
  method: "GET" | "POST" | "PATCH";
  body?: unknown;
  token?: string | null;
}): Promise<T> {
  if (DEBUG_AUTH) {
    // eslint-disable-next-line no-console
    console.log("[auth] request", { path, method, hasBody: Boolean(body), hasToken: Boolean(token) });
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const raw = await parseJsonSafe(res);

  if (DEBUG_AUTH) {
    // eslint-disable-next-line no-console
    console.log("[auth] response", {
      path,
      status: res.status,
      ok: res.ok,
      body: raw,
    });
  }

  if (!res.ok) {
    const msg = (raw && typeof raw === "object" && "message" in raw && typeof raw.message === "string")
      ? raw.message
      : `Request failed (${res.status})`;
    const err: ApiError = { status: res.status, message: msg };
    throw err;
  }

  return raw as T;
}

export async function registerAction(input: RegisterInput): Promise<AuthResponse> {
  const payload = registerInputSchema.parse(input);
  const raw = await requestJson<unknown>({ path: "/auth/register", method: "POST", body: payload });
  try {
    return authResponseSchema.parse(raw);
  } catch (e) {
    if (DEBUG_AUTH) {
      // eslint-disable-next-line no-console
      console.error("[auth] register parse error", e);
    }
    throw e;
  }
}

export async function loginAction(input: LoginInput): Promise<AuthResponse> {
  const payload = loginInputSchema.parse(input);
  const raw = await requestJson<unknown>({ path: "/auth/login", method: "POST", body: payload });
  try {
    return authResponseSchema.parse(raw);
  } catch (e) {
    if (DEBUG_AUTH) {
      // eslint-disable-next-line no-console
      console.error("[auth] login parse error", e);
    }
    throw e;
  }
}

export async function meAction(token: string): Promise<MeResponse> {
  const raw = await requestJson<unknown>({ path: "/auth/me", method: "GET", token });
  try {
    return meResponseSchema.parse(raw);
  } catch (e) {
    if (DEBUG_AUTH) {
      // eslint-disable-next-line no-console
      console.error("[auth] me parse error", e);
    }
    throw e;
  }
}
