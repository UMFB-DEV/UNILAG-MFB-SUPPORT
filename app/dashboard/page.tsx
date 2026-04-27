"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { HelpdeskPro } from "../helpdesk/HelpdeskPro";

import type { Role as DemoRole } from "@/lib/helpdesk/demoData";
import { useAuthStore } from "@/stores/authStore";

function emailToId(email: string) {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

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
    const email = apiUser?.email ?? "unknown@example.com";
    const name = apiUser?.name ?? email.split("@")[0] ?? "User";
    return {
      id: emailToId(email.toLowerCase()),
      email,
      name,
      role,
    };
  }, [apiUser?.email, apiUser?.name, role]);

  if (!token || booting) {
    return null;
  }

  if (!apiUser) return null;

  return <HelpdeskPro initialUser={initialUser} />;
}
