import AdminLoginClient from "./AdminLoginClient";

export default async function DashboardAdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;

  const nextPath = typeof sp.next === "string" && sp.next ? sp.next : "/dashboard";
  const initialError = sp.error === "invalid" ? "Invalid credentials." : null;

  return <AdminLoginClient nextPath={nextPath} initialError={initialError} />;
}
