"use client";

import { useQuery } from "@tanstack/react-query";

import { getDepartmentsAction } from "./action";

export function useDepartmentsQuery({ enabled }: { enabled: boolean }) {
  return useQuery({
    queryKey: ["departments"],
    queryFn: () => getDepartmentsAction(),
    enabled,
    retry: false,
  });
}
