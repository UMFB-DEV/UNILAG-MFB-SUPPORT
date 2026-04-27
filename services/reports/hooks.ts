"use client";

import { useQuery } from "@tanstack/react-query";

import { getReportsSummaryAction } from "./action";

export function useReportsSummaryQuery({
  token,
  enabled,
}: {
  token: string | null;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: ["reports", "summary", token],
    queryFn: async () => {
      if (!token) throw new Error("Missing token");
      return getReportsSummaryAction({ token });
    },
    enabled: enabled && Boolean(token),
    retry: false,
  });
}
