import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UsersRolesClient } from "@/components/users/UsersRolesClient";

type ApiResult<T> = { data: T; error?: string };

async function fetchApi<T>(
  path: string,
  token: string,
  fallback: T,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 },
    });
    if (!res.ok) return { data: fallback, error: "Request failed" };
    const json = await res.json();
    return { data: json.success ? json.data : fallback };
  } catch (error) {
    console.error(`Error fetching ${path}:`, error);
    return { data: fallback, error: "Request failed" };
  }
}

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
      fetchApi<any[]>("/users", token, []),
      fetchApi<any[]>("/organizations", token, []),
      fetchApi<any[]>("/departments", token, []),
    ]);
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
      {(usersResult.error ||
        organizationsResult.error ||
        departmentsResult.error) && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Some user management data could not be loaded.
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
