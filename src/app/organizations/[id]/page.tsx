import { getServerSession } from "next-auth/next";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ScopeDashboardView } from "@/components/scope/ScopeDashboardView";
import { authOptions } from "@/lib/auth";

async function fetchOrganizationDashboard(id: string, token: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/dashboard/organizations/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    const json = await res.json();
    if (!res.ok) {
      return { data: null, error: json.error?.message || "Request failed" };
    }
    return { data: json.success ? json.data : json, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || "Request failed" };
  }
}

export default async function OrganizationDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.accessToken) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">
          You need to sign in to view this organization.
        </p>
      </DashboardLayout>
    );
  }

  const result = await fetchOrganizationDashboard(id, session.user.accessToken);

  return (
    <DashboardLayout>
      {result.error || !result.data ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {result.error || "Organization dashboard not found"}
        </div>
      ) : (
        <ScopeDashboardView data={result.data} backHref="/organizations" />
      )}
    </DashboardLayout>
  );
}
