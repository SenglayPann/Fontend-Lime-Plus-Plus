"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Lock, MoreHorizontal, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjectLiveUpdates } from "@/hooks/use-project-live-updates";
import { LiveStatusBadge } from "./LiveStatusBadge";

interface ProjectActionsProps {
  projectId: string;
  accessToken: string;
  isLocked?: boolean;
  canLockProject?: boolean;
}

export function ProjectActions({
  projectId,
  accessToken,
  isLocked = false,
  canLockProject = false,
}: ProjectActionsProps) {
  const router = useRouter();
  const liveStatus = useProjectLiveUpdates(projectId, accessToken);
  const [pendingAction, setPendingAction] = useState<"sync" | "lock" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);

  async function runAction(action: "sync" | "lock") {
    if (isLocked) {
      const message = "Cannot sync or lock after project lock";
      setError(message);
      toast.error(message);
      return;
    }

    setPendingAction(action);
    setError(null);

    try {
      const endpoint =
        action === "sync"
          ? `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/tasks/sync`
          : `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/lock`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error?.message || json.message || `Failed to ${action} project`,
        );
      }

      if (action === "lock") {
        setIsLockDialogOpen(false);
        toast.success("Project locked. Scoring is frozen.");
      } else {
        const summary = json.success ? json.data : json;
        toast.success(
          `Synced ${summary?.syncedCount ?? 0} of ${summary?.totalItemsSeen ?? 0} item(s) from GitHub`,
        );
      }
      router.refresh();
    } catch (err: any) {
      const message = err.message || "Project action failed";
      setError(message);
      toast.error(message);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-3">
        <LiveStatusBadge status={liveStatus} />
        {canLockProject && (
          <Button
            variant="outline"
            className="gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200 disabled:opacity-60"
            onClick={() => setIsLockDialogOpen(true)}
            disabled={pendingAction !== null || isLocked}
          >
            {pendingAction === "lock" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            {isLocked ? "Project Locked" : "Lock Project"}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              disabled={pendingAction === "sync"}
              aria-label="Project actions"
              title="Webhooks already keep this project up to date. Use the menu if something looks out of date."
            >
              {pendingAction === "sync" ? (
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
              onClick={() => runAction("sync")}
              disabled={pendingAction !== null || isLocked}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {isLocked ? "Sync locked" : "Reconcile from GitHub"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {error && (
        <p className="max-w-md text-right text-xs font-medium text-destructive">
          {error}
        </p>
      )}

      <Dialog open={isLockDialogOpen} onOpenChange={setIsLockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock project?</DialogTitle>
            <DialogDescription>
              Locking freezes scoring for this project and blocks further
              score-changing workflow events.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLockDialogOpen(false)}
              disabled={pendingAction === "lock"}
            >
              Cancel
            </Button>
            <Button
              className="gap-2 bg-amber-600 text-white hover:bg-amber-700"
              onClick={() => runAction("lock")}
              disabled={pendingAction === "lock"}
            >
              {pendingAction === "lock" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Lock Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
