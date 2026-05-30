import Link from "next/link";
import { getServerSession } from "next-auth/next";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  GitPullRequest,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReportDownloadButton } from "@/components/reports/ReportDownloadButton";
import { cn } from "@/lib/utils";

type MyContributions = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    githubUsername: string | null;
    avatarUrl: string | null;
  };
  summary: {
    activeProjects: number;
    assignedTasks: number;
    doneTasks: number;
    mergedPrs: number;
    approvedReviews: number;
    totalScore: number;
  };
  projects: Array<{
    id: string;
    name: string;
    role: string;
    status: string;
    repository: string;
    department: string;
    organization: string;
    taskCount: number;
    doneTasks: number;
    mergedPrs: number;
    totalScore: number;
  }>;
  assignedTasks: Array<{
    id: string;
    externalTaskId: string;
    title: string;
    status: string;
    projectId: string;
    projectName: string;
    linkedPr: {
      externalPrId: string;
      title: string;
      status: string;
      url: string | null;
      mergedAt: string | null;
    } | null;
    scoringStatus: string;
  }>;
  pullRequests: Array<{
    id: string;
    externalPrId: string;
    title: string;
    status: string;
    url: string | null;
    mergedAt: string | null;
    projectId: string;
    projectName: string;
    taskId: string | null;
  }>;
  warnings: string[];
};

type MyContributionsResult = {
  data: MyContributions | null;
  error: string | null;
  status?: number;
};

async function fetchMyContributions(
  token: string,
): Promise<MyContributionsResult> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    return { data: null, error: "Backend API URL is not configured" };
  }

  try {
    const res = await fetch(`${baseUrl}/dashboard/my-contributions`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const json = await res.json();

    if (!res.ok) {
      return {
        data: null,
        error: json.error?.message || json.message || "Request failed",
        status: res.status,
      };
    }

    return { data: json.success ? json.data : null, error: null, status: res.status };
  } catch (error) {
    console.error("Error fetching my contributions:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}

export default async function MyContributionsPage() {
  const session = await getServerSession(authOptions);
  const result = session?.user?.accessToken
    ? await fetchMyContributions(session.user.accessToken)
    : { data: null, error: "You need to sign in to view contributions" };
  const data = result.data;

  return (
    <DashboardLayout>
      {result.error ? (
        <ContributionErrorState message={result.error} status={result.status} />
      ) : !data || data.projects.length === 0 ? (
        <NoProjectWorkspace data={data} />
      ) : (
        <ContributorWorkspace data={data} />
      )}
    </DashboardLayout>
  );
}

function ContributionErrorState({
  message,
  status,
}: {
  message: string;
  status?: number;
}) {
  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
      <div className="mb-1 flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4" /> Contributions could not be loaded
      </div>
      <p>
        {status ? `Request failed with status ${status}: ` : ""}
        {message}
      </p>
    </div>
  );
}

function NoProjectWorkspace({ data }: { data: MyContributions | null }) {
  const user = data?.user;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome to Lime++
        </h1>
        <p className="text-muted-foreground">
          You are signed in with GitHub, but you are not assigned to any project
          yet.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>GitHub Account</CardTitle>
            <CardDescription>
              Your Lime++ identity comes from GitHub.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-muted" />
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {user?.name || user?.githubUsername || "GitHub user"}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {user?.githubUsername
                    ? `@${user.githubUsername}`
                    : user?.email || "Signed in"}
                </p>
              </div>
            </div>
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              No active projects, assigned tasks, or contribution score have
              been found for this account.
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>What Happens Next</CardTitle>
              <CardDescription>
                Projects appear automatically when your GitHub account is
                assigned on a synced Kanban board.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusRow
                icon={FolderKanban}
                title="Wait for project sync"
                description="Your teacher or project manager syncs the GitHub Project V2 board."
              />
              <StatusRow
                icon={ClipboardList}
                title="Get assigned to a task"
                description="Lime++ adds you to the project when a synced task is assigned to your GitHub user."
              />
              <StatusRow
                icon={GitPullRequest}
                title="Link work through pull requests"
                description="Scores appear after linked pull requests are merged. Kanban Done alone does not score."
              />
              <Button asChild variant="outline" className="gap-2">
                <Link href="/dashboard/my-contributions">
                  <RefreshCw className="h-4 w-4" /> Refresh Projects
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ContributorWorkspace({ data }: { data: MyContributions }) {
  const summaryCards = [
    { label: "Current Score", value: data.summary.totalScore, icon: Trophy },
    { label: "Done Tasks", value: data.summary.doneTasks, icon: CheckCircle2 },
    {
      label: "Merged PRs",
      value: data.summary.mergedPrs,
      icon: GitPullRequest,
    },
    {
      label: "Active Projects",
      value: data.summary.activeProjects,
      icon: FolderKanban,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            My Contributions
          </h1>
          <p className="text-muted-foreground">
            Evidence Lime++ has found for your GitHub work and scoring status.
          </p>
        </div>
        {data.projects.length === 1 && (
          <ReportDownloadButton
            projectId={data.projects[0].id}
            userId={data.user.id}
            type="individual"
            format="pdf"
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((item) => (
          <Card key={item.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
              <item.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.warnings.length > 0 && (
        <div className="rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-200">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" /> Needs Attention
          </div>
          <div className="space-y-1">
            {data.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          My Active Projects
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {data.projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block"
            >
              <Card className="transition-colors hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription>
                        {project.department} | {project.repository}
                      </CardDescription>
                    </div>
                    <StatusPill value={project.role.replace("_", " ")} />
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-4 gap-3 text-sm">
                  <Metric label="Tasks" value={project.taskCount} />
                  <Metric label="Done" value={project.doneTasks} />
                  <Metric label="Merged" value={project.mergedPrs} />
                  <Metric label="Score" value={project.totalScore} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          My Assigned Tasks
        </h2>
        <div className="overflow-hidden rounded-md border border-border">
          <TableHeader
            columns={["Task", "Project", "Status", "Linked PR", "Score Status"]}
          />
          {data.assignedTasks.length === 0 ? (
            <EmptyRow text="No assigned tasks found yet." />
          ) : (
            data.assignedTasks.slice(0, 8).map((task) => (
              <div
                key={task.id}
                className="grid gap-3 border-t border-border p-3 text-sm md:grid-cols-[1.2fr_1fr_0.7fr_0.8fr_1.4fr]"
              >
                <div className="min-w-0">
                  <p className="font-medium">{task.externalTaskId}</p>
                  <p className="truncate text-muted-foreground">{task.title}</p>
                </div>
                <Link
                  href={`/projects/${task.projectId}`}
                  className="text-primary hover:underline"
                >
                  {task.projectName}
                </Link>
                <StatusPill value={task.status} />
                <span>
                  {task.linkedPr ? `#${task.linkedPr.externalPrId}` : "No PR"}
                </span>
                <span className="text-muted-foreground">
                  {task.scoringStatus}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          My Pull Requests
        </h2>
        <div className="overflow-hidden rounded-md border border-border">
          <TableHeader columns={["PR", "Project", "Task", "Status"]} />
          {data.pullRequests.length === 0 ? (
            <EmptyRow text="No pull request evidence found yet." />
          ) : (
            data.pullRequests.slice(0, 8).map((pr) => (
              <div
                key={pr.id}
                className="grid gap-3 border-t border-border p-3 text-sm md:grid-cols-[1.4fr_1fr_0.8fr_0.7fr]"
              >
                <a
                  href={pr.url || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "min-w-0",
                    pr.url && "text-primary hover:underline",
                  )}
                >
                  #{pr.externalPrId} {pr.title}
                </a>
                <Link
                  href={`/projects/${pr.projectId}`}
                  className="text-primary hover:underline"
                >
                  {pr.projectName}
                </Link>
                <span>{pr.taskId || "Unlinked"}</span>
                <StatusPill value={pr.status} />
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function StatusRow({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FolderKanban;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  return (
    <span className="inline-flex w-fit items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
      {value}
    </span>
  );
}

function TableHeader({ columns }: { columns: string[] }) {
  return (
    <div
      className={cn(
        "hidden gap-3 bg-muted/60 p-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid",
        columns.length === 5
          ? "md:grid-cols-[1.2fr_1fr_0.7fr_0.8fr_1.4fr]"
          : "md:grid-cols-[1.4fr_1fr_0.8fr_0.7fr]",
      )}
    >
      {columns.map((column) => (
        <span key={column}>{column}</span>
      ))}
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="border-t border-border p-4 text-sm text-muted-foreground">
      {text}
    </div>
  );
}
