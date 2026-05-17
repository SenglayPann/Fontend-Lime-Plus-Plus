import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ProjectListClient } from "@/components/projects/ProjectListClient";
import { fetchServerApi, type ServerApiResult } from "@/lib/server-api";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    departmentId?: string;
    department_id?: string;
    search?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = await searchParams;
  const departmentId =
    resolvedSearchParams?.department_id || resolvedSearchParams?.departmentId;
  const search = resolvedSearchParams?.search?.trim() || "";
  const roles = session?.user?.roles || [];
  const hasOrganizationScope = (
    session?.user?.scopes?.organizations || []
  ).some((scope) => scope.role === "ORGANIZATION_MANAGER");
  const hasDepartmentScope = (session?.user?.scopes?.departments || []).some(
    (scope) => scope.role === "DEPARTMENT_MANAGER",
  );
  const canCreateProject =
    roles.includes("ADMIN") || hasOrganizationScope || hasDepartmentScope;
  let projectsResult: ServerApiResult<any[]> = { data: [], error: null };

  if (session?.user?.accessToken) {
    const params = new URLSearchParams();
    if (departmentId) {
      params.set("department_id", departmentId);
    }
    if (search) {
      params.set("search", search);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    projectsResult = await fetchServerApi<any[]>(
      `/projects${query}`,
      session.user.accessToken,
      [],
    );
  }

  return (
    <DashboardLayout>
      {projectsResult.error && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {projectsResult.error}
        </div>
      )}
      <ProjectListClient
        initialProjects={projectsResult.data}
        departmentId={departmentId}
        initialSearch={search}
        canCreateProject={canCreateProject}
      />
    </DashboardLayout>
  );
}
