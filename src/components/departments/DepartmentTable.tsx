"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Edit2,
  GraduationCap,
  MoreHorizontal,
  ExternalLink,
  FolderKanban,
  Building2,
  Loader2,
  Trash2,
  Search,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedSearchParam } from "@/lib/use-debounced-search-param";
import { cn } from "@/lib/utils";

interface DepartmentTableProps {
  initialDepartments: any[];
  accessToken: string;
  initialSearch?: string;
  canManageDepartments?: boolean;
  canDeleteDepartments?: boolean;
  canChangeDepartmentOrganization?: boolean;
  canAssignDepartmentManager?: boolean;
  organizations?: Array<{ id: string; name: string }>;
  managerCandidates?: DepartmentManagerCandidate[];
  actorRoles?: string[];
  actorUserId?: string;
}

type DepartmentManagerCandidate = {
  id: string;
  name?: string | null;
  email?: string | null;
  githubUsername?: string | null;
  userRoles?: Array<{
    role?: string | null;
    organizationId?: string | null;
    organization?: { id?: string | null } | null;
    department?: {
      organizationId?: string | null;
      organization?: { id?: string | null } | null;
    } | null;
  }>;
  projectMembers?: Array<{
    role?: string | null;
    project?: {
      department?: {
        organizationId?: string | null;
        organization?: { id?: string | null } | null;
      } | null;
    } | null;
  }>;
};

const ROLE_RANK: Record<string, number> = {
  ADMIN: 5,
  ORGANIZATION_MANAGER: 4,
  DEPARTMENT_MANAGER: 3,
  PROJECT_MANAGER: 2,
  PROJECT_MEMBER: 1,
};

export function DepartmentTable({
  initialDepartments,
  accessToken,
  initialSearch = "",
  canManageDepartments = false,
  canDeleteDepartments = canManageDepartments,
  canChangeDepartmentOrganization = false,
  canAssignDepartmentManager = false,
  organizations = [],
  managerCandidates = [],
  actorRoles = [],
  actorUserId,
}: DepartmentTableProps) {
  const router = useRouter();
  const [departments, setDepartments] = useState(initialDepartments);
  const [filter, setFilter] = useState(initialSearch);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editOrganizationId, setEditOrganizationId] = useState("");
  const [editManagerId, setEditManagerId] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debouncedFilter = useDebouncedSearchParam(filter);

  useEffect(() => {
    setDepartments(initialDepartments);
  }, [initialDepartments]);

  useEffect(() => {
    setFilter(initialSearch);
  }, [initialSearch]);

  const filteredDepartments = useMemo(() => {
    const normalized = debouncedFilter.trim().toLowerCase();
    if (!normalized) return departments;

    return departments.filter(
      (dept) =>
        dept.name.toLowerCase().includes(normalized) ||
        (dept.description || "").toLowerCase().includes(normalized) ||
        (dept.organization?.name || "").toLowerCase().includes(normalized) ||
        getDepartmentManagerNames(dept).some((manager) =>
          manager.toLowerCase().includes(normalized),
        ),
    );
  }, [departments, debouncedFilter]);

  const openEdit = (department: any) => {
    setEditTarget(department);
    setEditName(department.name || "");
    setEditOrganizationId(
      department.organizationId || department.organization?.id || "",
    );
    setEditManagerId(currentDepartmentManagerIds(department)[0] || "");
    setEditDescription(department.description || "");
    setError(null);
  };

  const handleEdit = async () => {
    if (!editTarget) return;

    setPendingId(editTarget.id);
    setError(null);

    try {
      const body: Record<string, string | undefined> = {
        name: editName.trim(),
        description: editDescription.trim(),
      };

      if (canChangeDepartmentOrganization) {
        body.organization_id = editOrganizationId;
      }

      const currentManagerIds = new Set(currentDepartmentManagerIds(editTarget));
      if (
        canAssignDepartmentManager &&
        editManagerId &&
        !currentManagerIds.has(editManagerId)
      ) {
        body.manager_user_id = editManagerId;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/departments/${editTarget.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          json?.error?.message || json?.message || "Failed to update department",
        );
      }

      const updated = json?.success ? json.data : json;
      setDepartments((prev) =>
        prev.map((department) =>
          department.id === editTarget.id
            ? {
                ...department,
                ...updated,
                name: updated?.name ?? editName.trim(),
                description: updated?.description ?? editDescription.trim(),
              }
            : department,
        ),
      );
      setEditTarget(null);
      router.refresh();
    } catch (error) {
      console.error("Error updating department:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred while updating",
      );
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (department: any) => {
    setPendingId(department.id);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/departments/${department.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          json?.error?.message || json?.message || "Failed to delete department",
        );
      }

      setDepartments((prev) => prev.filter((d) => d.id !== department.id));
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting department:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred while deleting",
      );
    } finally {
      setPendingId(null);
    }
  };

  return (
    <Card>
      {error && (
        <div className="border-b border-destructive/20 bg-destructive/10 px-6 py-3 text-sm font-medium text-destructive">
          {error}
        </div>
      )}
      <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter departments..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-4">Department Name</th>
                <th className="px-6 py-4">Organization</th>
                <th className="px-6 py-4">Managers</th>
                <th className="px-6 py-4">Active Projects</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDepartments.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-muted-foreground"
                  >
                    No departments found.
                  </td>
                </tr>
              )}
              {filteredDepartments.map((dept) => {
                const projectCount = dept._count?.projects || 0;
                const status = projectCount > 0 ? "Active" : "Idle";
                const managerNames = getDepartmentManagerNames(dept);

                return (
                  <tr
                    key={dept.id}
                    className="hover:bg-muted/20 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                          <GraduationCap className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-foreground">
                          {dept.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-3 w-3" />{" "}
                        {dept.organization?.name || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <UserCircle className="h-3 w-3" />
                        <span className="max-w-64 truncate">
                          {managerNames.length > 0
                            ? managerNames.join(", ")
                            : "Not assigned"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FolderKanban className="h-3 w-3" /> {projectCount}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          status === "Active"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-amber-500/10 text-amber-500",
                        )}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          asChild
                        >
                          <Link href={`/departments/${dept.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>

                        {(canManageDepartments || canDeleteDepartments) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                disabled={pendingId === dept.id}
                                aria-label={`Open department actions for ${dept.name}`}
                              >
                                {pendingId === dept.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {canManageDepartments && (
                                <DropdownMenuItem
                                  className="gap-2 cursor-pointer"
                                  onClick={() => openEdit(dept)}
                                >
                                  <Edit2 className="h-3.5 w-3.5" /> Edit
                                </DropdownMenuItem>
                              )}
                              {canDeleteDepartments && (
                                <DropdownMenuItem
                                  className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                                  onClick={() => {
                                    setDeleteTarget(dept);
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
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit department</DialogTitle>
            <DialogDescription>Update department details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="department-name">
                Name
              </label>
              <Input
                id="department-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                maxLength={120}
              />
            </div>
            {canChangeDepartmentOrganization && (
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="department-organization"
                >
                  Organization
                </label>
                <select
                  id="department-organization"
                  value={editOrganizationId}
                  onChange={(event) => {
                    setEditOrganizationId(event.target.value);
                    setEditManagerId("");
                  }}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                  disabled={organizations.length === 0}
                >
                  <option value="" disabled>
                    Select organization
                  </option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {(canAssignDepartmentManager ||
              currentDepartmentManagers(editTarget).length > 0) && (
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="department-manager"
                >
                  Department Manager
                </label>
                <select
                  id="department-manager"
                  value={editManagerId}
                  onChange={(event) => setEditManagerId(event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                  disabled={
                    !canAssignDepartmentManager ||
                    departmentManagerOptions(
                      managerCandidates,
                      editTarget,
                      editOrganizationId,
                      actorRoles,
                      actorUserId,
                    ).length === 0
                  }
                >
                  {departmentManagerOptions(
                    managerCandidates,
                    editTarget,
                    editOrganizationId,
                    actorRoles,
                    actorUserId,
                    canAssignDepartmentManager,
                  ).length === 0 && <option value="">Not assigned</option>}
                  {departmentManagerOptions(
                    managerCandidates,
                    editTarget,
                    editOrganizationId,
                    actorRoles,
                    actorUserId,
                    canAssignDepartmentManager,
                  ).map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {userLabel(candidate)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                htmlFor="department-description"
              >
                Description
              </label>
              <Textarea
                id="department-description"
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                maxLength={1000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditTarget(null)}
              disabled={pendingId !== null}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleEdit}
              disabled={
                !editName.trim() ||
                pendingId !== null ||
                (canChangeDepartmentOrganization && !editOrganizationId)
              }
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
            <DialogTitle>Delete department?</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `${deleteTarget.name} can only be deleted when it has no projects or scoped roles.`
                : "This department can only be deleted when it is empty."}
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
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              disabled={!deleteTarget || pendingId !== null}
              className="gap-2"
            >
              {pendingId && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function currentDepartmentManagers(
  department: any | null,
): DepartmentManagerCandidate[] {
  return (department?.userRoles || [])
    .filter((role: any) => role.role === "DEPARTMENT_MANAGER" && role.user?.id)
    .map((role: any) => ({
      id: role.user.id,
      name: role.user.name,
      githubUsername: role.user.githubUsername,
      email: role.user.email,
      assigned: true,
    }));
}

function currentDepartmentManagerIds(department: any | null) {
  return currentDepartmentManagers(department).map((manager) => manager.id);
}

function departmentManagerOptions(
  candidates: DepartmentManagerCandidate[],
  department: any | null,
  organizationId: string,
  actorRoles: string[],
  actorUserId?: string,
  canAssignDepartmentManager = true,
): DepartmentManagerCandidate[] {
  const currentManagers = currentDepartmentManagers(department);
  const currentManagerIds = new Set(
    currentManagers.map((manager: DepartmentManagerCandidate) => manager.id),
  );
  const currentOptions = currentManagers.map((manager) => ({
    ...manager,
    name: `${userLabel(manager)} (Assigned)`,
  }));

  if (!organizationId || !canAssignDepartmentManager) {
    return currentOptions;
  }

  const actorRank = highestRoleRank(actorRoles);

  const newCandidates = candidates.filter((candidate) => {
    if (currentManagerIds.has(candidate.id)) return false;
    if (actorRoles.includes("ADMIN")) return true;
    if (candidate.id === actorUserId) return true;

    return (
      userBelongsToOrganization(candidate, organizationId) &&
      highestRoleRank(getUserEffectiveRoles(candidate)) < actorRank
    );
  });

  return [...currentOptions, ...newCandidates];
}

function userLabel(user: DepartmentManagerCandidate) {
  return user.name || user.githubUsername || user.email || "Unknown User";
}

function getUserEffectiveRoles(user: DepartmentManagerCandidate): string[] {
  const userRoles = Array.isArray(user.userRoles)
    ? user.userRoles.map((role) => role.role)
    : [];
  const projectRoles = Array.isArray(user.projectMembers)
    ? user.projectMembers.map((member) => member.role)
    : [];

  return [...userRoles, ...projectRoles].filter(Boolean) as string[];
}

function highestRoleRank(userRoles: string[]) {
  return Math.max(0, ...userRoles.map((role) => ROLE_RANK[role] || 0));
}

function userBelongsToOrganization(
  user: DepartmentManagerCandidate,
  organizationId: string,
) {
  const hasScopedRole = (user.userRoles || []).some((role) => {
    return (
      role.organizationId === organizationId ||
      role.organization?.id === organizationId ||
      role.department?.organizationId === organizationId ||
      role.department?.organization?.id === organizationId
    );
  });

  if (hasScopedRole) return true;

  return (user.projectMembers || []).some((member) => {
    const department = member.project?.department;
    return (
      department?.organizationId === organizationId ||
      department?.organization?.id === organizationId
    );
  });
}

function getDepartmentManagerNames(department: any): string[] {
  if (Array.isArray(department.managerNames)) {
    return department.managerNames.filter(Boolean);
  }

  if (!Array.isArray(department.userRoles)) {
    return [];
  }

  return department.userRoles
    .filter((role: any) => role.role === "DEPARTMENT_MANAGER")
    .map(
      (role: any) =>
        role.user?.name ||
        role.user?.githubUsername ||
        role.user?.email ||
        null,
    )
    .filter(Boolean);
}
