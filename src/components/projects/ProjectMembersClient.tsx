"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Search,
  Shield,
  Trash2,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ProjectRole = "PROJECT_MANAGER" | "PROJECT_MEMBER";

type ProjectMember = {
  id: string;
  userId: string;
  role: ProjectRole;
  source?: string | null;
  createdAt?: string | null;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    githubUsername?: string | null;
  } | null;
};

type VisibleUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  githubUsername?: string | null;
};

interface ProjectMembersClientProps {
  projectId: string;
  projectName: string;
  accessToken: string;
  initialMembers: ProjectMember[];
  visibleUsers: VisibleUser[];
  canManageMembers: boolean;
  canAssignProjectManager: boolean;
}

function displayUser(user?: ProjectMember["user"] | VisibleUser | null) {
  return user?.name || user?.githubUsername || user?.email || "Unnamed user";
}

function secondaryUser(user?: ProjectMember["user"] | VisibleUser | null) {
  if (!user) return "No profile";
  if (user.githubUsername) return `@${user.githubUsername}`;
  return user.email || "No GitHub username";
}

function roleLabel(role: string) {
  return role.replace("_", " ");
}

export function ProjectMembersClient({
  projectId,
  projectName,
  accessToken,
  initialMembers,
  visibleUsers,
  canManageMembers,
  canAssignProjectManager,
}: ProjectMembersClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] =
    useState<ProjectRole>("PROJECT_MEMBER");
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const memberUserIds = useMemo(
    () => new Set(initialMembers.map((member) => member.userId)),
    [initialMembers],
  );

  const candidateUsers = useMemo(
    () => visibleUsers.filter((user) => !memberUserIds.has(user.id)),
    [memberUserIds, visibleUsers],
  );

  const filteredMembers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return initialMembers;

    return initialMembers.filter((member) => {
      const user = member.user;
      return (
        displayUser(user).toLowerCase().includes(normalized) ||
        secondaryUser(user).toLowerCase().includes(normalized) ||
        member.role.toLowerCase().includes(normalized) ||
        (member.source || "").toLowerCase().includes(normalized)
      );
    });
  }, [initialMembers, query]);

  const managerCount = initialMembers.filter(
    (member) => member.role === "PROJECT_MANAGER",
  ).length;

  async function saveMember(userId: string, role: ProjectRole) {
    if (!userId) return;
    const key = `save:${userId}`;
    setPendingKey(key);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/members`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userId, role }),
        },
      );
      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error?.message || json.message || "Failed to save member",
        );
      }

      setIsDialogOpen(false);
      setSelectedUserId("");
      setSelectedRole("PROJECT_MEMBER");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save member");
    } finally {
      setPendingKey(null);
    }
  }

  async function removeMember(member: ProjectMember) {
    const key = `remove:${member.id}`;
    setPendingKey(key);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/members/${member.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error?.message || json.message || "Failed to remove member",
        );
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to remove member");
    } finally {
      setPendingKey(null);
    }
  }

  const canSelectManagerRole = canAssignProjectManager;
  const canSubmitNewMember = selectedUserId && pendingKey === null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link
            href={`/projects/${projectId}`}
            className="flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Project
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Project Members
          </h1>
          <p className="text-muted-foreground">{projectName}</p>
        </div>
        {canManageMembers && candidateUsers.length > 0 && (
          <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
            <UserPlus className="h-4 w-4" /> Add Member
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Members</p>
              <p className="text-2xl font-bold">{initialMembers.length}</p>
            </div>
            <Users className="h-6 w-6 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Managers</p>
              <p className="text-2xl font-bold">{managerCount}</p>
            </div>
            <UserCog className="h-6 w-6 text-blue-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Synced</p>
              <p className="text-2xl font-bold">
                {
                  initialMembers.filter(
                    (member) => member.source === "KANBAN_SYNC",
                  ).length
                }
              </p>
            </div>
            <Shield className="h-6 w-6 text-emerald-600" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-border bg-muted/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Roster</CardTitle>
              <CardDescription>Project-scoped roles</CardDescription>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search members..."
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Project Role</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Added</th>
                  {canManageMembers && (
                    <th className="px-6 py-4 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMembers.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-8 text-center text-muted-foreground"
                      colSpan={canManageMembers ? 5 : 4}
                    >
                      No members match the current search.
                    </td>
                  </tr>
                )}
                {filteredMembers.map((member) => {
                  const canChangeRole =
                    canManageMembers &&
                    (member.role !== "PROJECT_MANAGER" ||
                      canAssignProjectManager);
                  const canRemove =
                    canManageMembers &&
                    (member.role !== "PROJECT_MANAGER" ||
                      canAssignProjectManager);

                  return (
                    <tr key={member.id} className="hover:bg-muted/20">
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">
                          {displayUser(member.user)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {secondaryUser(member.user)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {canChangeRole ? (
                          <select
                            value={member.role}
                            onChange={(event) =>
                              saveMember(
                                member.userId,
                                event.target.value as ProjectRole,
                              )
                            }
                            disabled={pendingKey !== null}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                            aria-label="Project role"
                          >
                            <option value="PROJECT_MEMBER">
                              Project Member
                            </option>
                            {canSelectManagerRole && (
                              <option value="PROJECT_MANAGER">
                                Project Manager
                              </option>
                            )}
                          </select>
                        ) : (
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
                              member.role === "PROJECT_MANAGER"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {roleLabel(member.role)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {member.source || "MANUAL"}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {member.createdAt
                          ? new Date(member.createdAt).toLocaleDateString()
                          : "Unknown"}
                      </td>
                      {canManageMembers && (
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={!canRemove || pendingKey !== null}
                            onClick={() => removeMember(member)}
                            aria-label="Remove project member"
                          >
                            {pendingKey === `remove:${member.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add project member</DialogTitle>
            <DialogDescription>
              Select a visible user and project-scoped role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="user-select">
                User
              </label>
              <select
                id="user-select"
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select user</option>
                {candidateUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {displayUser(user)} - {secondaryUser(user)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="role-select">
                Role
              </label>
              <select
                id="role-select"
                value={selectedRole}
                onChange={(event) =>
                  setSelectedRole(event.target.value as ProjectRole)
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="PROJECT_MEMBER">Project Member</option>
                {canSelectManagerRole && (
                  <option value="PROJECT_MANAGER">Project Manager</option>
                )}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={pendingKey !== null}
            >
              Cancel
            </Button>
            <Button
              className="gap-2"
              onClick={() => saveMember(selectedUserId, selectedRole)}
              disabled={!canSubmitNewMember}
            >
              {pendingKey?.startsWith("save:") && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
