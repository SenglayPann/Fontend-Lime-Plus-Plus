"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, FolderKanban, Github, Loader2, Save } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";

type Option = { value: string; label: string };

export default function NewProjectPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [departments, setDepartments] = useState<Option[]>([]);
  const [departmentId, setDepartmentId] = useState("");
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
    async function loadDepartments() {
      if (!session?.user?.accessToken) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments`, {
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
        });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error?.message || "Failed to load departments");
        }

        const data = json.success ? json.data : [];
        setDepartments(
          data.map((department: any) => ({
            value: department.id,
            label: department.organization?.name
              ? `${department.name} (${department.organization.name})`
              : department.name,
          })),
        );
      } catch (err: any) {
        setError(err.message || "Failed to load departments");
      } finally {
        setIsLoading(false);
      }
    }

    loadDepartments();
  }, [session]);

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
        throw new Error(json.error?.message || json.message || "Failed to create project");
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
          <p className="text-muted-foreground">Loading departments...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-1">
          <Link href="/projects" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Projects
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Project</h1>
          <p className="text-muted-foreground text-lg">Link a GitHub project board to a department.</p>
        </div>

        <Card>
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <FolderKanban className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>These fields map to the backend project contract.</CardDescription>
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
                  Used only for validation. Required unless the backend has GITHUB_PERSONAL_ACCESS_TOKEN configured.
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
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" className="gap-2" disabled={isSubmitting || !departmentId}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
