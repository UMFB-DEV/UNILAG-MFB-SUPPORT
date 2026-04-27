"use client";

import { useMemo, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { useResetPasswordMutation } from "@/services/auth/hooks";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const resetPasswordMutation = useResetPasswordMutation();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!token) {
      setError("Missing reset token.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await resetPasswordMutation.mutateAsync({ token, newPassword });
      setSuccessMessage(res.message || "Password reset successful");
    } catch (e) {
      if (e && typeof e === "object") {
        const maybe = e as { status?: unknown; message?: unknown };
        const status = typeof maybe.status === "number" ? maybe.status : null;
        const message = typeof maybe.message === "string" ? maybe.message : null;
        setError(
          status && status >= 500
            ? "Something went wrong. Please try again."
            : message ?? "Something went wrong. Please try again.",
        );
        return;
      }
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0B0C] px-6 py-12 text-zinc-100">
      <div className="mx-auto mb-10 max-w-md text-center">
        <h1 className="text-lg font-bold uppercase tracking-[0.18em] text-[#D4A373]">unilag-support</h1>
        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">Reset Password</p>
      </div>

      <div className="mx-auto w-full max-w-md rounded-xl border border-[#1F1F21] bg-[#111111] p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-zinc-100">Choose a new password</h2>
          <p className="mt-2 text-sm text-zinc-500">Your reset link is valid for a limited time.</p>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-200">
            {successMessage}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-zinc-500">New password</label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={resetPasswordMutation.isPending || Boolean(successMessage)}
              className="w-full rounded-lg border border-[#2A2A2C] bg-[#0B0B0C] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#D4A373] disabled:opacity-60"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-zinc-500">Confirm password</label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={resetPasswordMutation.isPending || Boolean(successMessage)}
              className="w-full rounded-lg border border-[#2A2A2C] bg-[#0B0B0C] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#D4A373] disabled:opacity-60"
            />
          </div>

          <button
            className="w-full rounded-lg bg-[#D4A373] px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[#111111] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={resetPasswordMutation.isPending || Boolean(successMessage)}
          >
            {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
          </button>

          {successMessage ? (
            <button
              type="button"
              className="w-full rounded-lg border border-[#1F1F21] bg-transparent px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-zinc-300 hover:bg-[#1A1A1A]"
              onClick={() => router.replace("/dashboard/login")}
            >
              Back to Login
            </button>
          ) : null}
        </form>
      </div>
    </div>
  );
}
