"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [pendingAction, setPendingAction] = useState<"sync" | "lock" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);

  async function runAction(action: "sync" | "lock") {
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
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Project action failed");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => runAction("sync")}
          disabled={pendingAction !== null}
        >
          {pendingAction === "sync" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Sync Kanban
        </Button>
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
