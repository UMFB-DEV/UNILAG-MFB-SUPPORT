"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import {
  forgotPasswordAction,
  loginAction,
  meAction,
  registerAction,
  registerAgentAction,
  resetPasswordAction,
  updateProfileAction,
} from "./action";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterAgentInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from "./schemas";

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (input: RegisterInput) => registerAction(input),
  });
}

export function useRegisterAgentMutation() {
  return useMutation({
    mutationFn: (input: RegisterAgentInput) => registerAgentAction(input),
  });
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: (input: LoginInput) => loginAction(input),
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) => forgotPasswordAction(input),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) => resetPasswordAction(input),
  });
}

export function useUpdateProfileMutation({ token }: { token: string | null }) {
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => {
      if (!token) throw new Error("Missing token");
      return updateProfileAction({ token, input });
    },
  });
}

export function useMeQuery({
  token,
  enabled,
}: {
  token: string | null;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: ["auth", "me", token],
    queryFn: async () => {
      if (!token) throw new Error("Missing token");
      return meAction(token);
    },
    enabled: enabled && Boolean(token),
    retry: false,
  });
}
