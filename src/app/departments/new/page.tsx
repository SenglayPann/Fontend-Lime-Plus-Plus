"use client";

import { useMemo, useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  GraduationCap,
  Save,
  Building2,
  Loader2,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";

const departmentSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters"),
  organizationId: z.string().uuid("Please select an organization"),
  managerId: z.string().optional(),
  description: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;
type UserCandidate = {
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
type OrganizationCandidate = {
  id: string;
  name: string;
};

const ROLE_RANK: Record<string, number> = {
  ADMIN: 5,
  ORGANIZATION_MANAGER: 4,
  DEPARTMENT_MANAGER: 3,
  PROJECT_MANAGER: 2,
  PROJECT_MEMBER: 1,
};

export default function NewDepartmentPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const roles = useMemo(() => session?.user?.roles || [], [session?.user?.roles]);
  const hasOrganizationScope = (
    session?.user?.scopes?.organizations || []
  ).some((scope) => scope.role === "ORGANIZATION_MANAGER");
  const canCreateDepartment = roles.includes("ADMIN") || hasOrganizationScope;

  const [organizations, setOrganizations] = useState<
    { value: string; label: string }[]
  >([]);
  const [userCandidates, setUserCandidates] = useState<UserCandidate[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      organizationId: "",
      managerId: "",
      description: "",
    },
  });

  const selectedOrgId = watch("organizationId");
  const selectedManagerId = watch("managerId");
  const managerOptions = useMemo(() => {
    const actorRank = highestRoleRank(roles);

    return userCandidates
      .filter((user) => {
        if (!selectedOrgId) return false;
        if (roles.includes("ADMIN")) return true;
        if (user.id === session?.user?.id) return true;

        return (
          userBelongsToOrganization(user, selectedOrgId) &&
          highestRoleRank(getUserEffectiveRoles(user)) < actorRank
        );
      })
      .map((user) => ({
        value: user.id,
        label: userLabel(user),
      }));
  }, [roles, selectedOrgId, session?.user?.id, userCandidates]);

  useEffect(() => {
    if (
      selectedManagerId &&
      !managerOptions.some((option) => option.value === selectedManagerId)
    ) {
      setValue("managerId", "");
    }
  }, [managerOptions, selectedManagerId, setValue]);

  useEffect(() => {
    async function fetchData() {
      if (status === "loading") return;
      if (!session?.user?.accessToken || !canCreateDepartment) {
        setIsLoadingData(false);
        return;
      }

      try {
        const orgsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/organizations`,
          {
            headers: { Authorization: `Bearer ${session.user.accessToken}` },
          },
        );
        const orgsJson = await orgsRes.json().catch(() => null);

        if (!orgsRes.ok) {
          throw new Error(
            orgsJson?.error?.message || "Failed to load organizations",
          );
        }

        const organizationData = Array.isArray(orgsJson)
          ? orgsJson
          : orgsJson?.data || [];
        const organizationScopeIds = new Set(
          (session.user.scopes?.organizations || [])
            .filter((scope) => scope.role === "ORGANIZATION_MANAGER")
            .map((scope) => scope.id),
        );
        const creatableOrganizations = roles.includes("ADMIN")
          ? organizationData
          : organizationData.filter((org: OrganizationCandidate) =>
              organizationScopeIds.has(org.id),
            );

        setOrganizations(
          creatableOrganizations.map((org: OrganizationCandidate) => ({
            value: org.id,
            label: org.name,
          })),
        );

        try {
          const usersRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/users`,
            {
              headers: { Authorization: `Bearer ${session.user.accessToken}` },
            },
          );
          const usersJson = await usersRes.json().catch(() => null);

          if (!usersRes.ok) {
            setUserCandidates([]);
            setUsersError(
              usersJson?.error?.message ||
                usersJson?.message ||
                "Could not load manager candidates.",
            );
            return;
          }

          const userData = Array.isArray(usersJson)
            ? usersJson
            : usersJson?.data || [];
          setUserCandidates(userData);
          setUsersError(null);
        } catch (err) {
          console.error("Failed to load department manager candidates:", err);
          setUserCandidates([]);
          setUsersError(
            "Could not load manager candidates. You can still create the department without assigning a manager.",
          );
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Could not load form data. Please refresh and try again.");
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchData();
  }, [canCreateDepartment, roles, session, status]);

  const onSubmit = async (data: DepartmentFormValues) => {
    if (!session?.user?.accessToken) return;
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/departments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.accessToken}`,
          },
          body: JSON.stringify({
            name: data.name,
            organization_id: data.organizationId,
            description: data.description,
            manager_user_id: data.managerId || undefined,
          }),
        },
      );

      if (!res.ok) {
        const json = await res.json();
        throw new Error(
          json.error?.message || json.message || "Failed to create department",
        );
      }

      router.push("/departments");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof TypeError && err.message === "Failed to fetch"
          ? "Could not reach the backend API. Check that the backend is running and allowed by CORS."
          : err instanceof Error
            ? err.message
            : "Failed to create department",
      );
    }
  };

  if (isLoadingData) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">
            Loading system data...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!canCreateDepartment) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          You do not have permission to create departments.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-1">
          <Link
            href="/departments"
            className="group flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />{" "}
            Back to Departments
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Add New Department
          </h1>
          <p className="text-muted-foreground text-lg">
            Set up a new academic or operational unit.
          </p>
        </div>

        <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  Department Configuration
                </CardTitle>
                <CardDescription>
                  Define your department and its leadership.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in zoom-in-95 duration-300">
                {error}
              </div>
            )}
            {usersError && (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
                Department creation is available, but manager candidates could
                not be loaded: {usersError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-primary" /> Parent
                    Organization
                  </Label>
                  <Combobox
                    options={organizations}
                    value={selectedOrgId}
                    onChange={(val) =>
                      setValue("organizationId", val, { shouldValidate: true })
                    }
                    placeholder="Select an organization..."
                    emptyText="No organizations found."
                  />
                  {errors.organizationId && (
                    <p className="text-xs font-medium text-destructive mt-1">
                      {errors.organizationId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="mb-1">
                    Department Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. Computer Science & Engineering"
                    className={cn(
                      errors.name &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs font-medium text-destructive mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 mb-1">
                    <UserCircle className="h-4 w-4 text-primary" /> Department
                    Manager (Optional)
                  </Label>
                  <Combobox
                    options={managerOptions}
                    value={selectedManagerId}
                    onChange={(val) => setValue("managerId", val)}
                    placeholder="Search for a user to assign..."
                    emptyText={
                      !selectedOrgId
                        ? "Select an organization first."
                        : usersError
                          ? "Manager candidates failed to load."
                          : "No eligible users found."
                    }
                    disabled={Boolean(usersError) || !selectedOrgId}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    This user will be granted the DEPARTMENT_MANAGER role.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="mb-1">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Briefly describe the department's focus and responsibilities..."
                    className="h-32 resize-none"
                    {...register("description")}
                  />
                </div>
              </div>

              <div className="pt-6 flex items-center justify-end gap-4 border-t border-border/50">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="px-8 gap-2 shadow-lg shadow-primary/20"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Create Department
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function userLabel(user: UserCandidate) {
  return user.name || user.githubUsername || user.email || "Unknown User";
}

function getUserEffectiveRoles(user: UserCandidate): string[] {
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

function userBelongsToOrganization(user: UserCandidate, organizationId: string) {
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
