import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";

export default async function HelpdeskLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Back-compat: old route now forwards to centralized auth.
  const { error } = await searchParams;
  redirect(`/dashboard/login${error ? "?error=" + encodeURIComponent(error) : ""}`);
}

