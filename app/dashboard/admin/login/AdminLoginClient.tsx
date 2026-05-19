"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { AuthCard } from "../../../helpdesk/components/auth-card";

import { useLoginMutation } from "@/services/auth/hooks";
import { useAuthStore } from "@/stores/authStore";

export default function AdminLoginClient({
  nextPath,
  initialError,
}: {
  nextPath: string;
  initialError: string | null;
}) {
  const router = useRouter();

  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);

  const loginMutation = useLoginMutation();
  const [error, setError] = useState<string | null>(initialError);

  function getUiErrorMessage(err: unknown): string {
    if (err && typeof err === "object") {
      const maybe = err as { status?: unknown; message?: unknown };
      const status = typeof maybe.status === "number" ? maybe.status : null;
      const message = typeof maybe.message === "string" ? maybe.message : null;
      if (
        status === 403 &&
        message &&
        message.toLowerCase().includes("deactivated")
      ) {
        return "Account deactivated. Contact admin.";
      }
      if (status && status >= 500)
        return "Something went wrong. Please try again.";
      if (message) return message;
    }
    return "Something went wrong. Please try again.";
  }

  useEffect(() => {
    if (token) router.replace(nextPath);
  }, [token, nextPath, router]);

  if (token) return null;

  return (
    <div className="min-h-screen bg-[#0B0B0C] px-6 py-12">
      <div className="mx-auto mb-10 max-w-md text-center">
        <div className="mb-4 flex flex-col items-center justify-center gap-3">
          <img src="/UMFB-LOGO.png" alt="UMFB Logo" className="h-16 w-auto" />
          <h1 className="text-xl font-bold uppercase tracking-[0.18em] text-[#7b3434]">
             UNILAG MFB TICKETING SYSTEM
           </h1>
        </div>
        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
          Admin Access
        </p>
      </div>

      <div className="mx-auto flex max-w-md justify-center">
        <AuthCard
          title="Admin Sign In"
          subtitle="Restricted access • administrators only"
          footer={
            <p className="text-xs text-zinc-500">
              Need user/agent access? Go to{" "}
              <span className="text-zinc-300">/dashboard</span>.
            </p>
          }
        >
          {error ? (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);

              const fd = new FormData(e.currentTarget);
              const email = String(fd.get("email") ?? "").trim();
              const password = String(fd.get("password") ?? "");

              try {
                const res = await loginMutation.mutateAsync({
                  email,
                  password,
                });
                if (!res.data) throw new Error("Missing auth data");
                if (
                  res.data.user &&
                  (res.data.user as { isActive?: unknown }).isActive === false
                ) {
                  setError("Account deactivated. Contact admin.");
                  return;
                }
                if (res.data.user.role !== "admin")
                  throw new Error("Not admin");
                setAuth({ token: res.data.token, user: res.data.user });
                router.replace(nextPath);
              } catch (err) {
                setError(getUiErrorMessage(err));
              }
            }}
          >
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-zinc-500">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="admin@unilagmfb.com"
                className="w-full rounded-lg border border-[#2A2A2C] bg-[#0B0B0C] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#7b3434]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-zinc-500">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#2A2A2C] bg-[#0B0B0C] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#7b3434]"
              />
            </div>

            <button
              className="w-full rounded-lg bg-[#7b3434] px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              type="submit"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending
                ? "Authenticating..."
                : "Authorize Access"}
            </button>
          </form>
        </AuthCard>
      </div>
    </div>
  );
}
