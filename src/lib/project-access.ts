type ScopedSessionUser = {
  id?: string;
  roles?: string[];
  scopes?: {
    organizations?: Array<{ id: string; role: string }>;
    departments?: Array<{
      id: string;
      role: string;
      organizationId?: string | null;
    }>;
    projects?: Array<{ id: string; role: string }>;
  };
};

type ProjectLike = {
  id: string;
  departmentId?: string | null;
  department?: {
    id?: string | null;
    organizationId?: string | null;
  } | null;
  members?: Array<{
    userId?: string | null;
    role?: string | null;
  }>;
};

function projectDepartmentId(project: ProjectLike) {
  return project.departmentId || project.department?.id || null;
}

function projectOrganizationId(project: ProjectLike) {
  return project.department?.organizationId || null;
}

export function canManageProjectScope(
  user: ScopedSessionUser | undefined,
  project: ProjectLike,
) {
  const roles = user?.roles || [];
  if (roles.includes("ADMIN")) return true;

  const departmentId = projectDepartmentId(project);
  const organizationId = projectOrganizationId(project);

  const managesDepartment = (user?.scopes?.departments || []).some(
    (department) =>
      department.role === "DEPARTMENT_MANAGER" &&
      department.id === departmentId,
  );
  if (managesDepartment) return true;

  const managesOrganization = (user?.scopes?.organizations || []).some(
    (organization) =>
      organization.role === "ORGANIZATION_MANAGER" &&
      organization.id === organizationId,
  );

  return managesOrganization;
}

export function canManageProject(
  user: ScopedSessionUser | undefined,
  project: ProjectLike,
) {
  if (canManageProjectScope(user, project)) return true;

  const managesByMembership = (project.members || []).some(
    (member) => member.userId === user?.id && member.role === "PROJECT_MANAGER",
  );
  if (managesByMembership) return true;

  return (user?.scopes?.projects || []).some(
    (projectScope) =>
      projectScope.id === project.id && projectScope.role === "PROJECT_MANAGER",
  );
}
