import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { DepartmentTable } from "@/components/departments/DepartmentTable";
import { fetchServerApi, type ServerApiResult } from "@/lib/server-api";

export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    organization_id?: string;
    organizationId?: string;
    search?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = await searchParams;
  const organizationId =
    resolvedSearchParams?.organization_id ||
    resolvedSearchParams?.organizationId;
  const search = resolvedSearchParams?.search?.trim() || "";
  let departmentsResult: ServerApiResult<any[]> = { data: [], error: null };
  let organizationsResult: ServerApiResult<any[]> = { data: [], error: null };
  let usersResult: ServerApiResult<any[]> = { data: [], error: null };
  const roles = session?.user?.roles || [];
  const hasOrganizationScope = (
    session?.user?.scopes?.organizations || []
  ).some((scope) => scope.role === "ORGANIZATION_MANAGER");
  const hasDepartmentScope = (session?.user?.scopes?.departments || []).some(
    (scope) => scope.role === "DEPARTMENT_MANAGER",
  );
  const canCreateDepartment = roles.includes("ADMIN") || hasOrganizationScope;
  const canManageDepartment = canCreateDepartment || hasDepartmentScope;
  const isDepartmentOnlyManager =
    hasDepartmentScope && !roles.includes("ADMIN") && !hasOrganizationScope;

  if (session?.user?.accessToken) {
    const params = new URLSearchParams();
    if (organizationId) {
      params.set("organization_id", organizationId);
    }
    if (search) {
      params.set("search", search);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    const results = await Promise.all([
      fetchServerApi<any[]>(`/departments${query}`, session.user.accessToken, []),
      canCreateDepartment
        ? fetchServerApi<any[]>("/organizations", session.user.accessToken, [])
        : Promise.resolve({ data: [], error: null }),
      canCreateDepartment
        ? fetchServerApi<any[]>("/users", session.user.accessToken, [])
        : Promise.resolve({ data: [], error: null }),
    ]);

    departmentsResult = results[0];
    organizationsResult = results[1];
    usersResult = results[2];
  }

  const organizationScopeIds = new Set(
    (session?.user?.scopes?.organizations || [])
      .filter((scope) => scope.role === "ORGANIZATION_MANAGER")
      .map((scope) => scope.id),
  );
  const editableOrganizations = roles.includes("ADMIN")
    ? organizationsResult.data
    : organizationsResult.data.filter((organization) =>
        organizationScopeIds.has(organization.id),
      );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {isDepartmentOnlyManager ? "My Departments" : "Departments"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {organizationId
                ? "Departments filtered by the selected organization."
                : isDepartmentOnlyManager
                  ? "Department context for the projects you manage."
                : "Manage academic departments within your organizations."}
            </p>
          </div>
          {canCreateDepartment && (
            <Button className="gap-2" asChild>
              <Link href="/departments/new">
                <Plus className="h-4 w-4" /> Add Department
              </Link>
            </Button>
          )}
        </div>

        {departmentsResult.error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {departmentsResult.error}
          </div>
        )}
        {(organizationsResult.error || usersResult.error) &&
          canCreateDepartment && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {[organizationsResult.error, usersResult.error]
                .filter(Boolean)
                .join(" ")}
            </div>
          )}

        <DepartmentTable
          initialDepartments={departmentsResult.data}
          accessToken={session?.user?.accessToken || ""}
          initialSearch={search}
          canManageDepartments={canManageDepartment}
          canDeleteDepartments={canCreateDepartment}
          canChangeDepartmentOrganization={canCreateDepartment}
          canAssignDepartmentManager={canCreateDepartment}
          organizations={editableOrganizations}
          managerCandidates={usersResult.data}
          actorRoles={roles}
          actorUserId={session?.user?.id}
        />
      </div>
    </DashboardLayout>
  );
}
