"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { AuthTabs } from "../../helpdesk/components/auth-tabs";

import { useLoginMutation, useRegisterAgentMutation, useRegisterMutation } from "@/services/auth/hooks";
import { useAuthStore } from "@/stores/authStore";
import type { Role } from "@/lib/helpdesk/demoData";

export default function DashboardAuthClient({
  nextPath,
  queryError,
  initialRole,
}: {
  nextPath: string;
  queryError: boolean;
  initialRole: Exclude<Role, "admin">;
}) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const apiUser = useAuthStore((s) => s.user);

  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const registerAgentMutation = useRegisterAgentMutation();

  const [localError, setLocalError] = useState<string | null>(null);
  const [pendingPostSignupRedirect, setPendingPostSignupRedirect] = useState(false);

  useEffect(() => {
    if (!token || pendingPostSignupRedirect) return;
    if (apiUser?.role === "admin") {
      router.replace("/dashboard");
      return;
    }
    router.replace(nextPath);
  }, [token, pendingPostSignupRedirect, nextPath, router, apiUser?.role]);

  const displayedError = useMemo(
    () => (queryError ? "Invalid details. Please try again." : localError),
    [queryError, localError],
  );

  function getUiErrorMessage(err: unknown): string {
    if (err && typeof err === "object") {
      const maybe = err as { status?: unknown; message?: unknown };
      const status = typeof maybe.status === "number" ? maybe.status : null;
      const message = typeof maybe.message === "string" ? maybe.message : null;
      if (status === 403 && message && message.toLowerCase().includes("deactivated")) {
        return "Account deactivated. Contact admin.";
      }
      if (status && status >= 500) return "Something went wrong. Please try again.";
      if (message) return message;
    }
    return "Something went wrong. Please try again.";
  }

  if (token && !pendingPostSignupRedirect) return null;

  return (
    <AuthTabs
      initialRole={initialRole}
      error={displayedError}
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
            if (res.data.user && (res.data.user as { isActive?: unknown }).isActive === false) {
              setLocalError("Account deactivated. Contact admin.");
              return;
            }
            setAuth({ token: res.data.token, user: res.data.user });
            router.replace(res.data.user.role === "admin" ? "/dashboard" : nextPath);
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
          if (res.data.user && (res.data.user as { isActive?: unknown }).isActive === false) {
            setLocalError("Account deactivated. Contact admin.");
            return;
          }
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
