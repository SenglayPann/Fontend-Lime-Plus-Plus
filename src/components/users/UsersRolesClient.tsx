"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
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

type UserRoleName = "ADMIN" | "ORGANIZATION_MANAGER" | "DEPARTMENT_MANAGER";

type ScopedName = {
  id: string;
  name: string;
};

type VisibleUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  githubUsername?: string | null;
  userRoles?: Array<{
    id: string;
    role: string;
    organizationId?: string | null;
    departmentId?: string | null;
    organization?: ScopedName | null;
    department?: ScopedName | null;
  }>;
  projectMembers?: Array<{
    id?: string | null;
    role?: string | null;
    project?: { id: string; name: string } | null;
  }>;
};

interface UsersRolesClientProps {
  users: VisibleUser[];
  organizations: ScopedName[];
  departments: Array<ScopedName & { organizationId?: string | null }>;
  accessToken: string;
  actorRoles: string[];
  actorScopes?: {
    organizations?: Array<{ id: string; role: string }>;
  };
}

function displayUser(user: VisibleUser) {
  return user.name || user.githubUsername || "Unnamed user";
}

function secondaryUser(user: VisibleUser) {
  if (user.githubUsername) return `@${user.githubUsername}`;
  return user.email || "No GitHub username";
}

function roleLabel(role?: string | null) {
  return (role || "Unknown role").replace("_", " ");
}

function roleScope(role: NonNullable<VisibleUser["userRoles"]>[number]) {
  if (role.department) return role.department.name;
  if (role.organization) return role.organization.name;
  return "Global";
}

export function UsersRolesClient({
  users,
  organizations,
  departments,
  accessToken,
  actorRoles,
  actorScopes,
}: UsersRolesClientProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [query, setQuery] = useState("");
  const [targetUser, setTargetUser] = useState<VisibleUser | null>(null);
  const [selectedRole, setSelectedRole] =
    useState<UserRoleName>("DEPARTMENT_MANAGER");
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = actorRoles.includes("ADMIN");
  const hasOrganizationScope = (actorScopes?.organizations || []).some(
    (scope) => scope.role === "ORGANIZATION_MANAGER",
  );
  const canAssignRoles = isAdmin || hasOrganizationScope;
  const pageTitle = canAssignRoles ? "Users & Roles" : "Visible Users";
  const pageDescription = canAssignRoles
    ? "Assign organization and department roles within your current scope."
    : "People visible within your current project or management scope.";
  const roleOptions: UserRoleName[] = isAdmin
    ? ["ADMIN", "ORGANIZATION_MANAGER", "DEPARTMENT_MANAGER"]
    : ["DEPARTMENT_MANAGER"];

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;

    return users.filter((user) => {
      const projectText = (user.projectMembers || [])
        .map((member) => member.project?.name || "")
        .join(" ");
      const roleText = (user.userRoles || [])
        .map((role) => `${role.role} ${roleScope(role)}`)
        .join(" ");

      return (
        displayUser(user).toLowerCase().includes(normalized) ||
        secondaryUser(user).toLowerCase().includes(normalized) ||
        projectText.toLowerCase().includes(normalized) ||
        roleText.toLowerCase().includes(normalized)
      );
    });
  }, [query, users]);

  function openAssignDialog(user: VisibleUser) {
    setTargetUser(user);
    setSelectedRole("DEPARTMENT_MANAGER");
    setSelectedOrganizationId(organizations[0]?.id || "");
    setSelectedDepartmentId(departments[0]?.id || "");
    setError(null);
  }

  async function assignRole() {
    if (!targetUser) return;

    const body: Record<string, string> = { role: selectedRole };
    if (selectedRole === "ORGANIZATION_MANAGER") {
      body.organization_id = selectedOrganizationId;
    }
    if (selectedRole === "DEPARTMENT_MANAGER") {
      body.department_id = selectedDepartmentId;
    }

    const key = `assign:${targetUser.id}`;
    setPendingKey(key);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${targetUser.id}/roles`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error?.message || json.message || "Failed to assign role",
        );
      }

      setTargetUser(null);
      await updateSession();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to assign role");
    } finally {
      setPendingKey(null);
    }
  }

  async function removeRole(roleId: string) {
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
      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error?.message || json.message || "Failed to remove role",
        );
      }

      await updateSession();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to remove role");
    } finally {
      setPendingKey(null);
    }
  }

  function canRemoveRole(role: string) {
    if (!canAssignRoles) return false;
    if (isAdmin) return true;
    return role === "DEPARTMENT_MANAGER";
  }

  const needsOrganization = selectedRole === "ORGANIZATION_MANAGER";
  const needsDepartment = selectedRole === "DEPARTMENT_MANAGER";
  const canSubmit =
    pendingKey === null &&
    !!targetUser &&
    (!needsOrganization || !!selectedOrganizationId) &&
    (!needsDepartment || !!selectedDepartmentId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {pageTitle}
          </h1>
          <p className="mt-2 text-muted-foreground">{pageDescription}</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search users..."
            className="pl-10"
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
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Visible Users
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Scoped Roles</th>
                  <th className="px-6 py-4">Project Membership</th>
                  {canAssignRoles && (
                    <th className="px-6 py-4 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={canAssignRoles ? 4 : 3}
                      className="px-6 py-6 text-center text-muted-foreground"
                    >
                      No users are visible in your current scope.
                    </td>
                  </tr>
                )}
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/20">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">
                        {displayUser(user)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {secondaryUser(user)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <RoleList
                        roles={user.userRoles || []}
                        canRemoveRole={canRemoveRole}
                        pendingKey={pendingKey}
                        onRemoveRole={removeRole}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <ProjectMembershipList
                        memberships={user.projectMembers || []}
                      />
                    </td>
                    {canAssignRoles && (
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => openAssignDialog(user)}
                        >
                          <Plus className="h-4 w-4" /> Assign
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!targetUser} onOpenChange={() => setTargetUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign scoped role</DialogTitle>
            <DialogDescription>
              {targetUser ? displayUser(targetUser) : "Selected user"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="role-select">
                Role
              </label>
              <select
                id="role-select"
                value={selectedRole}
                onChange={(event) =>
                  setSelectedRole(event.target.value as UserRoleName)
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {roleLabel(role)}
                  </option>
                ))}
              </select>
            </div>

            {needsOrganization && (
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="organization-select"
                >
                  Organization
                </label>
                <select
                  id="organization-select"
                  value={selectedOrganizationId}
                  onChange={(event) =>
                    setSelectedOrganizationId(event.target.value)
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {needsDepartment && (
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="department-select"
                >
                  Department
                </label>
                <select
                  id="department-select"
                  value={selectedDepartmentId}
                  onChange={(event) =>
                    setSelectedDepartmentId(event.target.value)
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTargetUser(null)}
              disabled={pendingKey !== null}
            >
              Cancel
            </Button>
            <Button
              className="gap-2"
              onClick={assignRole}
              disabled={!canSubmit}
            >
              {pendingKey?.startsWith("assign:") && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RoleList({
  roles,
  canRemoveRole,
  pendingKey,
  onRemoveRole,
}: {
  roles: NonNullable<VisibleUser["userRoles"]>;
  canRemoveRole: (role: string) => boolean;
  pendingKey: string | null;
  onRemoveRole: (roleId: string) => void;
}) {
  if (roles.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        No organization or department roles
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((role) => (
        <span
          key={role.id}
          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
        >
          <Shield className="h-3 w-3" />
          {roleLabel(role.role)} - {roleScope(role)}
          {canRemoveRole(role.role) && (
            <button
              type="button"
              className="ml-1 rounded-sm p-0.5 text-muted-foreground hover:bg-background hover:text-destructive disabled:opacity-50"
              onClick={() => onRemoveRole(role.id)}
              disabled={pendingKey !== null}
              aria-label="Remove role"
            >
              {pendingKey === `remove:${role.id}` ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

function ProjectMembershipList({
  memberships,
}: {
  memberships: NonNullable<VisibleUser["projectMembers"]>;
}) {
  if (memberships.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        No project memberships
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {memberships.map((member) => (
        <span
          key={member.id || `${member.project?.id || "project"}-${member.role || "role"}`}
          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
        >
          <FolderKanban className="h-3 w-3" />
          {roleLabel(member.role)} - {member.project?.name || "Project"}
        </span>
      ))}
    </div>
  );
}
