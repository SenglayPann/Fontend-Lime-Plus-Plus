"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, FolderKanban, Github, Loader2, Save } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";

type Option = { value: string; label: string };

export default function NewProjectPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const roles = session?.user?.roles || [];
  const hasOrganizationScope = (
    session?.user?.scopes?.organizations || []
  ).some((scope) => scope.role === "ORGANIZATION_MANAGER");
  const hasDepartmentScope = (session?.user?.scopes?.departments || []).some(
    (scope) => scope.role === "DEPARTMENT_MANAGER",
  );
  const canCreateProject =
    roles.includes("ADMIN") || hasOrganizationScope || hasDepartmentScope;
  const [departments, setDepartments] = useState<Option[]>([]);
  const [users, setUsers] = useState<Option[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [projectManagerId, setProjectManagerId] = useState("");
  const [name, setName] = useState("");
  const [repository, setRepository] = useState("");
  const [githubProjectId, setGithubProjectId] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [evalStart, setEvalStart] = useState("");
  const [evalEnd, setEvalEnd] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFormData() {
      if (status === "loading") return;
      if (!session?.user?.accessToken || !canCreateProject) {
        setIsLoading(false);
        return;
      }

      try {
        const authHeaders = {
          Authorization: `Bearer ${session.user.accessToken}`,
        };
        const [departmentsRes, usersRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments`, {
            headers: authHeaders,
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
            headers: authHeaders,
          }),
        ]);

        const departmentsJson = await departmentsRes.json();
        const usersJson = await usersRes.json().catch(() => null);

        if (!departmentsRes.ok) {
          throw new Error(
            departmentsJson.error?.message || "Failed to load departments",
          );
        }

        const data = departmentsJson.success ? departmentsJson.data : [];
        const organizationScopeIds = new Set(
          (session.user.scopes?.organizations || [])
            .filter((scope) => scope.role === "ORGANIZATION_MANAGER")
            .map((scope) => scope.id),
        );
        const departmentScopeIds = new Set(
          (session.user.scopes?.departments || [])
            .filter((scope) => scope.role === "DEPARTMENT_MANAGER")
            .map((scope) => scope.id),
        );
        const creatableDepartments = roles.includes("ADMIN")
          ? data
          : data.filter(
              (department: any) =>
                departmentScopeIds.has(department.id) ||
                organizationScopeIds.has(
                  department.organizationId || department.organization?.id,
                ),
            );
        setDepartments(
          creatableDepartments.map((department: any) => ({
            value: department.id,
            label: department.organization?.name
              ? `${department.name} (${department.organization.name})`
              : department.name,
          })),
        );

        const fallbackManager: Option | null = session.user.id
          ? {
              value: session.user.id,
              label: session.user.name || session.user.email || "You",
            }
          : null;

        const userData = usersRes.ok
          ? usersJson?.success
            ? usersJson.data
            : Array.isArray(usersJson)
              ? usersJson
              : []
          : [];
        const userOptions: Option[] = userData.map((user: any) => ({
          value: user.id,
          label:
            user.name ||
            user.githubUsername ||
            user.email ||
            user.githubUserId ||
            user.id,
        }));
        const managerOptions: Option[] = userOptions.length
          ? userOptions
          : fallbackManager
            ? [fallbackManager]
            : [];

        setUsers(managerOptions);
        setProjectManagerId((current) =>
          managerOptions.some((option) => option.value === current)
            ? current
            : "",
        );
      } catch (err: any) {
        setError(err.message || "Failed to load project form data");
      } finally {
        setIsLoading(false);
      }
    }

    loadFormData();
  }, [canCreateProject, session, status]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.user?.accessToken) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const body: Record<string, any> = {
        department_id: departmentId,
        name,
        repository,
        github_project_id: githubProjectId,
      };

      if (projectManagerId) {
        body.project_manager_id = projectManagerId;
      }

      if (evalStart || evalEnd) {
        body.evaluation_window = {
          start: evalStart || undefined,
          end: evalEnd || undefined,
        };
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`,
          "x-github-token": githubToken,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error?.message || json.message || "Failed to create project",
        );
      }

      router.push(`/projects/${json.data.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading project form...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!canCreateProject) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          You do not have permission to create projects.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-1">
          <Link
            href="/projects"
            className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Projects
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Create Project
          </h1>
          <p className="text-muted-foreground text-lg">
            Link a GitHub project board to a department.
          </p>
        </div>

        <Card>
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <FolderKanban className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>
                  These fields map to the backend project contract.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            {error && (
              <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Department</Label>
                <Combobox
                  options={departments}
                  value={departmentId}
                  onChange={setDepartmentId}
                  placeholder="Select a department..."
                  emptyText="No departments found."
                />
              </div>

              <div className="space-y-2">
                <Label>Project Manager</Label>
                <Combobox
                  options={users}
                  value={projectManagerId}
                  onChange={setProjectManagerId}
                  placeholder="Select a project manager..."
                  emptyText="No users found."
                />
                <p className="text-xs text-muted-foreground">
                  This user becomes the project leader and can sync Kanban,
                  manage tasks, and maintain the project roster.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Distributed Systems Project"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repository" className="flex items-center gap-2">
                  <Github className="h-4 w-4 text-primary" /> Repository
                </Label>
                <Input
                  id="repository"
                  value={repository}
                  onChange={(event) => setRepository(event.target.value)}
                  placeholder="owner/repo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="githubProjectId">GitHub Project V2 ID</Label>
                <Input
                  id="githubProjectId"
                  value={githubProjectId}
                  onChange={(event) => setGithubProjectId(event.target.value)}
                  placeholder="PVT_kwHO..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="githubToken">GitHub Access Token</Label>
                <Input
                  id="githubToken"
                  type="password"
                  value={githubToken}
                  onChange={(event) => setGithubToken(event.target.value)}
                  placeholder="Token with repository and Project V2 read access"
                />
                <p className="text-xs text-muted-foreground">
                  Used only for validation. Required unless the backend has
                  GITHUB_PERSONAL_ACCESS_TOKEN configured.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="evalStart">Evaluation Start</Label>
                  <Input
                    id="evalStart"
                    type="date"
                    value={evalStart}
                    onChange={(event) => setEvalStart(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="evalEnd">Evaluation End</Label>
                  <Input
                    id="evalEnd"
                    type="date"
                    value={evalEnd}
                    onChange={(event) => setEvalEnd(event.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-border/50 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="gap-2"
                  disabled={isSubmitting || !departmentId || !projectManagerId}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSubmitting ? "Validating..." : "Create Project"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
