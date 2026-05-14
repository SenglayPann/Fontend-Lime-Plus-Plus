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
  searchParams?: Promise<{ organization_id?: string; organizationId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = await searchParams;
  const organizationId =
    resolvedSearchParams?.organization_id ||
    resolvedSearchParams?.organizationId;
  let departmentsResult: ServerApiResult<any[]> = { data: [], error: null };
  const roles = session?.user?.roles || [];
  const hasOrganizationScope = (
    session?.user?.scopes?.organizations || []
  ).some((scope) => scope.role === "ORGANIZATION_MANAGER");
  const hasDepartmentScope = (session?.user?.scopes?.departments || []).some(
    (scope) => scope.role === "DEPARTMENT_MANAGER",
  );
  const canCreateDepartment = roles.includes("ADMIN") || hasOrganizationScope;
  const isDepartmentOnlyManager =
    hasDepartmentScope && !roles.includes("ADMIN") && !hasOrganizationScope;

  if (session?.user?.accessToken) {
    const query = organizationId
      ? `?organization_id=${encodeURIComponent(organizationId)}`
      : "";
    departmentsResult = await fetchServerApi<any[]>(
      `/departments${query}`,
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

        <DepartmentTable
          initialDepartments={departmentsResult.data}
          accessToken={session?.user?.accessToken || ""}
          canManageDepartments={canCreateDepartment}
        />
      </div>
    </DashboardLayout>
  );
}
