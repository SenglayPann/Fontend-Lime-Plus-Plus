"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
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
import {
  getUserEffectiveRoles,
  highestRoleRank,
  userBelongsToOrganization,
} from "@/lib/user-affiliation";

type Option = { value: string; label: string };
type DepartmentOption = Option & { organizationId: string };

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
    roles.includes("ADMIN") ||
    roles.includes("PROJECT_MANAGER") ||
    hasOrganizationScope ||
    hasDepartmentScope;
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [userCandidates, setUserCandidates] = useState<any[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [projectManagerId, setProjectManagerId] = useState("");
  const [projectLeadId, setProjectLeadId] = useState("");
  const [name, setName] = useState("");
  const [repository, setRepository] = useState("");
  const [githubProjectId, setGithubProjectId] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [evalStart, setEvalStart] = useState("");
  const [evalEnd, setEvalEnd] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOrganizationId = useMemo(() => {
    return (
      departments.find((option) => option.value === departmentId)
        ?.organizationId || ""
    );
  }, [departments, departmentId]);

  // Scope the PM/PL pool to users affiliated with the chosen department's
  // organization. Admin sees everyone; the actor can always pick themselves
  // (so an org manager not yet affiliated with the org can still become PM).
  // Non-admin actors can only pick users with strictly lower effective rank.
  const memberOptions = useMemo<Option[]>(() => {
    if (!selectedOrganizationId) {
      // Until the user picks a department, surface only the actor (so they
      // can default to themselves). Prevents leaking the full visible-user
      // union before scope is chosen.
      if (session?.user?.id) {
        return [
          {
            value: session.user.id,
            label: session.user.name || session.user.email || "You",
          },
        ];
      }
      return [];
    }

    const actorId = session?.user?.id;
    const actorRank = highestRoleRank(roles);
    const isAdmin = roles.includes("ADMIN");

    const filtered = userCandidates.filter((user) => {
      if (user.id === actorId) return true;
      if (isAdmin) return true;
      return (
        userBelongsToOrganization(user, selectedOrganizationId) &&
        highestRoleRank(getUserEffectiveRoles(user)) < actorRank
      );
    });

    return filtered.map((user) => ({
      value: user.id,
      label:
        user.name ||
        user.githubUsername ||
        user.email ||
        user.githubUserId ||
        user.id,
    }));
  }, [userCandidates, selectedOrganizationId, roles, session?.user]);

  // Reset PM/PL when the available pool changes so we never submit a stale
  // selection from a different organization.
  useEffect(() => {
    setProjectManagerId((current) => {
      if (!current) return session?.user?.id || "";
      return memberOptions.some((opt) => opt.value === current)
        ? current
        : session?.user?.id || "";
    });
    setProjectLeadId((current) => {
      if (!current) return "";
      return memberOptions.some((opt) => opt.value === current) ? current : "";
    });
  }, [memberOptions, session?.user?.id]);

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
            .filter(
              (scope) =>
                scope.role === "DEPARTMENT_MANAGER" ||
                scope.role === "PROJECT_MANAGER",
            )
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
          creatableDepartments
            .map((department: any) => {
              const orgId =
                department.organizationId || department.organization?.id;
              if (!orgId) return null;
              return {
                value: department.id,
                label: department.organization?.name
                  ? `${department.name} (${department.organization.name})`
                  : department.name,
                organizationId: orgId,
              };
            })
            .filter(Boolean) as DepartmentOption[],
        );

        const userData = usersRes.ok
          ? usersJson?.success
            ? usersJson.data
            : Array.isArray(usersJson)
              ? usersJson
              : []
          : [];

        setUserCandidates(userData);
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
        project_lead_id: projectLeadId,
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

      toast.success("Project created");
      router.push(`/projects/${json.data.id}`);
      router.refresh();
    } catch (err: any) {
      const message = err.message || "Failed to create project";
      setError(message);
      toast.error(message);
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
                <Label>Project Manager / Supervisor (Teacher)</Label>
                <Combobox
                  options={memberOptions}
                  value={projectManagerId}
                  onChange={setProjectManagerId}
                  placeholder={
                    departmentId
                      ? "Select a supervising project manager..."
                      : "Pick a department first..."
                  }
                  emptyText="No eligible users in this organization."
                />
                <p className="text-xs text-muted-foreground">
                  The teacher or supervisor for this project. Defaults to the creator
                  if left empty. Limited to users affiliated with the selected
                  department's organization.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Project Lead (Student)</Label>
                <Combobox
                  options={memberOptions}
                  value={projectLeadId}
                  onChange={setProjectLeadId}
                  placeholder={
                    departmentId
                      ? "Select a student project lead..."
                      : "Pick a department first..."
                  }
                  emptyText="No eligible users in this organization."
                />
                <p className="text-xs text-muted-foreground">
                  Strictly mandatory. The student leader for this project. They
                  must have linked their GitHub account if a repository is
                  pre-attached.
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
                  <Github className="h-4 w-4 text-primary" /> Repository <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="repository"
                  value={repository}
                  onChange={(event) => setRepository(event.target.value)}
                  placeholder="owner/repo (can attach later)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="githubProjectId">
                  GitHub Project V2 ID <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="githubProjectId"
                  value={githubProjectId}
                  onChange={(event) => setGithubProjectId(event.target.value)}
                  placeholder="PVT_kwHO... (can attach later)"
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
                  disabled={isSubmitting || !departmentId || !projectManagerId || !projectLeadId}
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

