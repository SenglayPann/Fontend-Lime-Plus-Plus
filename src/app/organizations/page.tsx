import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { OrganizationsTableClient } from "@/components/organizations/OrganizationsTableClient";
import { fetchServerApi, type ServerApiResult } from "@/lib/server-api";

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams?.search?.trim() || "";
  let organizationsResult: ServerApiResult<any[]> = { data: [], error: null };
  let usersResult: ServerApiResult<any[]> = { data: [], error: null };
  const roles = session?.user?.roles || [];
  const canCreateOrganization = roles.includes("ADMIN");

  if (session?.user?.accessToken) {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const results = await Promise.all([
      fetchServerApi<any[]>(
        `/organizations${query}`,
        session.user.accessToken,
        [],
      ),
      canCreateOrganization
        ? fetchServerApi<any[]>("/users", session.user.accessToken, [])
        : Promise.resolve({ data: [], error: null }),
    ]);
    organizationsResult = results[0];
    usersResult = results[1];
  }

  const managerCandidates = usersResult.data.map((user) => ({
    id: user.id,
    label:
      user.name || user.githubUsername || user.email || "Unknown User",
  }));

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
        {usersResult.error && canCreateOrganization && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {usersResult.error}
          </div>
        )}

        <OrganizationsTableClient
          organizations={organizationsResult.data}
          accessToken={session?.user?.accessToken || ""}
          canManageOrganizations={canCreateOrganization}
          initialSearch={search}
          managerCandidates={managerCandidates}
        />
      </div>
    </DashboardLayout>
  );
}
