"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityLineChart } from "@/components/charts/ActivityLineChart";
import { ContributionPieChart } from "@/components/charts/ContributionPieChart";
import { 
  Trophy, 
  Target, 
  Zap, 
  GitPullRequest, 
  CheckCircle2,
  Calendar,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const activityData = [
  { date: "Jan 01", points: 20 },
  { date: "Jan 05", points: 45 },
  { date: "Jan 10", points: 30 },
  { date: "Jan 15", points: 80 },
  { date: "Jan 20", points: 65 },
  { date: "Jan 25", points: 120 },
  { date: "Jan 30", points: 95 },
];

const mixData = [
  { name: "Code Merges", value: 65 },
  { name: "Documentation", value: 15 },
  { name: "Testing", value: 10 },
  { name: "Reviews", value: 10 },
];

import { ReportDownloadButton } from "@/components/reports/ReportDownloadButton";

export default function MyContributionsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">My Contributions</h1>
            <p className="text-muted-foreground mt-2">Personal performance breakdown and activity trends.</p>
          </div>
          <ReportDownloadButton projectId="ANY" userId="ME" type="individual" format="pdf" />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1 bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-lg">Total Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold">1,482</div>
              <p className="text-sm mt-2 opacity-80 flex items-center">
                <Trophy className="h-4 w-4 mr-1" /> Top 5% of class
              </p>
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>Progress to Next Rank</span>
                  <span>85%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
                  <div className="h-full bg-white w-[85%]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Points earned over the last 30 days.</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityLineChart data={activityData} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Contribution Mix</CardTitle>
              <CardDescription>Distribution of your impact across categories.</CardDescription>
            </CardHeader>
            <CardContent>
              <ContributionPieChart data={mixData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Milestones</CardTitle>
              <CardDescription>Key achievements and major contributions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { title: "First Feature Merge", date: "Jan 12", icon: Zap, color: "text-amber-500" },
                  { title: "Task Chain Completed", date: "Jan 18", icon: Target, color: "text-primary" },
                  { title: "10 Code Reviews Done", date: "Jan 22", icon: CheckCircle2, color: "text-blue-500" },
                  { title: "Mega PR #42 Merged", date: "Jan 28", icon: GitPullRequest, color: "text-purple-500" },
                ].map((m) => (
                  <div key={m.title} className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
                    <div className={cn("h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center", m.color)}>
                      <m.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{m.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Calendar className="h-3 w-3 mr-1" /> {m.date}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
