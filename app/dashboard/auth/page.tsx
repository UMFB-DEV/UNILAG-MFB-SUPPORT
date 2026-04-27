import type { Role } from "@/lib/helpdesk/demoData";

import DashboardAuthClient from "./DashboardAuthClient";

export default async function DashboardAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; role?: string }>;
}) {
  const sp = await searchParams;

  const nextPath = typeof sp.next === "string" && sp.next ? sp.next : "/dashboard";
  const queryError = sp.error === "invalid";

  const role = sp.role === "agent" || sp.role === "user" ? sp.role : "user";

  return (
    <DashboardAuthClient
      nextPath={nextPath}
      queryError={queryError}
      initialRole={role as Exclude<Role, "admin">}
    />
  );
}
