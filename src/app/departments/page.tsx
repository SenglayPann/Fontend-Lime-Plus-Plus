import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { DepartmentTable } from "@/components/departments/DepartmentTable";

async function fetchDepartments(token: string, organizationId?: string) {
  try {
    const query = organizationId
      ? `?organization_id=${encodeURIComponent(organizationId)}`
      : "";
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/departments${query}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 0 }, // Disable cache for real-time count
      },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (error) {
    console.error("Error fetching departments:", error);
    return [];
  }
}

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
  let departments: any[] = [];
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
    departments = await fetchDepartments(
      session.user.accessToken,
      organizationId,
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

        <DepartmentTable
          initialDepartments={departments}
          accessToken={session?.user?.accessToken || ""}
          canManageDepartments={canCreateDepartment}
        />
      </div>
    </DashboardLayout>
  );
}
