"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Loader2,
  Plus,
  Search,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type ScopedName = {
  id: string;
  name: string;
};

type ProjectManager = {
  id: string;
  name?: string | null;
  email?: string | null;
  githubUsername?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  activeProjectsCount: number;
  roles: Array<{
    id: string;
    role: string;
    organization?: ScopedName | null;
    department?: ScopedName | null;
  }>;
};

type SimpleUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  githubUsername?: string | null;
};

type DepartmentWithOrg = {
  id: string;
  name: string;
  organization?: {
    id: string;
    name: string;
  } | null;
};

interface ProjectManagersClientProps {
  managers: ProjectManager[];
  allUsers: SimpleUser[];
  departments: DepartmentWithOrg[];
  accessToken: string;
  actorRoles: string[];
  actorScopes?: {
    organizations?: Array<{ id: string; role: string }>;
    departments?: Array<{ id: string; role: string }>;
  };
}

export function ProjectManagersClient({
  managers,
  allUsers,
  departments,
  accessToken,
  actorRoles,
  actorScopes,
}: ProjectManagersClientProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [query, setQuery] = useState("");
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = actorRoles.includes("ADMIN");
  const isOrgManager = actorRoles.includes("ORGANIZATION_MANAGER");
  const isDeptManager = actorRoles.includes("DEPARTMENT_MANAGER");
  const canManageManagers = isAdmin || isOrgManager || isDeptManager;

  function canRemoveManagerRole(deptId?: string) {
    if (!canManageManagers) return false;
    if (isAdmin) return true;
    if (!deptId) return false;

    const isDeptMgrForDept = actorScopes?.departments?.some(
      (scope) => scope.role === "DEPARTMENT_MANAGER" && scope.id === deptId,
    );
    if (isDeptMgrForDept) return true;

    const dept = departments.find((d) => d.id === deptId);
    const orgId = dept?.organization?.id;
    if (orgId) {
      const isOrgMgrForOrg = actorScopes?.organizations?.some(
        (scope) => scope.role === "ORGANIZATION_MANAGER" && scope.id === orgId,
      );
      if (isOrgMgrForOrg) return true;
    }

    return false;
  }

  const filteredManagers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return managers;

    return managers.filter((mgr) => {
      const name = mgr.name || "";
      const email = mgr.email || "";
      const github = mgr.githubUsername || "";
      const depts = mgr.roles.map((r) => r.department?.name || "").join(" ");

      return (
        name.toLowerCase().includes(normalized) ||
        email.toLowerCase().includes(normalized) ||
        github.toLowerCase().includes(normalized) ||
        depts.toLowerCase().includes(normalized)
      );
    });
  }, [query, managers]);

  // Candidates for promotion (users who are not already project managers in all available departments)
  const promoCandidates = useMemo(() => {
    return allUsers.filter((u) => {
      const mgr = managers.find((m) => m.id === u.id);
      if (!mgr) return true;

      const managedDeptIds = new Set(
        mgr.roles
          .filter((r) => r.role === "PROJECT_MANAGER")
          .map((r) => r.department?.id)
          .filter(Boolean)
      );

      return departments.some((dept) => !managedDeptIds.has(dept.id));
    });
  }, [allUsers, managers, departments]);

  function handleOpenPromo() {
    setIsPromoOpen(true);
    setSelectedUserId(promoCandidates[0]?.id || "");
    setSelectedDeptId(departments[0]?.id || "");
    setError(null);
  }

  async function handlePromote() {
    if (!selectedUserId || !selectedDeptId) {
      setError("Please select both a user and a department.");
      return;
    }

    const key = `promote:${selectedUserId}`;
    setPendingKey(key);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${selectedUserId}/roles`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: "PROJECT_MANAGER",
            department_id: selectedDeptId,
          }),
        },
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error?.message || json.message || "Failed to promote user to Project Manager",
        );
      }

      setIsPromoOpen(false);
      await updateSession();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to promote user to Project Manager");
    } finally {
      setPendingKey(null);
    }
  }

  async function handleRemoveRole(roleId: string) {
    const key = `remove:${roleId}`;
    setPendingKey(key);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/roles/${roleId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (!res.ok) {
        const json = await res.json();
        throw new Error(
          json.error?.message || json.message || "Failed to remove Project Manager role",
        );
      }

      await updateSession();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to remove Project Manager role");
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Managers</h1>
          <p className="text-muted-foreground mt-1">
            Supervise project managers (teachers) and assign their department scopes.
          </p>
        </div>
        {canManageManagers && (
          <Button onClick={handleOpenPromo} className="gap-2">
            <Plus className="h-4 w-4" /> Promote to Manager
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search project managers by name, email or scope..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="border-b border-border/60">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-indigo-500" /> Active Managers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Manager Profile</th>
                  <th className="px-6 py-4">Supervised Departments</th>
                  <th className="px-6 py-4 text-center">Active Projects</th>
                  {canManageManagers && (
                    <th className="px-6 py-4 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredManagers.length === 0 && (
                  <tr>
                    <td
                      colSpan={canManageManagers ? 4 : 3}
                      className="px-6 py-8 text-center text-muted-foreground"
                    >
                      No project managers found in your current scope.
                    </td>
                  </tr>
                )}
                {filteredManagers.map((mgr) => (
                  <tr key={mgr.id} className="hover:bg-muted/10">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                          {mgr.avatarUrl ? (
                            <img
                              src={mgr.avatarUrl}
                              alt={mgr.name || "avatar"}
                              className="h-9 w-9 rounded-full object-cover"
                            />
                          ) : (
                            (mgr.name || mgr.githubUsername || "?").substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {mgr.name || mgr.githubUsername || "Unnamed user"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {mgr.githubUsername ? `@${mgr.githubUsername}` : mgr.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {mgr.roles.map((role) => (
                          <span
                            key={role.id}
                            className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 border border-indigo-100"
                          >
                            <GraduationCap className="h-3 w-3" />
                            {role.department?.name || "Global Scope"}
                            {canRemoveManagerRole(role.department?.id) && (
                              <button
                                onClick={() => handleRemoveRole(role.id)}
                                disabled={pendingKey === `remove:${role.id}`}
                                className="ml-1 text-indigo-500 hover:text-indigo-900 focus:outline-none"
                                title="Revoke scope"
                              >
                                {pendingKey === `remove:${role.id}` ? (
                                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                ) : (
                                  "×"
                                )}
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-foreground">
                      {mgr.activeProjectsCount}
                    </td>
                    {canManageManagers && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {mgr.roles.some((r) => canRemoveManagerRole(r.department?.id)) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1"
                              onClick={() => {
                                mgr.roles
                                  .filter((r) => canRemoveManagerRole(r.department?.id))
                                  .forEach((role) => handleRemoveRole(role.id));
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Revoke
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPromoOpen} onOpenChange={setIsPromoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote to Project Manager</DialogTitle>
            <DialogDescription>
              Assign the Project Manager (Teacher/Supervisor) role to a user scoped within a department.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="user-promo-select">
                Select User
              </label>
              <select
                id="user-promo-select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {promoCandidates.length === 0 ? (
                  <option value="">No eligible users for promotion</option>
                ) : (
                  promoCandidates.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.githubUsername || u.email} ({u.githubUsername ? `@${u.githubUsername}` : u.email})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="dept-promo-select">
                Department Scope
              </label>
              <select
                id="dept-promo-select"
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.organization?.name ? `(${d.organization.name})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPromoOpen(false)}
              disabled={pendingKey !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePromote}
              disabled={pendingKey !== null || !selectedUserId || !selectedDeptId}
            >
              {pendingKey ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Promoting...
                </>
              ) : (
                "Confirm Promotion"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
