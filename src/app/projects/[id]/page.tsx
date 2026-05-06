"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FolderKanban, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Github,
  Users,
  Trophy,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Settings,
  MoreVertical,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ContributionPieChart } from "@/components/charts/ContributionPieChart";
import { TeamPerformanceBar } from "@/components/charts/TeamPerformanceBar";

const contributionData = [
  { name: "PRs Merged", value: 420 },
  { name: "Tasks Completed", value: 300 },
  { name: "Reviews", value: 120 },
  { name: "Manual Adjustments", value: 45 },
];

const teamData = [
  { name: "Senglay Pann", score: 92 },
  { name: "John Doe", score: 84 },
  { name: "Jane Smith", score: 78 },
  { name: "Alex Johnson", score: 65 },
];

import { ReportDownloadButton } from "@/components/reports/ReportDownloadButton";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // Mock data
  const project = {
    id,
    name: "Lime++ Backend",
    description: "The core API engine for Lime++ project verification system.",
    org: "Engineering Faculty",
    dept: "Computer Science",
    status: "ACTIVE",
    githubRepo: "SenglayPann/Backend-Lime-Plus-Plus",
    createdAt: "2026-01-31",
    metrics: {
      totalTasks: 48,
      completedTasks: 32,
      totalPRs: 56,
      mergedPRs: 42,
      activeMembers: 5,
      avgContribution: 84
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Link href="/projects" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Projects
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{project.name}</h1>
              <span className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                project.status === "ACTIVE" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {project.status === "ACTIVE" ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                {project.status}
              </span>
            </div>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <ReportDownloadButton projectId={id} type="project" format="csv" />
            <ReportDownloadButton projectId={id} type="project" format="pdf" />
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" /> Sync Kanban
            </Button>
            <Button variant="outline" className="gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200">
              <Lock className="h-4 w-4" /> Lock Project
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Completion Rate", value: "67%", icon: CheckCircle2, color: "text-primary" },
            { label: "Active Members", value: project.metrics.activeMembers, icon: Users, color: "text-blue-600" },
            { label: "PR Acceptance", value: "75%", icon: Github, color: "text-purple-600" },
            { label: "Avg. Score", value: project.metrics.avgContribution, icon: Trophy, color: "text-amber-500" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={cn("h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center", stat.color)}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Details Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Contribution Mix</CardTitle>
              <CardDescription>Breakdown of points awarded by activity type.</CardDescription>
            </CardHeader>
            <CardContent>
              <ContributionPieChart data={contributionData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Leaderboard</CardTitle>
              <CardDescription>Individual contribution scores comparison.</CardDescription>
            </CardHeader>
            <CardContent>
              <TeamPerformanceBar data={teamData} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Project Roadmap</CardTitle>
                <CardDescription>Task completion status over time.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-lg border border-dashed border-border text-muted-foreground text-sm">
                Activity Timeline Visualization (Recharts)
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
                  <p className="text-sm font-medium truncate">{project.githubRepo}</p>
                  <p className="text-xs text-muted-foreground">Main Branch: main</p>
                </div>
                <Button variant="ghost" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created On</span>
                  <span className="font-medium">{project.createdAt}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total PRs</span>
                  <span className="font-medium">{project.metrics.totalPRs}</span>
                </div>
              </div>

              <Button className="w-full gap-2" variant="outline">
                <Github className="h-4 w-4" /> View on GitHub
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
