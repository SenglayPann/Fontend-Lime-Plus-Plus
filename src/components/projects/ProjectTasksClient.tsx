"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  ExternalLink,
  Filter,
  GitPullRequest,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  externalTaskId?: string | null;
  title: string;
  status: string;
  assignee?: {
    name?: string | null;
    githubUsername?: string | null;
    email?: string | null;
  } | null;
  pullRequests?: Array<{
    externalPrId?: string | null;
    status?: string | null;
    url?: string | null;
  }>;
};

type SyncSummary = {
  syncedCount?: number;
  totalItemsSeen?: number;
  tasksCreated?: number;
  tasksUpdated?: number;
  skippedDrafts?: number;
  skippedUnassigned?: number;
  unassignedTasks?: number;
  membersAutoAdded?: number;
  warnings?: string[];
};

interface ProjectTasksClientProps {
  projectId: string;
  accessToken: string;
  repository?: string | null;
  initialTasks: Task[];
  canSync: boolean;
  isProjectWide: boolean;
}

function prUrl(repository: string | null | undefined, task: Task) {
  const pr = task.pullRequests?.[0];
  if (!pr) return null;
  if (pr.url) return pr.url;
  if (!repository || !pr.externalPrId) return null;
  const prNumber = pr.externalPrId.replace(/^#/, "");
  return `https://github.com/${repository}/pull/${prNumber}`;
}

export function ProjectTasksClient({
  projectId,
  accessToken,
  repository,
  initialTasks,
  canSync,
  isProjectWide,
}: ProjectTasksClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncSummary, setSyncSummary] = useState<SyncSummary | null>(null);

  const tasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return initialTasks.filter((task) => {
      const assignee =
        task.assignee?.name ||
        task.assignee?.githubUsername ||
        task.assignee?.email ||
        "";
      const matchesQuery =
        !normalizedQuery ||
        task.title.toLowerCase().includes(normalizedQuery) ||
        (task.externalTaskId || task.id)
          .toLowerCase()
          .includes(normalizedQuery) ||
        assignee.toLowerCase().includes(normalizedQuery);

      const matchesStatus = status === "ALL" || task.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [initialTasks, query, status]);

  async function syncTasks() {
    setIsSyncing(true);
    setError(null);
    setSyncSummary(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/tasks/sync`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error?.message || json.message || "Failed to sync tasks",
        );
      }

      setSyncSummary(json.success ? json.data : json);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sync tasks");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link
            href={`/projects/${projectId}`}
            className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Back to Overview
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {isProjectWide ? "Project Tasks" : "My Tasks"}
          </h1>
          <p className="text-muted-foreground">
            {isProjectWide
              ? "Task-to-PR linkage and completion status."
              : "Assigned tasks and linked pull request evidence."}
          </p>
        </div>
        {canSync && (
          <div className="flex flex-col items-end gap-2">
            <Button className="gap-2" onClick={syncTasks} disabled={isSyncing}>
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync Kanban
            </Button>
            {error && (
              <p className="max-w-md text-right text-xs font-medium text-destructive">
                {error}
              </p>
            )}
            {syncSummary && !error && (
              <p className="max-w-md text-right text-xs text-muted-foreground">
                {syncSummary.syncedCount ?? 0} synced from{" "}
                {syncSummary.totalItemsSeen ?? 0} item(s)
                {typeof syncSummary.unassignedTasks === "number" &&
                syncSummary.unassignedTasks > 0
                  ? `, ${syncSummary.unassignedTasks} unassigned imported`
                  : ""}
              </p>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tasks by ID, title, or assignee..."
                className="h-9 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Filter tasks by status"
              >
                <option value="ALL">All statuses</option>
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
                <option value="BLOCKED">Blocked</option>
              </select>
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
                {tasks.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-8 text-center text-muted-foreground"
                      colSpan={6}
                    >
                      No tasks match the current search or filter.
                    </td>
                  </tr>
                )}
                {tasks.map((task) => {
                  const primaryPr = task.pullRequests?.[0];
                  const url = prUrl(repository, task);
                  const assignee =
                    task.assignee?.name ||
                    task.assignee?.githubUsername ||
                    task.assignee?.email ||
                    "Unassigned";

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      <td className="px-6 py-4 font-mono font-medium text-primary">
                        {task.externalTaskId || task.id}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {task.title}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                            task.status === "DONE"
                              ? "bg-green-100 text-green-700"
                              : task.status === "IN_PROGRESS"
                                ? "bg-blue-100 text-blue-700"
                                : task.status === "BLOCKED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-muted text-muted-foreground",
                          )}
                        >
                          {task.status === "DONE" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Circle className="h-3 w-3" />
                          )}
                          {task.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {assignee}
                      </td>
                      <td className="px-6 py-4">
                        {primaryPr ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                primaryPr.status === "MERGED"
                                  ? "bg-purple-50 text-purple-700 ring-purple-700/10"
                                  : primaryPr.status === "OPEN"
                                    ? "bg-green-50 text-green-700 ring-green-700/10"
                                    : "bg-gray-50 text-gray-600 ring-gray-500/10",
                              )}
                            >
                              <GitPullRequest className="h-3 w-3 mr-1" />
                              {primaryPr.externalPrId || "PR"}
                            </span>
                            <span className="text-[10px] uppercase text-muted-foreground font-bold">
                              {primaryPr.status || "UNKNOWN"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 flex items-center italic">
                            <AlertCircle className="h-3 w-3 mr-1" /> Unlinked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {url ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                          >
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              aria-label="Open pull request"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled
                            aria-label="No pull request link"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
