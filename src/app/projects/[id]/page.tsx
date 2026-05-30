import { getServerSession } from "next-auth/next";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Github,
  History,
  Lock,
  Trophy,
  Unlock,
  UserCog,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authOptions } from "@/lib/auth";
import { canManageProject, canManageProjectScope } from "@/lib/project-access";
import { ContributionPieChart } from "@/components/charts/ContributionPieChart";
import { TeamPerformanceBar } from "@/components/charts/TeamPerformanceBar";
import { ReportDownloadButton } from "@/components/reports/ReportDownloadButton";
import { ProjectActions } from "@/components/projects/ProjectActions";
import { LinkGitHubBanner } from "@/components/projects/LinkGitHubBanner";

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

function githubUrl(repository?: string | null) {
  if (!repository) return null;
  if (repository.startsWith("http://") || repository.startsWith("https://"))
    return repository;
  return `https://github.com/${repository}`;
}

export default async function ProjectDetailPage({
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
          You need to sign in to view this project.
        </p>
      </DashboardLayout>
    );
  }

  const token = session.user.accessToken;
  const [projectResult, tasksResult, prsResult] = await Promise.all([
    fetchApi<any>(`/projects/${id}`, token),
    fetchApi<any[]>(`/tasks?project_id=${encodeURIComponent(id)}`, token),
    fetchApi<any[]>(`/projects/${id}/pull-requests`, token),
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
  const tasks = tasksResult.data || [];
  const pullRequests = prsResult.data || [];
  const repoUrl = githubUrl(project.repository);
  const members = project.members || [];
  const canManageCurrentProject = canManageProject(session.user, project);
  const canLockProject = canManageProjectScope(session.user, project);
  const completedTasks = tasks.filter((task) => task.status === "DONE").length;
  const activeTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS",
  ).length;
  const blockedTasks = tasks.filter((task) => task.status === "BLOCKED").length;
  const scopedTaskFallback = canManageCurrentProject
    ? project._count?.tasks || 0
    : 0;
  const totalTasks = tasks.length || scopedTaskFallback;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const mergedPrs = pullRequests.filter((pr) => pr.status === "MERGED").length;
  const prAcceptance =
    pullRequests.length > 0
      ? Math.round((mergedPrs / pullRequests.length) * 100)
      : 0;
  const assignedContributorIds = new Set<string>();
  for (const task of tasks) {
    if (task.assigneeId) assignedContributorIds.add(task.assigneeId);
    else if (task.assignee?.id) assignedContributorIds.add(task.assignee.id);
  }
  const memberCount =
    assignedContributorIds.size ||
    members.length ||
    project._count?.members ||
    0;
  const averageTaskCompletion =
    memberCount > 0 ? Math.round((completedTasks / memberCount) * 10) : 0;
  const linkedTasks = tasks.filter(
    (task) => (task.pullRequests || []).length > 0,
  ).length;

  const contributionData = [
    { name: "Done Tasks", value: completedTasks },
    { name: "Active Tasks", value: activeTasks },
    { name: "Blocked Tasks", value: blockedTasks },
    { name: "Pull Requests", value: pullRequests.length },
  ].filter((item) => item.value > 0);

  const tasksByAssignee = new Map<string, number>();
  for (const member of members) {
    const name =
      member.user?.name ||
      member.user?.githubUsername ||
      member.user?.email ||
      "Unnamed";
    tasksByAssignee.set(name, 0);
  }
  for (const task of tasks) {
    const name =
      task.assignee?.name ||
      task.assignee?.githubUsername ||
      task.assignee?.email ||
      "Unassigned";
    tasksByAssignee.set(
      name,
      (tasksByAssignee.get(name) || 0) + (task.status === "DONE" ? 1 : 0),
    );
  }

  const teamData = Array.from(tasksByAssignee.entries())
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const chartData =
    contributionData.length > 0
      ? contributionData
      : [{ name: "No Activity", value: 1 }];
  const leaderboardData =
    teamData.length > 0 ? teamData : [{ name: "No Members", score: 0 }];
  const statCards = canManageCurrentProject
    ? [
        {
          label: "Completion Rate",
          value: `${completionRate}%`,
          icon: CheckCircle2,
          color: "text-primary",
        },
        {
          label: "Active Members",
          value: memberCount,
          icon: Users,
          color: "text-blue-600 dark:text-blue-400",
        },
        {
          label: "PR Acceptance",
          value: `${prAcceptance}%`,
          icon: Github,
          color: "text-purple-600 dark:text-purple-400",
        },
        {
          label: "Avg. Done Tasks",
          value: averageTaskCompletion / 10,
          icon: Trophy,
          color: "text-amber-500",
        },
      ]
    : [
        {
          label: "My Completion",
          value: `${completionRate}%`,
          icon: CheckCircle2,
          color: "text-primary",
        },
        {
          label: "My Tasks",
          value: totalTasks,
          icon: ClipboardList,
          color: "text-blue-600 dark:text-blue-400",
        },
        {
          label: "Merged PRs",
          value: mergedPrs,
          icon: Github,
          color: "text-purple-600 dark:text-purple-400",
        },
        {
          label: "Done Tasks",
          value: completedTasks,
          icon: Trophy,
          color: "text-amber-500",
        },
      ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Link
              href="/projects"
              className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Projects
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {project.name}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  project.status === "ACTIVE"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {project.status === "ACTIVE" ? (
                  <Unlock className="h-3 w-3 mr-1" />
                ) : (
                  <Lock className="h-3 w-3 mr-1" />
                )}
                {project.status}
              </span>
            </div>
            <p className="text-muted-foreground">
              {project.department?.name || "No department"}
              {project.repository ? ` - ${project.repository}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-start gap-3">
            <Button variant="outline" className="gap-2" asChild>
              <Link href={`/projects/${id}/tasks`}>
                <ClipboardList className="h-4 w-4" /> Tasks
              </Link>
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <Link href={`/projects/${id}/members`}>
                <UserCog className="h-4 w-4" /> Members
              </Link>
            </Button>
            {canManageCurrentProject && (
              <Button variant="outline" className="gap-2" asChild>
                <Link href={`/projects/${id}/audit`}>
                  <History className="h-4 w-4" /> Audit
                </Link>
              </Button>
            )}
            {canManageCurrentProject ? (
              <>
                <ReportDownloadButton
                  projectId={id}
                  type="project"
                  format="csv"
                />
                <ReportDownloadButton
                  projectId={id}
                  type="project"
                  format="pdf"
                />
                <div className="hidden h-6 w-px bg-border mx-1 sm:block" />
                <ProjectActions
                  projectId={id}
                  accessToken={token}
                  isLocked={project.status === "LOCKED"}
                  canLockProject={canLockProject}
                />
              </>
            ) : (
              <ReportDownloadButton
                projectId={id}
                userId={session.user.id}
                type="individual"
                format="pdf"
              />
            )}
          </div>
        </div>

        {!project.repository && (
          canManageCurrentProject ? (
            <LinkGitHubBanner projectId={id} accessToken={token} />
          ) : (
            <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 p-4 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <span className="font-bold">Project Integration Required:</span> This project is not linked to any GitHub repository yet. Please ask your Project Manager or Lead to configure the integration.
              </div>
            </div>
          )
        )}

        {(tasksResult.error || prsResult.error) && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-300">
            Some related project data could not be loaded:{" "}
            {tasksResult.error || prsResult.error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div
                    className={cn(
                      "h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center",
                      stat.color,
                    )}
                  >
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {canManageCurrentProject ? "Activity Mix" : "My Activity Mix"}
              </CardTitle>
              <CardDescription>
                {canManageCurrentProject
                  ? "Current project activity from tasks and pull requests."
                  : "Your assigned task and pull request activity."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContributionPieChart data={chartData} />
            </CardContent>
          </Card>

          {canManageCurrentProject ? (
            <Card>
              <CardHeader>
                <CardTitle>Team Leaderboard</CardTitle>
                <CardDescription>
                  Completed tasks by project member.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TeamPerformanceBar data={leaderboardData} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>My Evidence</CardTitle>
                <CardDescription>
                  Scoring evidence found so far.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Linked Tasks", linkedTasks],
                  ["Pull Requests", pullRequests.length],
                  ["Merged", mergedPrs],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-border p-4"
                  >
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Project Roadmap</CardTitle>
              <CardDescription>
                Live task status distribution and evaluation window.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  ["Done", completedTasks],
                  ["In Progress", activeTasks],
                  ["Blocked", blockedTasks],
                  [
                    "Open",
                    Math.max(
                      totalTasks - completedTasks - activeTasks - blockedTasks,
                      0,
                    ),
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-border p-4"
                  >
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">
                    Evaluation Start
                  </p>
                  <p className="font-medium">
                    {project.evalStart
                      ? new Date(project.evalStart).toLocaleDateString()
                      : "Not set"}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">
                    Evaluation End
                  </p>
                  <p className="font-medium">
                    {project.evalEnd
                      ? new Date(project.evalEnd).toLocaleDateString()
                      : "Not set"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Repository</CardTitle>
              <CardDescription>Source control information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 rounded-lg border border-border p-4">
                <Github className="h-10 w-10 text-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {project.repository || "No repository"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {project.platform || "GITHUB"}
                    {project.externalProjectId
                      ? ` - ${project.externalProjectId}`
                      : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={!repoUrl}
                  asChild={!!repoUrl}
                >
                  {repoUrl ? (
                    <a
                      href={repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Open repository"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <span>
                      <AlertCircle className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created On</span>
                  <span className="font-medium">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total PRs</span>
                  <span className="font-medium">
                    {pullRequests.length ||
                      (canManageCurrentProject
                        ? project._count?.pullRequests || 0
                        : 0)}
                  </span>
                </div>
              </div>

              <Button
                className="w-full gap-2"
                variant="outline"
                disabled={!repoUrl}
                asChild={!!repoUrl}
              >
                {repoUrl ? (
                  <a href={repoUrl} target="_blank" rel="noreferrer">
                    <Github className="h-4 w-4" /> View on GitHub
                  </a>
                ) : (
                  <span>
                    <Github className="h-4 w-4" /> View on GitHub
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
