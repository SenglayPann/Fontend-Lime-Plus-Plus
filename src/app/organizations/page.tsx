import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { OrganizationsTableClient } from "@/components/organizations/OrganizationsTableClient";
import { fetchServerApi, type ServerApiResult } from "@/lib/server-api";

export default async function OrganizationsPage() {
  const session = await getServerSession(authOptions);
  let organizationsResult: ServerApiResult<any[]> = { data: [], error: null };
  const roles = session?.user?.roles || [];
  const canCreateOrganization = roles.includes("ADMIN");

  if (session?.user?.accessToken) {
    organizationsResult = await fetchServerApi<any[]>(
      "/organizations",
      session.user.accessToken,
      [],
    );
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

        {organizationsResult.error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {organizationsResult.error}
          </div>
        )}

        <OrganizationsTableClient
          organizations={organizationsResult.data}
          accessToken={session?.user?.accessToken || ""}
          canManageOrganizations={canCreateOrganization}
        />
      </div>
    </DashboardLayout>
  );
}
