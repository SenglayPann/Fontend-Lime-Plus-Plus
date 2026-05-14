import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UsersRolesClient } from "@/components/users/UsersRolesClient";
import { fetchServerApi } from "@/lib/server-api";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.accessToken) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">
          You need to sign in to view users.
        </p>
      </DashboardLayout>
    );
  }

  const token = session.user.accessToken;
  const [usersResult, organizationsResult, departmentsResult] =
    await Promise.all([
      fetchServerApi<any[]>("/users", token, []),
      fetchServerApi<any[]>("/organizations", token, []),
      fetchServerApi<any[]>("/departments", token, []),
    ]);
  const loadErrors = [
    usersResult.error,
    organizationsResult.error,
    departmentsResult.error,
  ].filter(Boolean);
  const roles = session.user.roles || [];
  const organizationScopeIds = new Set(
    (session.user.scopes?.organizations || [])
      .filter((scope) => scope.role === "ORGANIZATION_MANAGER")
      .map((scope) => scope.id),
  );
  const assignableOrganizations = roles.includes("ADMIN")
    ? organizationsResult.data
    : organizationsResult.data.filter((organization) =>
        organizationScopeIds.has(organization.id),
      );
  const assignableDepartments = roles.includes("ADMIN")
    ? departmentsResult.data
    : departmentsResult.data.filter((department) =>
        organizationScopeIds.has(
          department.organizationId || department.organization?.id,
        ),
      );

  return (
    <DashboardLayout>
      {loadErrors.length > 0 && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {loadErrors.join(" ")}
        </div>
      )}
      <UsersRolesClient
        users={usersResult.data}
        organizations={assignableOrganizations}
        departments={assignableDepartments}
        accessToken={token}
        actorRoles={roles}
        actorScopes={session.user.scopes}
      />
    </DashboardLayout>
  );
}
