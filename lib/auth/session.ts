import { cookies } from "next/headers";

import type { Role } from "../helpdesk/demoData";

export const SESSION_COOKIE = "hdp_session";

export type Session = {
  user: {
    id: number;
    email: string;
    name: string;
    role: Role;
  };
  exp: number; // epoch seconds
};

function getSecretBytes() {
  const secret = process.env.AUTH_SECRET;
  // Temporary fallback so local dev can run without .env.local.
  // Replace by setting AUTH_SECRET in production environments.
  const effective = secret || "dev-only-unsafe-secret-change-me";
  return new TextEncoder().encode(effective);
}

function base64urlEncode(buf: ArrayBuffer | Uint8Array) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  const b64 = btoa(s);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64urlDecodeToBytes(s: string) {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const raw = atob(padded);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function hmacSha256(secret: Uint8Array, data: Uint8Array) {
  const toArrayBuffer = (u8: Uint8Array) =>
    u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;

  const key = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", key, toArrayBuffer(data));
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

export async function signSession(session: Session) {
  const payload = new TextEncoder().encode(JSON.stringify(session));
  const secret = getSecretBytes();
  const sig = await hmacSha256(secret, payload);
  return `${base64urlEncode(payload)}.${base64urlEncode(sig)}`;
}

export async function verifySession(token: string): Promise<Session | null> {
  const [p, s] = token.split(".");
  if (!p || !s) return null;
  let payloadBytes: Uint8Array;
  let sigBytes: Uint8Array;
  try {
    payloadBytes = base64urlDecodeToBytes(p);
    sigBytes = base64urlDecodeToBytes(s);
  } catch {
    return null;
  }

  const secret = getSecretBytes();
  const expected = new Uint8Array(await hmacSha256(secret, payloadBytes));
  if (!timingSafeEqualBytes(expected, sigBytes)) return null;

  try {
    const session = JSON.parse(new TextDecoder().decode(payloadBytes)) as Session;
    if (!session?.user?.email || !session?.user?.role || !session?.exp) return null;
    if (session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setSessionCookie(session: Session) {
  const token = await signSession(session);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  (await cookies()).set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

