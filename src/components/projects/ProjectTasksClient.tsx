"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  ExternalLink,
  FileText,
  Filter,
  GitPullRequest,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useProjectLiveUpdates } from "@/hooks/use-project-live-updates";
import { LiveStatusBadge } from "./LiveStatusBadge";

type TaskDifficulty = "LOW" | "MEDIUM" | "HIGH";

type Task = {
  id: string;
  externalTaskId?: string | null;
  title: string;
  description?: string | null;
  status: string;
  difficulty?: TaskDifficulty | null;
  dueDate?: string | null;
  assigneeId?: string | null;
  assignee?: {
    id?: string | null;
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

type ProjectMember = {
  userId: string;
  user?: {
    id?: string | null;
    name?: string | null;
    githubUsername?: string | null;
    email?: string | null;
  } | null;
};

interface ProjectTasksClientProps {
  projectId: string;
  accessToken: string;
  repository?: string | null;
  initialTasks: Task[];
  projectMembers?: ProjectMember[];
  canSync: boolean;
  canAssignTasks?: boolean;
  isProjectWide: boolean;
  isLocked?: boolean;
}

function prUrl(repository: string | null | undefined, task: Task) {
  const pr = task.pullRequests?.[0];
  if (!pr) return null;
  if (pr.url) return pr.url;
  if (!repository || !pr.externalPrId) return null;
  const prNumber = pr.externalPrId.replace(/^#/, "");
  return `https://github.com/${repository}/pull/${prNumber}`;
}

function displayMember(member: ProjectMember) {
  return (
    member.user?.name ||
    member.user?.githubUsername ||
    member.user?.email ||
    member.userId
  );
}

export function ProjectTasksClient({
  projectId,
  accessToken,
  repository,
  initialTasks,
  projectMembers = [],
  canSync,
  canAssignTasks = canSync,
  isProjectWide,
  isLocked = false,
}: ProjectTasksClientProps) {
  const router = useRouter();
  const liveStatus = useProjectLiveUpdates(projectId, accessToken);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingAssignmentId, setPendingAssignmentId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [syncSummary, setSyncSummary] = useState<SyncSummary | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  function toggleExpanded(taskId: string) {
    setExpandedTaskId((current) => (current === taskId ? null : taskId));
  }

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
    if (isLocked) {
      const message = "Cannot sync tasks after project lock";
      setError(message);
      toast.error(message);
      return;
    }

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

      const summary = json.success ? json.data : json;
      setSyncSummary(summary);
      toast.success(
        `Synced ${summary.syncedCount ?? 0} of ${summary.totalItemsSeen ?? 0} item(s) from GitHub`,
      );
      router.refresh();
    } catch (err: any) {
      const message = err.message || "Failed to sync tasks";
      setError(message);
      toast.error(message);
    } finally {
      setIsSyncing(false);
    }
  }

  async function patchTaskFields(
    taskId: string,
    fields: { difficulty?: TaskDifficulty; due_date?: string | null },
  ) {
    if (isLocked) return;
    setPendingAssignmentId(taskId);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fields),
        },
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          json?.error?.message || json?.message || "Failed to update task",
        );
      }
      toast.success("Task updated");
      router.refresh();
    } catch (err: any) {
      const message = err.message || "Failed to update task";
      setError(message);
      toast.error(message);
    } finally {
      setPendingAssignmentId(null);
    }
  }

  async function assignTask(taskId: string, assigneeId: string) {
    if (!assigneeId || isLocked) return;

    setPendingAssignmentId(taskId);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}/assign`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ assignee_id: assigneeId }),
        },
      );
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          json?.error?.message || json?.message || "Failed to assign task",
        );
      }

      toast.success("Assignee updated");
      router.refresh();
    } catch (err: any) {
      const message = err.message || "Failed to assign task";
      setError(message);
      toast.error(message);
    } finally {
      setPendingAssignmentId(null);
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
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {isProjectWide ? "Project Tasks" : "My Tasks"}
            </h1>
            <LiveStatusBadge status={liveStatus} />
          </div>
          <p className="text-muted-foreground">
            {isProjectWide
              ? "Task-to-PR linkage and completion status. Updates arrive automatically from GitHub."
              : "Assigned tasks and linked pull request evidence."}
          </p>
        </div>
        {canSync && (
          <div className="flex flex-col items-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  disabled={isSyncing}
                  aria-label="Project actions"
                  title="Webhooks already keep this board up to date. Use the menu if something looks out of date."
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreHorizontal className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Project actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 cursor-pointer"
                  onClick={syncTasks}
                  disabled={isSyncing || isLocked}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {isLocked ? "Sync locked" : "Reconcile from GitHub"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                  <th className="w-10 px-3 py-4" aria-label="Expand row" />
                  <th className="px-6 py-4">Task ID</th>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Difficulty</th>
                  <th className="px-6 py-4">Due</th>
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
                      colSpan={9}
                    >
                      No tasks match the current search or filter.
                    </td>
                  </tr>
                )}
                {tasks.map((task) => {
                  const primaryPr = task.pullRequests?.[0];
                  const url = prUrl(repository, task);
                  const canEditAssignee =
                    canAssignTasks && !isLocked && projectMembers.length > 0;
                  const assigneeId = task.assigneeId || task.assignee?.id || "";
                  const assignee =
                    task.assignee?.name ||
                    task.assignee?.githubUsername ||
                    task.assignee?.email ||
                    "Unassigned";
                  const hasDescription = Boolean(task.description?.trim());
                  const isExpanded = expandedTaskId === task.id;

                  return (
                    <Fragment key={task.id}>
                    <tr
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      <td className="w-10 px-3 py-4 align-top">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(task.id)}
                          disabled={!hasDescription}
                          aria-label={
                            hasDescription
                              ? isExpanded
                                ? `Hide description for ${task.title}`
                                : `Show description for ${task.title}`
                              : "No description"
                          }
                          aria-expanded={isExpanded}
                          title={
                            hasDescription
                              ? "Show issue description"
                              : "No description"
                          }
                          className={cn(
                            "inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors",
                            hasDescription
                              ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                              : "text-muted-foreground/30 cursor-not-allowed",
                          )}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </td>
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
                              ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400"
                              : task.status === "IN_PROGRESS"
                                ? "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
                                : task.status === "BLOCKED"
                                  ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400"
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
                      <td className="px-6 py-4">
                        {canEditAssignee ? (
                          <select
                            value={task.difficulty || "MEDIUM"}
                            onChange={(event) =>
                              patchTaskFields(task.id, {
                                difficulty: event.target
                                  .value as TaskDifficulty,
                              })
                            }
                            disabled={pendingAssignmentId !== null}
                            className="h-9 rounded-md border border-input bg-background px-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                            aria-label={`Set difficulty for ${task.title}`}
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                          </select>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {task.difficulty || "MEDIUM"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {canEditAssignee ? (
                          <input
                            type="date"
                            value={
                              task.dueDate
                                ? new Date(task.dueDate)
                                    .toISOString()
                                    .slice(0, 10)
                                : ""
                            }
                            onChange={(event) =>
                              patchTaskFields(task.id, {
                                due_date: event.target.value || null,
                              })
                            }
                            disabled={pendingAssignmentId !== null}
                            className="h-9 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                            aria-label={`Set due date for ${task.title}`}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {task.dueDate
                              ? new Date(task.dueDate)
                                  .toISOString()
                                  .slice(0, 10)
                              : "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {canEditAssignee ? (
                          <select
                            value={assigneeId}
                            onChange={(event) =>
                              assignTask(task.id, event.target.value)
                            }
                            disabled={pendingAssignmentId !== null}
                            className="h-9 max-w-56 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                            aria-label={`Assign ${task.title}`}
                          >
                            <option value="" disabled>
                              Unassigned
                            </option>
                            {projectMembers.map((member) => (
                              <option key={member.userId} value={member.userId}>
                                {displayMember(member)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          assignee
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {primaryPr ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                primaryPr.status === "MERGED"
                                  ? "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 ring-purple-700/10"
                                  : primaryPr.status === "OPEN"
                                    ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 ring-green-700/10"
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
                          <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center italic">
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
                    {isExpanded && hasDescription && (
                      <tr className="bg-muted/20">
                        <td className="w-10 px-3 py-4 align-top" />
                        <td colSpan={8} className="px-6 py-4">
                          <div className="flex items-start gap-2 text-sm text-foreground/90">
                            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            <p className="whitespace-pre-wrap break-words leading-relaxed">
                              {task.description}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
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
