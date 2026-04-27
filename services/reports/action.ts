import { reportsSummaryResponseSchema, type ReportsSummaryResponse } from "./schemas";

const BASE_URL = "https://unilag-mfb-support-backend.onrender.com";

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

export async function getReportsSummaryAction({ token }: { token: string }): Promise<ReportsSummaryResponse> {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[admin endpoint] GET /reports/summary");
  }
  const res = await fetch(`${BASE_URL}/reports/summary`, {
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
    const err: ApiError = { status: res.status, message: msg };
    throw err;
  }

  const parsed = reportsSummaryResponseSchema.parse(raw);
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[admin endpoint] GET /reports/summary response", parsed);
  }
  return parsed;
}
