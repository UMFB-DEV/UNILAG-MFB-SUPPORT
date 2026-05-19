"use client";

import { useEffect, useMemo, useState } from "react";

import type { Role } from "@/lib/helpdesk/demoData";
import { useDepartmentsQuery } from "@/services/departments/hooks";
import { useForgotPasswordMutation } from "@/services/auth/hooks";

import { AuthCard } from "./auth-card";

export function AuthTabs({
  initialRole,
  onSubmit,
  error,
  onSuccessContinue,
}: {
  initialRole?: Exclude<Role, "admin">;
  onSubmit: (data: {
    intent: "login" | "signup";
    role: Exclude<Role, "admin">;
    name?: string;
    department?: string;
    email: string;
    password: string;
  }) => void | Promise<void>;
  error: string | null;
  onSuccessContinue?: () => void;
}) {
  const [role, setRole] = useState<Exclude<Role, "admin">>(
    initialRole ?? "user",
  );
  const [intent, setIntent] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const forgotPasswordMutation = useForgotPasswordMutation();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<
    string | null
  >(null);

  const departmentsQuery = useDepartmentsQuery({
    enabled: intent === "signup" && role === "agent",
  });

  useEffect(() => {
    if (initialRole) setRole(initialRole);
  }, [initialRole]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        intent,
        role,
        name: intent === "signup" ? name : undefined,
        department:
          intent === "signup" && role === "agent" ? department : undefined,
        email,
        password,
      });

      if (intent === "signup") {
        setShowSuccess(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const roleLabel = useMemo(
    () => (role === "agent" ? "Support Agent" : "User"),
    [role],
  );

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
        <div className="w-full max-w-md rounded-xl border border-[#1F1F21] bg-[#111111] p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#ACD23C]/20">
              <svg
                className="h-6 w-6 text-[#ACD23C]"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-zinc-100">
              Account Created
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              You're all set! Your account is ready.
            </p>
          </div>
          <button
            className="w-full rounded-lg bg-[#7b3434] px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white hover:brightness-110"
            onClick={() => {
              setShowSuccess(false);
              onSuccessContinue?.();
            }}
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

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
          Secure Support Access
        </p>
      </div>

      <div className="mx-auto flex max-w-md justify-center">
        <AuthCard
          title={intent === "login" ? "Sign In" : "Create Account"}
          subtitle={`${roleLabel} • ${intent === "login" ? "Enter credentials" : "Request access"}`}
        >
          <div className="mb-5 flex rounded-lg border border-[#1F1F21] bg-[#0B0B0C] p-1">
            <button
              type="button"
              onClick={() => setRole("user")}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] ${
                role === "user"
                  ? "bg-[#1A1A1A] text-[#ACD23C]"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              User
            </button>
            <button
              type="button"
              onClick={() => setRole("agent")}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] ${
                role === "agent"
                  ? "bg-[#1A1A1A] text-[#ACD23C]"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Agent
            </button>
          </div>

          <div className="mb-5 flex rounded-lg border border-[#1F1F21] bg-[#0B0B0C] p-1">
            <button
              type="button"
              onClick={() => setIntent("login")}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] ${
                intent === "login"
                  ? "bg-[#7b3434] text-white shadow-lg"
                  : "text-zinc-500 hover:bg-[#1A1A1A] hover:text-zinc-300"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIntent("signup")}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] ${
                intent === "signup"
                  ? "bg-[#7b3434] text-white shadow-lg"
                  : "text-zinc-500 hover:bg-[#1A1A1A] hover:text-zinc-300"
              }`}
            >
              Sign up
            </button>
          </div>

          {error ? (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          {!showSuccess && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {intent === "signup" ? (
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-zinc-500">
                    Full name
                  </label>
                  <input
                    required
                    minLength={2}
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-[#2A2A2C] bg-[#0B0B0C] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#7b3434]"
                  />
                </div>
              ) : null}

              {intent === "signup" && role === "agent" ? (
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-zinc-500">
                    Department
                  </label>
                  <select
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={
                      departmentsQuery.isLoading || departmentsQuery.isError
                    }
                    className="w-full rounded-lg border border-[#2A2A2C] bg-[#0B0B0C] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#7b3434] disabled:opacity-60"
                  >
                    <option value="" disabled>
                      {departmentsQuery.isLoading
                        ? "Loading departments..."
                        : departmentsQuery.isError
                          ? "Unable to load departments"
                          : "Select a department"}
                    </option>
                    {(departmentsQuery.data?.data ?? []).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-zinc-500">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2A2C] bg-[#0B0B0C] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#7b3434]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-zinc-500">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2A2C] bg-[#0B0B0C] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#7b3434]"
                />
              </div>

              {intent === "login" ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#ACD23C] hover:brightness-110"
                    onClick={() => {
                      setForgotError(null);
                      setForgotSuccessMessage(null);
                      setForgotEmail(email);
                      setShowForgotPassword(true);
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              ) : null}

              <button
                className="w-full rounded-lg bg-[#7b3434] px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? intent === "login"
                    ? "Signing in..."
                    : "Creating account..."
                  : intent === "login"
                    ? "Sign In"
                    : "Create Account"}
              </button>
            </form>
          )}
        </AuthCard>
      </div>

      {showForgotPassword ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-md rounded-xl border border-[#1F1F21] bg-[#111111] p-8 shadow-2xl">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#ACD23C]/20">
                <svg
                  className="h-6 w-6 text-[#ACD23C]"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 2a10 10 0 0 0-10 10v5a3 3 0 0 0 3 3h1" />
                  <path d="M18 19h1a3 3 0 0 0 3-3v-5a10 10 0 0 0-10-10" />
                  <path d="M8 21h8" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-zinc-100">
                Reset your password
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Enter your email and we’ll send a reset link if an account
                exists.
              </p>
            </div>

            {forgotError ? (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2 text-sm text-red-300">
                {forgotError}
              </div>
            ) : null}

            {forgotSuccessMessage ? (
              <div className="mb-4 rounded-lg border border-[#ACD23C]/30 bg-[#ACD23C]/10 px-3 py-2 text-sm text-[#ACD23C]">
                {forgotSuccessMessage}
              </div>
            ) : null}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setForgotError(null);
                setForgotSuccessMessage(null);
                const v = forgotEmail.trim();
                if (!v) return;
                try {
                  const res = await forgotPasswordMutation.mutateAsync({
                    email: v,
                  });
                  setForgotSuccessMessage(
                    res.message ||
                      "If an account exists for that email, a reset link has been sent.",
                  );
                } catch (err) {
                  if (err && typeof err === "object") {
                    const maybe = err as {
                      status?: unknown;
                      message?: unknown;
                    };
                    const status =
                      typeof maybe.status === "number" ? maybe.status : null;
                    const message =
                      typeof maybe.message === "string" ? maybe.message : null;
                    setForgotError(
                      status && status >= 500
                        ? "Something went wrong. Please try again."
                        : (message ??
                            "Something went wrong. Please try again."),
                    );
                    return;
                  }
                  setForgotError("Something went wrong. Please try again.");
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-zinc-500">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-lg border border-[#2A2A2C] bg-[#0B0B0C] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#7b3434]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1 rounded-lg border border-[#2A2A2C] px-4 py-2 text-sm font-semibold text-zinc-400 hover:bg-[#1A1A1A] hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotPasswordMutation.isPending}
                  className="flex-1 rounded-lg bg-[#7b3434] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {forgotPasswordMutation.isPending
                    ? "Sending..."
                    : "Send Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
