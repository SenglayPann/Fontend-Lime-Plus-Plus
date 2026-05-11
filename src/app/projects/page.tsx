
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ProjectListClient } from "@/components/projects/ProjectListClient";

async function fetchProjects(token: string, departmentId?: string) {
  try {
    const query = departmentId ? `?department_id=${encodeURIComponent(departmentId)}` : "";
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects${query}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams?: Promise<{ departmentId?: string; department_id?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = await searchParams;
  const departmentId = resolvedSearchParams?.department_id || resolvedSearchParams?.departmentId;
  let projects: any[] = [];

  if (session?.user?.accessToken) {
    projects = await fetchProjects(session.user.accessToken, departmentId);
  }

  return (
    <DashboardLayout>
      <ProjectListClient initialProjects={projects} departmentId={departmentId} />
    </DashboardLayout>
  );
}
