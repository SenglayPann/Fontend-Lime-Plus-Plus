import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { 
  Users, 
  FolderKanban, 
  GitPullRequest, 
  Trophy,
  ArrowUpRight,
  TrendingUp,
  Bell
} from "lucide-react";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";


async function fetchStats(token: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (error) {
    console.error("Error fetching stats:", error);
    return null;
  }
}

async function fetchActivity(token: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/activity`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (error) {
    console.error("Error fetching activity:", error);
    return [];
  }
}

async function fetchDepartments(token: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/departments`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (error) {
    console.error("Error fetching departments:", error);
    return [];
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  let statsData = {
    activeStudents: 0,
    ongoingProjects: 0,
    pullRequests: 0,
    avgContribution: 0,
  };
  let recentActivity: any[] = [];
  let topDepartments: any[] = [];

  if (session?.user?.accessToken) {
    const fetchedStats = await fetchStats(session.user.accessToken);
    if (fetchedStats) statsData = fetchedStats;
    recentActivity = await fetchActivity(session.user.accessToken);
    topDepartments = await fetchDepartments(session.user.accessToken);
  }

  const stats = [
    { name: "Active Students", value: (statsData?.activeStudents ?? 0).toString(), icon: Users, change: "Live", color: "text-blue-600" },
    { name: "Ongoing Projects", value: (statsData?.ongoingProjects ?? 0).toString(), icon: FolderKanban, change: "Live", color: "text-primary" },
    { name: "Pull Requests", value: (statsData?.pullRequests ?? 0).toString(), icon: GitPullRequest, change: "Live", color: "text-purple-600" },
    { name: "Avg. Contribution", value: (statsData?.avgContribution ?? 0).toString(), icon: Trophy, change: "Live", color: "text-amber-500" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back, {session?.user?.name || 'User'}!</h1>
            <p className="text-muted-foreground mt-2">Here's an overview of the system's performance today.</p>
          </div>
          <Link href="#" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2">
            <Bell className="h-4 w-4" /> View All Notifications
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1 text-primary" />
                  <span className="text-primary font-medium mr-1">{stat.change}</span> 
                  from database
                </p>
              </CardContent>
              <div className="h-1 bg-muted">
                <div className="h-full bg-primary w-2/3" />
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <p className="text-sm text-muted-foreground">Latest contributions across all projects.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 && <p className="text-sm text-muted-foreground">No recent activity.</p>}
                {recentActivity.map((activity) => (
                  <Link href={`/projects/${activity.projectId}`} key={activity.id} className="block">
                    <div className="flex items-center gap-4 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <GitPullRequest className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.title} in {activity.projectName}</p>
                        <p className="text-xs text-muted-foreground">by {activity.authorName} • {new Date(activity.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          +{activity.score} pts
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
                <p className="text-sm text-muted-foreground">Performance by faculty.</p>
              </div>
              <Link href="/departments" className="text-primary text-sm font-medium hover:underline flex items-center">
                View all <ArrowUpRight className="h-3 w-3 ml-1" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {topDepartments.length === 0 && <p className="text-sm text-muted-foreground">No department data available.</p>}
                {topDepartments.map((dept, idx) => {
                  const colors = ["bg-primary", "bg-blue-500", "bg-purple-500", "bg-amber-500"];
                  const color = colors[idx % colors.length];
                  return (
                  <div key={dept.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{dept.name}</span>
                      <span className="text-muted-foreground">{dept.avgScore}% Avg.</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(dept.avgScore, 100)}%` }} />
                    </div>
                  </div>
                )})}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

import { cn } from "@/lib/utils";import { Button } from "@/components/ui/button";

