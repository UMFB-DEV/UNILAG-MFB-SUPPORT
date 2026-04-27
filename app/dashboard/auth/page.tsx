"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { AuthTabs } from "../../helpdesk/components/auth-tabs";

import { useLoginMutation, useRegisterAgentMutation, useRegisterMutation } from "@/services/auth/hooks";
import { useAuthStore } from "@/stores/authStore";

export default function DashboardAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);

  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const registerAgentMutation = useRegisterAgentMutation();

  const nextPath = useMemo(() => searchParams.get("next") || "/dashboard", [searchParams]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [pendingPostSignupRedirect, setPendingPostSignupRedirect] = useState(false);

  useEffect(() => {
    if (token && !pendingPostSignupRedirect) router.replace(nextPath);
  }, [token, pendingPostSignupRedirect, nextPath, router]);

  const queryError = searchParams.get("error") === "invalid";

  function getUiErrorMessage(err: unknown): string {
    if (err && typeof err === "object") {
      const maybe = err as { status?: unknown; message?: unknown };
      const status = typeof maybe.status === "number" ? maybe.status : null;
      const message = typeof maybe.message === "string" ? maybe.message : null;
      if (status && status >= 500) return "Something went wrong. Please try again.";
      if (message) return message;
    }
    return "Something went wrong. Please try again.";
  }

  if (token && !pendingPostSignupRedirect) return null;

  return (
    <AuthTabs
      error={queryError ? "Invalid details. Please try again." : localError}
      onSuccessContinue={() => {
        if (pendingPostSignupRedirect) {
          setPendingPostSignupRedirect(false);
          router.replace(nextPath);
        }
      }}
      onSubmit={async (data) => {
        setLocalError(null);
        setPendingPostSignupRedirect(false);
        try {
          if (data.intent === "login") {
            const res = await loginMutation.mutateAsync({
              email: data.email,
              password: data.password,
            });
            if (!res.data) throw new Error("Missing auth data");
            setAuth({ token: res.data.token, user: res.data.user });
            router.replace(nextPath);
            return;
          }

          const res =
            data.role === "agent"
              ? await registerAgentMutation.mutateAsync({
                  name: data.name ?? "",
                  email: data.email,
                  password: data.password,
                  department: data.department ?? "",
                })
              : await registerMutation.mutateAsync({
                  name: data.name ?? "",
                  email: data.email,
                  password: data.password,
                });
          if (!res.data) throw new Error("Missing auth data");
          setAuth({ token: res.data.token, user: res.data.user });
          setPendingPostSignupRedirect(true);
        } catch (e) {
          setLocalError(getUiErrorMessage(e));
          throw e;
        }
      }}
    />
  );
}
