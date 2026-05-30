"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
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

type AllowlistEntry = {
  id: string;
  type: "EMAIL" | "DOMAIN" | "GITHUB_USERNAME";
  value: string;
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

      {/* Existing Entries */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Current Allowlist ({entries.length})</h3>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No entries found. Add emails, domains, or GitHub usernames above to allow users to automatically join this organization.
          </div>
        ) : (
          <div className="rounded-md border max-h-[300px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground sticky top-0">
                <tr>
                  <th className="px-4 py-2 font-medium">Value</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{entry.value}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                        {entry.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {entry.claimedByUser ? (
                        <span className="text-green-600 dark:text-green-400 flex items-center gap-1 text-xs">
                          Claimed by {entry.claimedByUser.name || entry.claimedByUser.email}
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 text-xs">Pending</span>
                      )}
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
