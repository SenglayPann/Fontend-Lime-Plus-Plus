import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  FolderKanban, 
  GitPullRequest, 
  Trophy,
  ArrowUpRight,
  TrendingUp
} from "lucide-react";

export default function DashboardPage() {
  const stats = [
    { name: "Active Students", value: "1,248", icon: Users, change: "+12%", color: "text-blue-600" },
    { name: "Ongoing Projects", value: "42", icon: FolderKanban, change: "+3", color: "text-primary" },
    { name: "Pull Requests", value: "8,942", icon: GitPullRequest, change: "+142", color: "text-purple-600" },
    { name: "Avg. Contribution", value: "84.2", icon: Trophy, change: "+5.4", color: "text-amber-500" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back, Senglay!</h1>
          <p className="text-muted-foreground mt-2">Here's an overview of the system's performance today.</p>
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
                  from last week
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
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <GitPullRequest className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">PR #142 Merged in Lime++ Backend</p>
                      <p className="text-xs text-muted-foreground">by Senglay Pann • 2 hours ago</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        +15 pts
                      </span>
                    </div>
                  </div>
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
              <button className="text-primary text-sm font-medium hover:underline flex items-center">
                View all <ArrowUpRight className="h-3 w-3 ml-1" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { name: "Computer Science", score: 94, color: "bg-primary" },
                  { name: "Information Technology", score: 82, color: "bg-blue-500" },
                  { name: "Data Science", score: 78, color: "bg-purple-500" },
                  { name: "Cyber Security", score: 65, color: "bg-amber-500" },
                ].map((dept) => (
                  <div key={dept.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{dept.name}</span>
                      <span className="text-muted-foreground">{dept.score}% Avg.</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full", dept.color)} style={{ width: `${dept.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

import { cn } from "@/lib/utils";
