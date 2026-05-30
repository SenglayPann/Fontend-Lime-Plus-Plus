import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectManagersClient } from "@/components/users/ProjectManagersClient";
import { fetchServerApi } from "@/lib/server-api";

export default async function ProjectManagersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.accessToken) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">
          You need to sign in to view project managers.
        </p>
      </DashboardLayout>
    );
  }

  const token = session.user.accessToken;
  const [managersResult, usersResult, departmentsResult] = await Promise.all([
    fetchServerApi<any[]>("/users/project-managers", token, []),
    fetchServerApi<any[]>("/users", token, []),
    fetchServerApi<any[]>("/departments", token, []),
  ]);

  const loadErrors = [
    managersResult.error,
    usersResult.error,
    departmentsResult.error,
  ].filter(Boolean);

  const roles = session.user.roles || [];
  const departmentScopeIds = new Set(
    (session.user.scopes?.departments || [])
      .filter((scope) => scope.role === "DEPARTMENT_MANAGER")
      .map((scope) => scope.id),
  );
  const organizationScopeIds = new Set(
    (session.user.scopes?.organizations || [])
      .filter((scope) => scope.role === "ORGANIZATION_MANAGER")
      .map((scope) => scope.id),
  );

  const assignableDepartments = roles.includes("ADMIN")
    ? departmentsResult.data
    : departmentsResult.data.filter((department: any) =>
        departmentScopeIds.has(department.id) ||
        organizationScopeIds.has(department.organizationId || department.organization?.id),
      );

  return (
    <DashboardLayout>
      {loadErrors.length > 0 && (
        <div className="mb-6 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-300">
          {loadErrors.join(" ")}
        </div>
      )}
      <ProjectManagersClient
        managers={managersResult.data}
        allUsers={usersResult.data}
        departments={assignableDepartments}
        accessToken={token}
        actorRoles={roles}
        actorScopes={session.user.scopes}
      />
    </DashboardLayout>
  );
}
