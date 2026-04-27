import { redirect } from "next/navigation";

type Role = "admin" | "agent" | "user";

export default async function HelpdeskRolePage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;

  if (role !== "admin" && role !== "agent" && role !== "user") {
    redirect("/dashboard/login");
  }

  if (role === "admin") redirect("/dashboard/admin/login");
  redirect(`/dashboard/auth?role=${encodeURIComponent(role)}`);
}
