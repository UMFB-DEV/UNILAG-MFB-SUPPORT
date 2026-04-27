"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createUserAction, getUsersAction, updateUserDepartmentAction, updateUserRoleAction } from "./action";

export function useUsersQuery({
  token,
  enabled,
}: {
  token: string | null;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: ["users", token],
    queryFn: async () => {
      if (!token) throw new Error("Missing token");
      return getUsersAction({ token });
    },
    enabled: enabled && Boolean(token),
    retry: false,
  });
}

export function useCreateUserMutation({ token }: { token: string | null }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      email,
      password,
      role,
      department,
    }: {
      email: string;
      password: string;
      role: "user" | "agent" | "admin";
      department?: string | null;
    }) => {
      if (!token) throw new Error("Missing token");
      return createUserAction({
        token,
        input: {
          email,
          password,
          role,
          department: department ?? null,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", token] });
    },
  });
}

export function useUpdateUserRoleMutation({ token }: { token: string | null }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "user" | "agent" | "admin" }) => {
      if (!token) throw new Error("Missing token");
      return updateUserRoleAction({ token, userId, input: { role } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", token] });
    },
  });
}

export function useUpdateUserDepartmentMutation({ token }: { token: string | null }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      department,
    }: {
      userId: string;
      department: string | null;
    }) => {
      if (!token) throw new Error("Missing token");
      return updateUserDepartmentAction({ token, userId, input: { department } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", token] });
    },
  });
}
