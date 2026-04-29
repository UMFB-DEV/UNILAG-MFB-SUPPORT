import { departmentsResponseSchema, type DepartmentsResponse } from "./schemas";

import { BASE_URL } from "../base-url";

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

export async function getDepartmentsAction(): Promise<DepartmentsResponse> {
  const res = await fetch(`${BASE_URL}/departments`, { method: "GET" });
  const raw = await parseJsonSafe(res);

  if (!res.ok) {
    const msg =
      raw &&
      typeof raw === "object" &&
      "message" in raw &&
      typeof raw.message === "string"
        ? raw.message
        : `Request failed (${res.status})`;
    const err: ApiError = { status: res.status, message: msg };
    throw err;
  }

  return departmentsResponseSchema.parse(raw);
}
