import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  redirect(`/dashboard/auth${error ? "?error=" + encodeURIComponent(error) : ""}`);
}
