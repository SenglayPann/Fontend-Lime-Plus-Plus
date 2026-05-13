import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { OrganizationsTableClient } from "@/components/organizations/OrganizationsTableClient";

async function fetchOrganizations(token: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organizations`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return [];
  }
}

export default async function OrganizationsPage() {
  const session = await getServerSession(authOptions);
  let organizations: any[] = [];
  const roles = session?.user?.roles || [];
  const canCreateOrganization = roles.includes("ADMIN");

  if (session?.user?.accessToken) {
    organizations = await fetchOrganizations(session.user.accessToken);
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Organizations
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage all top-level organizations and their licenses.
            </p>
          </div>
          {canCreateOrganization && (
            <Button className="gap-2" asChild>
              <Link href="/organizations/new">
                <Plus className="h-4 w-4" /> Add Organization
              </Link>
            </Button>
          )}
        </div>

        <OrganizationsTableClient
          organizations={organizations}
          accessToken={session?.user?.accessToken || ""}
          canManageOrganizations={canCreateOrganization}
        />
      </div>
    </DashboardLayout>
  );
}
