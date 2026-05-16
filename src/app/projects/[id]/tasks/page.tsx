import { getServerSession } from "next-auth/next";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { authOptions } from "@/lib/auth";
import { canManageProject } from "@/lib/project-access";
import { ProjectTasksClient } from "@/components/projects/ProjectTasksClient";

async function fetchApi<T>(
  path: string,
  token: string,
): Promise<{ data?: T; error?: string }> {
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

export default async function ProjectTasksPage({
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
          You need to sign in to view project tasks.
        </p>
      </DashboardLayout>
    );
  }

  const token = session.user.accessToken;
  const [projectResult, tasksResult] = await Promise.all([
    fetchApi<any>(`/projects/${id}`, token),
    fetchApi<any[]>(`/tasks?project_id=${encodeURIComponent(id)}`, token),
  ]);
  const project = projectResult.data;
  const isProjectWide = project
    ? canManageProject(session.user, project)
    : false;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {(projectResult.error || tasksResult.error) && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
            {projectResult.error || tasksResult.error}
          </div>
        )}
        <ProjectTasksClient
          projectId={id}
          accessToken={token}
          repository={project?.repository}
          initialTasks={tasksResult.data || []}
          projectMembers={isProjectWide ? project?.members || [] : []}
          canSync={isProjectWide}
          canAssignTasks={isProjectWide}
          isProjectWide={isProjectWide}
          isLocked={project?.status === "LOCKED"}
        />
      </div>
    </DashboardLayout>
  );
}
