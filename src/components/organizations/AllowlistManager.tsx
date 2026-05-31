"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type AllowlistStatus = "PENDING" | "APPROVED" | "REJECTED";

type AllowlistEntry = {
  id: string;
  type: "EMAIL" | "DOMAIN" | "GITHUB_USERNAME";
  value: string;
  status: AllowlistStatus;
  autoCreated: boolean;
  createdAt: string;
  addedBy: { name: string; email: string } | null;
  claimedByUser: { name: string; email: string } | null;
};

interface AllowlistManagerProps {
  organizationId: string;
  accessToken: string;
}

export function AllowlistManager({ organizationId, accessToken }: AllowlistManagerProps) {
  const [entries, setEntries] = useState<AllowlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inputType, setInputType] = useState<"MANUAL" | "CSV">("MANUAL");
  const [manualInput, setManualInput] = useState("");
  const [csvContent, setCsvContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AllowlistEntry | null>(null);
  const [revokeMembership, setRevokeMembership] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AllowlistEntry | null>(
    null,
  );

  async function approve(entry: AllowlistEntry) {
    setPendingActionId(entry.id);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/allowlist/${entry.id}/approve`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.message || "Failed to approve");
      }
      const credits = json?.data?.retroCredits ?? json?.retroCredits ?? 0;
      toast.success(
        credits > 0
          ? `Approved ${entry.value}. Retroactively credited ${credits} PR(s).`
          : `Approved ${entry.value}.`,
      );
      await fetchEntries();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve");
    } finally {
      setPendingActionId(null);
    }
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    const entry = rejectTarget;
    setPendingActionId(entry.id);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/allowlist/${entry.id}/reject`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.message || "Failed to reject");
      }
      const rolesStripped =
        json?.data?.rolesStripped ?? json?.rolesStripped ?? 0;
      const projectsStripped =
        json?.data?.projectsStripped ?? json?.projectsStripped ?? 0;
      const cascadeBits: string[] = [];
      if (rolesStripped > 0) cascadeBits.push(`${rolesStripped} role(s)`);
      if (projectsStripped > 0)
        cascadeBits.push(`${projectsStripped} project membership(s)`);
      const summary = cascadeBits.length
        ? ` Also removed: ${cascadeBits.join(", ")}.`
        : "";
      toast.success(`Rejected ${entry.value}.${summary}`);
      setRejectTarget(null);
      await fetchEntries();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject");
    } finally {
      setPendingActionId(null);
    }
  }

  useEffect(() => {
    fetchEntries();
  }, [organizationId]);

  async function fetchEntries() {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/allowlist`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch allowlist");
      const json = await res.json();
      setEntries(json.data || json);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manualInput.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      // Split by comma, space or newline and map to type detection
      const values = manualInput.split(/[\s,]+/).filter(Boolean);
      const newEntries = values.map(value => ({
        value,
        type: detectType(value),
      }));

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/allowlist`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ entries: newEntries }),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to add entries");
      
      setManualInput("");
      await fetchEntries();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddCsv(e: React.FormEvent) {
    e.preventDefault();
    if (!csvContent.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/allowlist/csv`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ csv: csvContent }),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to add entries");
      
      setCsvContent("");
      setInputType("MANUAL");
      await fetchEntries();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function requestDelete(entry: AllowlistEntry) {
    setDeleteTarget(entry);
    setRevokeMembership(false);
    setError(null);
  }

  function closeDeleteDialog() {
    if (deleting) return;
    setDeleteTarget(null);
    setRevokeMembership(false);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);

    try {
      const query = revokeMembership ? "?revokeMembership=true" : "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/allowlist/${deleteTarget.id}${query}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || "Failed to delete");
      }
      const removedId = deleteTarget.id;
      setEntries(curr => curr.filter(e => e.id !== removedId));
      setDeleteTarget(null);
      setRevokeMembership(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  function detectType(value: string) {
    if (value.startsWith("@") || (value.includes(".") && !value.includes("@"))) {
      if (value.startsWith("@")) return "DOMAIN";
    }
    if (value.includes("@")) return "EMAIL";
    return "GITHUB_USERNAME";
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Add New Entries Section */}
      <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Add to Allowlist</h3>
          <div className="flex gap-2">
            <Button 
              variant={inputType === "MANUAL" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setInputType("MANUAL")}
            >
              Manual
            </Button>
            <Button 
              variant={inputType === "CSV" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setInputType("CSV")}
            >
              CSV/Bulk
            </Button>
          </div>
        </div>

        {inputType === "MANUAL" ? (
          <form onSubmit={handleAddManual} className="flex gap-3">
            <Input
              placeholder="Emails, domains (@acme.com), or GitHub usernames..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!manualInput.trim() || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add
            </Button>
          </form>
        ) : (
          <form onSubmit={handleAddCsv} className="space-y-3">
            <Textarea
              placeholder="Paste CSV content or list of entries (one per line)..."
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="min-h-[100px] font-mono text-sm"
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={!csvContent.trim() || submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Import List
              </Button>
            </div>
          </form>
        )}
      </div>

      {(() => {
        if (loading) {
          return (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          );
        }
        const pending = entries.filter((e) => e.status === "PENDING");
        const reviewed = entries.filter((e) => e.status !== "PENDING");
        return (
          <>
            {/* Pending approvals (queue of unverified contributors) */}
            {pending.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-amber-700 dark:text-amber-400">
                  Pending approvals ({pending.length})
                </h3>
                <p className="text-xs text-muted-foreground">
                  These contributors opened PRs on this org's projects but
                  aren't on the allowlist yet. Until you approve them, any
                  merged PRs they author won't earn scoring credit.
                </p>
                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 divide-y divide-amber-500/20">
                  {pending.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-3 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium font-mono text-sm truncate">
                            {entry.value}
                          </span>
                          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded uppercase">
                            {entry.type.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Auto-added · pending org approval
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10"
                          onClick={() => approve(entry)}
                          disabled={pendingActionId === entry.id}
                        >
                          {pendingActionId === entry.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-destructive border-destructive/40 hover:bg-destructive/10"
                          onClick={() => setRejectTarget(entry)}
                          disabled={pendingActionId === entry.id}
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviewed entries (approved + rejected) */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">
                Allowlist ({reviewed.length})
              </h3>
              {reviewed.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No approved or rejected entries yet. Add emails, domains,
                  or GitHub usernames above to pre-approve users.
                </div>
              ) : (
                <div className="rounded-md border max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground sticky top-0">
                      <tr>
                        <th className="px-4 py-2 font-medium">Value</th>
                        <th className="px-4 py-2 font-medium">Type</th>
                        <th className="px-4 py-2 font-medium">Status</th>
                        <th className="px-4 py-2 font-medium text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {reviewed.map((entry) => (
                        <tr key={entry.id} className="hover:bg-muted/20">
                          <td className="px-4 py-3 font-medium font-mono text-xs">
                            {entry.value}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                              {entry.type.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <StatusPill
                              status={entry.status}
                              claimed={!!entry.claimedByUser}
                              claimedName={
                                entry.claimedByUser?.name ||
                                entry.claimedByUser?.email ||
                                null
                              }
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => requestDelete(entry)}
                              aria-label={`Remove allowlist entry ${entry.value}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        );
      })()}

      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open && pendingActionId !== rejectTarget?.id) {
            setRejectTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject contributor?</DialogTitle>
            <DialogDescription>
              {rejectTarget ? (
                <>
                  Rejecting{" "}
                  <span className="font-medium font-mono">
                    {rejectTarget.value}
                  </span>{" "}
                  will mark this entry as REJECTED. Future merged PRs they
                  author on this org's projects will continue to be held
                  back from scoring.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <p className="font-medium text-destructive">
              This will also strip every role they currently hold in this
              organization
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Organization-, department-, and project-scoped UserRole rows
              + every ProjectMember row on this org's projects will be
              removed in one transaction. Global ADMIN roles are untouched.
              If they're the sole organization manager, the operation is
              refused.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectTarget(null)}
              disabled={pendingActionId === rejectTarget?.id}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmReject}
              disabled={pendingActionId === rejectTarget?.id}
              className="gap-2"
            >
              {pendingActionId === rejectTarget?.id && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Reject &amp; strip roles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove allowlist entry?</DialogTitle>
            <DialogDescription>
              {deleteTarget ? (
                <>
                  This will remove <span className="font-medium">{deleteTarget.value}</span> from
                  the allowlist. Future sign-ins that match this entry will no longer be auto-enrolled.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          {deleteTarget?.claimedByUser ? (
            <label className="flex items-start gap-3 rounded-md border bg-muted/30 p-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={revokeMembership}
                onChange={(e) => setRevokeMembership(e.target.checked)}
                disabled={deleting}
                className="mt-0.5 h-4 w-4 accent-destructive"
              />
              <span>
                Also revoke organization membership from{" "}
                <span className="font-medium">
                  {deleteTarget.claimedByUser.name || deleteTarget.claimedByUser.email}
                </span>
                .
                <span className="block text-xs text-muted-foreground mt-1">
                  Their ORGANIZATION_MEMBER role for this organization will be removed.
                </span>
              </span>
            </label>
          ) : (
            <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
              This entry has not been claimed yet, so no membership will be affected.
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeDeleteDialog}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="gap-2"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {revokeMembership ? "Remove entry & revoke membership" : "Remove entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusPill({
  status,
  claimed,
  claimedName,
}: {
  status: AllowlistStatus;
  claimed: boolean;
  claimedName: string | null;
}) {
  const palette: Record<AllowlistStatus, string> = {
    PENDING:
      "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
    APPROVED:
      "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    REJECTED:
      "text-destructive bg-destructive/10 border-destructive/30",
  };
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
          palette[status],
        )}
      >
        {status}
      </span>
      {status === "APPROVED" && claimed && claimedName && (
        <span className="text-[11px] text-muted-foreground">
          Claimed by {claimedName}
        </span>
      )}
    </div>
  );
}
