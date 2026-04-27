"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { HelpdeskPro } from "../helpdesk/HelpdeskPro";

import { DEMO_USERS, type Role as DemoRole } from "@/lib/helpdesk/demoData";
import { useAuthStore } from "@/stores/authStore";

export default function DashboardPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const apiUser = useAuthStore((s) => s.user);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!token) {
        router.replace("/dashboard/login");
        return;
      }
      try {
        await bootstrap();
      } finally {
        if (mounted) setBooting(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token, bootstrap, router]);

  useEffect(() => {
    if (booting) return;
    if (!token) return;
    if (!apiUser) router.replace("/dashboard/login");
  }, [apiUser, booting, token, router]);

  const role: DemoRole = useMemo(() => {
    const r = apiUser?.role;
    if (r === "admin" || r === "agent" || r === "user") return r;
    return "user";
  }, [apiUser?.role]);

  const initialUser = useMemo(() => {
    const fallback = DEMO_USERS.find((u) => u.role === role) ?? DEMO_USERS[0]!;
    return fallback;
  }, [role]);

  if (!token || booting) {
    return null;
  }

  if (!apiUser) return null;

  return <HelpdeskPro initialUser={initialUser} />;
}
