import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Scores and counts update as webhooks land; bypass the Router Cache.
export const dynamic = "force-dynamic";
import {
  Users,
  FolderKanban,
  GitPullRequest,
  Trophy,
  ArrowUpRight,
} from "lucide-react";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { fetchServerApi } from "@/lib/server-api";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const roles = session?.user?.roles || [];
  const scopes = session?.user?.scopes;
  const hasManagementScope =
    roles.includes("ADMIN") ||
    (scopes?.organizations || []).some(
      (scope) => scope.role === "ORGANIZATION_MANAGER",
    ) ||
    (scopes?.departments || []).some(
      (scope) => scope.role === "DEPARTMENT_MANAGER",
    ) ||
    (scopes?.projects || []).some((scope) => scope.role === "PROJECT_MANAGER");

  if (session && !hasManagementScope) {
    redirect("/dashboard/my-contributions");
  }

  let statsData = {
    activeStudents: 0,
    ongoingProjects: 0,
    pullRequests: 0,
    avgContribution: 0,
  };
  let recentActivity: any[] = [];
  let topDepartments: any[] = [];
  let loadErrors: string[] = [];

  if (session?.user?.accessToken) {
    const [statsResult, activityResult, departmentsResult] = await Promise.all([
      fetchServerApi<typeof statsData | null>(
        "/dashboard/stats",
        session.user.accessToken,
        null,
      ),
      fetchServerApi<any[]>("/dashboard/activity", session.user.accessToken, []),
      fetchServerApi<any[]>(
        "/dashboard/departments",
        session.user.accessToken,
        [],
      ),
    ]);

    if (statsResult.data) statsData = statsResult.data;
    recentActivity = activityResult.data;
    topDepartments = departmentsResult.data;
    loadErrors = [
      statsResult.error,
      activityResult.error,
      departmentsResult.error,
    ].filter((error): error is string => Boolean(error));
  }

  const stats = [
    {
      name: "Active Students",
      value: (statsData?.activeStudents ?? 0).toString(),
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      name: "Ongoing Projects",
      value: (statsData?.ongoingProjects ?? 0).toString(),
      icon: FolderKanban,
      color: "text-primary",
    },
    {
      name: "Pull Requests",
      value: (statsData?.pullRequests ?? 0).toString(),
      icon: GitPullRequest,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      name: "Avg. Contribution",
      value: (statsData?.avgContribution ?? 0).toString(),
      icon: Trophy,
      color: "text-amber-500",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome back, {session?.user?.name || "User"}!
            </h1>
            <p className="text-muted-foreground mt-2">
              Here&apos;s the latest activity from the projects you can access.
            </p>
          </div>
        </div>

        {loadErrors.length > 0 && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-300">
            {loadErrors.join(" ")}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest contributions within your current access scope.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No recent activity.
                  </p>
                )}
                {recentActivity.map((activity) => (
                  <Link
                    href={`/projects/${activity.projectId}`}
                    key={activity.id}
                    className="block"
                  >
                    <div className="flex items-center gap-4 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <GitPullRequest className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.title} in {activity.projectName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          by {activity.authorName} •{" "}
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            activity.score > 0
                              ? "bg-primary/10 text-primary"
                              : activity.score < 0
                                ? "bg-destructive/10 text-destructive"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {activity.score > 0 ? "+" : ""}
                          {activity.score} pts
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top Departments</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Department performance from visible project data.
                </p>
              </div>
              <Link
                href="/departments"
                className="text-primary text-sm font-medium hover:underline flex items-center"
              >
                View all <ArrowUpRight className="h-3 w-3 ml-1" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {topDepartments.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No department data available.
                  </p>
                )}
                {(() => {
                  const maxScore = topDepartments.reduce(
                    (max, dept) => Math.max(max, Number(dept.avgScore) || 0),
                    0,
                  );
                  const colors = [
                    "bg-primary",
                    "bg-blue-500",
                    "bg-purple-500",
                    "bg-amber-500",
                  ];
                  return topDepartments.map((dept, idx) => {
                    const color = colors[idx % colors.length];
                    const score = Number(dept.avgScore) || 0;
                    const widthPct =
                      maxScore > 0 ? (score / maxScore) * 100 : 0;
                    return (
                      <div key={dept.name} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{dept.name}</span>
                          <span className="text-muted-foreground">
                            {score} avg
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", color)}
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
