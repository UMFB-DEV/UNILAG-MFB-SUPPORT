"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AuthUser } from "@/services/auth/schemas";
import { meAction } from "@/services/auth/action";

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  setAuth: (p: { token: string; user: AuthUser }) => void;
  clearAuth: () => void;
  bootstrap: () => Promise<AuthUser | null>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: ({ token, user }) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
      bootstrap: async () => {
        const token = useAuthStore.getState().token;
        if (!token) return null;
        try {
          const res = await meAction(token);
          const user = res.data ?? null;
          set({ user });
          return user;
        } catch {
          set({ token: null, user: null });
          return null;
        }
      },
    }),
    {
      name: "ts_auth",
      partialize: (s) => ({ token: s.token, user: s.user }),
    },
  ),
);
