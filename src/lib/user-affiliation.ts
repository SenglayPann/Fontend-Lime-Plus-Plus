/**
 * Shared helpers for deciding whether a user can be picked for a role inside
 * a given organization. Used by every form that lets a manager pick people:
 * project creation, project member upsert, department creation/edit, etc.
 *
 * The predicate is intentionally generous: any UserRole or ProjectMember row
 * connecting the user to the org counts — including ORGANIZATION_MEMBER
 * created via the allowlist. That matches the existing convention.
 *
 * Ranks mirror the backend ROLE_RANK in role-delegation.service.ts.
 */

export const ROLE_RANK: Record<string, number> = {
  ADMIN: 5,
  ORGANIZATION_MANAGER: 4,
  DEPARTMENT_MANAGER: 3,
  PROJECT_MANAGER: 2,
  PROJECT_LEAD: 1.5,
  PROJECT_MEMBER: 1,
  ORGANIZATION_MEMBER: 0,
};

export interface AffiliationUser {
  id?: string | null;
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
}

export function userBelongsToOrganization(
  user: AffiliationUser,
  organizationId: string,
): boolean {
  if (!organizationId) return false;

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

export function getUserEffectiveRoles(user: AffiliationUser): string[] {
  const userRoles = Array.isArray(user.userRoles)
    ? user.userRoles.map((role) => role.role).filter(Boolean)
    : [];
  const projectRoles = Array.isArray(user.projectMembers)
    ? user.projectMembers.map((member) => member.role).filter(Boolean)
    : [];
  return [...userRoles, ...projectRoles] as string[];
}

export function highestRoleRank(userRoles: string[]): number {
  return Math.max(0, ...userRoles.map((role) => ROLE_RANK[role] ?? 0));
}
