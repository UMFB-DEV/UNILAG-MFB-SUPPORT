import { redirect } from "next/navigation";

export default async function LoginCompatPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; error?: string }>;
}) {
  const { role, error } = await searchParams;

  const roleHint = role === "user" || role === "agent" ? role : "";
  const base = roleHint ? `/dashboard/auth?role=${encodeURIComponent(roleHint)}` : "/dashboard/login";
  const url = error ? `${base}${base.includes("?") ? "&" : "?"}error=${encodeURIComponent(error)}` : base;
  redirect(url);
}
