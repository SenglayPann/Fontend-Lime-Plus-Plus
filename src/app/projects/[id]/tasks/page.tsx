"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Circle, 
  GitPullRequest, 
  ExternalLink, 
  Search,
  Filter,
  ArrowLeft,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ProjectTasksPage() {
  const params = useParams();
  const id = params.id as string;

  const tasks = [
    { id: "TASK-101", title: "Implement User Authentication", status: "DONE", assignee: "Senglay Pann", pr: "#42", prStatus: "MERGED" },
    { id: "TASK-102", title: "Setup Database Schema", status: "DONE", assignee: "John Doe", pr: "#38", prStatus: "MERGED" },
    { id: "TASK-103", title: "Create API Endpoints for Organizations", status: "IN_PROGRESS", assignee: "Jane Smith", pr: "#45", prStatus: "OPEN" },
    { id: "TASK-104", title: "Implement Scoring Algorithm", status: "TODO", assignee: "Alex Johnson", pr: null, prStatus: null },
    { id: "TASK-105", title: "Fix Webhook Payload Parsing", status: "IN_PROGRESS", assignee: "Senglay Pann", pr: "#48", prStatus: "DRAFT" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Link href={`/projects/${id}`} className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Overview
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Project Tasks</h1>
            <p className="text-muted-foreground">Detailed view of task-to-PR linkage and completion status.</p>
          </div>
          <Button className="gap-2">
            <Search className="h-4 w-4" /> Sync Kanban
          </Button>
        </div>

        <Card>
          <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tasks by ID, title, or assignee..."
                  className="h-9 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" /> Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border">
                  <tr>
                    <th className="px-6 py-4">Task ID</th>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Assignee</th>
                    <th className="px-6 py-4">Linked PR</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-6 py-4 font-mono font-medium text-primary">{task.id}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{task.title}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          task.status === "DONE" ? "bg-green-100 text-green-700" : 
                          task.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"
                        )}>
                          {task.status === "DONE" ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                          {task.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{task.assignee}</td>
                      <td className="px-6 py-4">
                        {task.pr ? (
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                              task.prStatus === "MERGED" ? "bg-purple-50 text-purple-700 ring-purple-700/10" : 
                              task.prStatus === "OPEN" ? "bg-green-50 text-green-700 ring-green-700/10" : "bg-gray-50 text-gray-600 ring-gray-500/10"
                            )}>
                              <GitPullRequest className="h-3 w-3 mr-1" /> {task.pr}
                            </span>
                            <span className="text-[10px] uppercase text-muted-foreground font-bold">{task.prStatus}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 flex items-center italic">
                            <AlertCircle className="h-3 w-3 mr-1" /> Unlinked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
