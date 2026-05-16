import { getServerSession } from "next-auth/next";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectMembersClient } from "@/components/projects/ProjectMembersClient";
import { authOptions } from "@/lib/auth";
import { canManageProject, canManageProjectScope } from "@/lib/project-access";

type ApiResult<T> = { data?: T; error?: string };

async function fetchApi<T>(path: string, token: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const json = await res.json();

    if (!res.ok) {
      return { error: json.error?.message || json.message || "Request failed" };
    }

    return { data: json.success ? json.data : json };
  } catch (error: any) {
    return { error: error.message || "Request failed" };
  }
}

export default async function ProjectMembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.accessToken) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">
          You need to sign in to view project members.
        </p>
      </DashboardLayout>
    );
  }

  const token = session.user.accessToken;
  const [projectResult, membersResult, usersResult] = await Promise.all([
    fetchApi<any>(`/projects/${id}`, token),
    fetchApi<any[]>(`/projects/${id}/members`, token),
    fetchApi<any[]>(`/users`, token),
  ]);

  if (projectResult.error || !projectResult.data) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {projectResult.error || "Project not found"}
        </div>
      </DashboardLayout>
    );
  }

  const project = projectResult.data;
  const members = membersResult.data || project.members || [];
  const canAssignProjectManager = canManageProjectScope(session.user, project);
  const canManageMembers = canManageProject(session.user, {
    ...project,
    members,
  });

  return (
    <DashboardLayout>
      <ProjectMembersClient
        projectId={id}
        projectName={project.name}
        accessToken={token}
        initialMembers={members}
        visibleUsers={canManageMembers ? usersResult.data || [] : []}
        visibleUsersError={canManageMembers ? usersResult.error : undefined}
        canManageMembers={canManageMembers}
        canAssignProjectManager={canAssignProjectManager}
      />
    </DashboardLayout>
  );
}
