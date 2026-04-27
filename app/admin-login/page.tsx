import { redirect } from "next/navigation";

export default async function AdminLoginCompatPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  redirect(`/dashboard/admin/login${error ? "?error=" + encodeURIComponent(error) : ""}`);
}
