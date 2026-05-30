"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Edit2,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Search,
  Trash2,
  Users,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { useDebouncedSearchParam } from "@/lib/use-debounced-search-param";
import { cn } from "@/lib/utils";
import { AllowlistManager } from "./AllowlistManager";

type Organization = {
  id: string;
  name: string;
  licensePlan?: string | null;
  license?: string | null;
  status?: string | null;
  departments?: unknown[];
  users?: unknown[];
  _count?: {
    departments?: number;
    userRoles?: number;
  };
  userRoles?: Array<{
    role?: string;
    user?: {
      id?: string | null;
      name?: string | null;
      githubUsername?: string | null;
      email?: string | null;
    };
  }>;
  managerNames?: string[];
};

type ManagerCandidate = {
  id: string;
  label: string;
};

interface OrganizationsTableClientProps {
  organizations: Organization[];
  accessToken: string;
  canManageOrganizations: boolean;
  initialSearch?: string;
  managerCandidates?: ManagerCandidate[];
  actorRoles?: string[];
  actorUserId?: string;
}

export function OrganizationsTableClient({
  organizations,
  accessToken,
  canManageOrganizations,
  initialSearch = "",
  managerCandidates = [],
  actorRoles = [],
  actorUserId,
}: OrganizationsTableClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(organizations);
  const [query, setQuery] = useState(initialSearch);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [editName, setEditName] = useState("");
  const [editLicensePlan, setEditLicensePlan] = useState("standard");
  const [editManagerId, setEditManagerId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Organization | null>(null);
  const [managingAllowlistFor, setManagingAllowlistFor] = useState<Organization | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebouncedSearchParam(query);

  useEffect(() => {
    setItems(organizations);
  }, [organizations]);

  useEffect(() => {
    setQuery(initialSearch);
  }, [initialSearch]);

  const filtered = useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase();
    if (!normalized) return items;

    return items.filter(
      (organization) =>
        organization.name.toLowerCase().includes(normalized) ||
        (organization.licensePlan || organization.license || "")
          .toLowerCase()
          .includes(normalized) ||
        getOrganizationManagerNames(organization).some((manager) =>
          manager.toLowerCase().includes(normalized),
        ),
    );
  }, [items, debouncedQuery]);

  function openEdit(organization: Organization) {
    setEditing(organization);
    setEditName(organization.name);
    setEditLicensePlan(organization.licensePlan || organization.license || "standard");
    setEditManagerId(currentOrganizationManagerIds(organization)[0] || "");
    setError(null);
  }

  async function saveEdit() {
    if (!editing) return;
    setPendingId(editing.id);
    setError(null);

    try {
      const currentManagerIds = new Set(currentOrganizationManagerIds(editing));
      const hasManagerChanged =
        !currentManagerIds.has(editManagerId) &&
        !(editManagerId === "" && currentManagerIds.size === 0);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/organizations/${editing.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editName,
            license_plan: editLicensePlan,
            ...(hasManagerChanged ? { manager_user_id: editManagerId } : {}),
          }),
        },
      );
      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error?.message || json.message || "Failed to update organization",
        );
      }

      const updated = json.success ? json.data : json;
      setItems((current) =>
        current.map((organization) =>
          organization.id === updated.id ? { ...organization, ...updated } : organization,
        ),
      );
      setEditing(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update organization");
    } finally {
      setPendingId(null);
    }
  }

  async function deleteOrganization(organization: Organization) {
    setPendingId(organization.id);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organization.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          json?.error?.message || json?.message || "Failed to delete organization",
        );
      }

      setItems((current) =>
        current.filter((item) => item.id !== organization.id),
      );
      router.refresh();
      setDeleteTarget(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete organization");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search organizations..."
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Organization Name</th>
                  <th className="px-6 py-4">License Plan</th>
                  <th className="px-6 py-4">Managers</th>
                  <th className="px-6 py-4">Departments</th>
                  <th className="px-6 py-4">Scoped Roles</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-4 text-center text-muted-foreground"
                    >
                      No organizations found.
                    </td>
                  </tr>
                )}
                {filtered.map((organization) => {
                  const managerNames =
                    getOrganizationManagerNames(organization);
                  const isManagerOfThisOrg = Boolean(
                    organization.userRoles?.some(
                      (role) =>
                        role.role === "ORGANIZATION_MANAGER" &&
                        role.user?.id === actorUserId,
                    ),
                  );
                  const canManageAllowlist =
                    canManageOrganizations || isManagerOfThisOrg;

                  return (
                    <tr
                      key={organization.id}
                      className="transition-colors hover:bg-muted/20"
                    >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <Link
                          href={`/organizations/${organization.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {organization.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-950/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-700/10">
                        {organization.licensePlan ||
                          organization.license ||
                          "standard"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span className="max-w-64 truncate">
                          {managerNames.length > 0
                            ? managerNames.join(", ")
                            : "Not assigned"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {organization._count?.departments ||
                        organization.departments?.length ||
                        0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {organization._count?.userRoles ||
                          organization.users?.length ||
                          0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          (organization.status || "Active") === "Active"
                            ? "bg-primary/10 text-primary"
                            : "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400",
                        )}
                      >
                        {organization.status || "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {canManageAllowlist && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            asChild
                          >
                            <Link href={`/organizations/${organization.id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        {canManageAllowlist && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                disabled={pendingId === organization.id}
                                aria-label={`Open organization actions for ${organization.name}`}
                              >
                                {pendingId === organization.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {canManageOrganizations && (
                                <DropdownMenuItem
                                  className="gap-2 cursor-pointer"
                                  onClick={() => openEdit(organization)}
                                >
                                  <Edit2 className="h-3.5 w-3.5" /> Edit
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer"
                                onClick={() => setManagingAllowlistFor(organization)}
                              >
                                <UserPlus className="h-3.5 w-3.5" /> Manage Allowlist
                              </DropdownMenuItem>
                              {canManageOrganizations && (
                                <DropdownMenuItem
                                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                                  onClick={() => {
                                    setDeleteTarget(organization);
                                    setError(null);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit organization</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="org-name">
                Name
              </label>
              <Input
                id="org-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="license-plan">
                License Plan
              </label>
              <select
                id="license-plan"
                value={editLicensePlan}
                onChange={(event) => setEditLicensePlan(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="standard">Standard</option>
                <option value="academic">Academic</option>
                <option value="enterprise">Enterprise</option>
                <option value="trial">Trial</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="org-manager">
                Organization Manager
              </label>
              <select
                id="org-manager"
                value={editManagerId}
                onChange={(event) => setEditManagerId(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
              >
                <option value="">Not assigned</option>
                {organizationManagerOptions(managerCandidates, editing).map(
                  (candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.label}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(null)}
              disabled={pendingId !== null}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveEdit}
              disabled={!editName.trim() || pendingId !== null}
              className="gap-2"
            >
              {pendingId && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete organization?</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `${deleteTarget.name} can only be deleted when it has no departments or scoped roles.`
                : "This organization can only be deleted when it is empty."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={pendingId !== null}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteTarget && deleteOrganization(deleteTarget)}
              disabled={!deleteTarget || pendingId !== null}
              className="gap-2"
            >
              {pendingId && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!managingAllowlistFor}
        onOpenChange={(open) => {
          if (!open) setManagingAllowlistFor(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Allowlist: {managingAllowlistFor?.name}</DialogTitle>
            <DialogDescription>
              Manage emails, domains, or GitHub usernames that can automatically join this organization.
            </DialogDescription>
          </DialogHeader>
          {managingAllowlistFor && (
            <AllowlistManager
              organizationId={managingAllowlistFor.id}
              accessToken={accessToken}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function currentOrganizationManagers(organization: Organization | null) {
  return (organization?.userRoles || [])
    .filter((role) => role.role === "ORGANIZATION_MANAGER" && role.user?.id)
    .map((role) => ({
      id: role.user!.id!,
      label:
        role.user?.name ||
        role.user?.githubUsername ||
        role.user?.email ||
        "Unknown User",
    }));
}

function currentOrganizationManagerIds(organization: Organization | null) {
  return currentOrganizationManagers(organization).map((manager) => manager.id);
}

function organizationManagerOptions(
  candidates: ManagerCandidate[],
  organization: Organization | null,
) {
  const currentManagers = currentOrganizationManagers(organization).map(
    (manager) => ({
      ...manager,
      label: `${manager.label} (Assigned)`,
    }),
  );
  const currentManagerIds = new Set(currentManagers.map((manager) => manager.id));
  const newCandidates = candidates.filter(
    (candidate) => !currentManagerIds.has(candidate.id),
  );

  return [...currentManagers, ...newCandidates];
}

function getOrganizationManagerNames(organization: Organization): string[] {
  if (Array.isArray(organization.managerNames)) {
    return organization.managerNames.filter(Boolean);
  }

  if (!Array.isArray(organization.userRoles)) {
    return [];
  }

  return organization.userRoles
    .filter((role) => role.role === "ORGANIZATION_MANAGER")
    .map(
      (role) =>
        role.user?.name ||
        role.user?.githubUsername ||
        role.user?.email ||
        null,
    )
    .filter(Boolean) as string[];
}
