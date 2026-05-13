"use client";

import { useState, useEffect } from "react";
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

export default function NewDepartmentPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const roles = session?.user?.roles || [];
  const hasOrganizationScope = (
    session?.user?.scopes?.organizations || []
  ).some((scope) => scope.role === "ORGANIZATION_MANAGER");
  const canCreateDepartment = roles.includes("ADMIN") || hasOrganizationScope;

  const [organizations, setOrganizations] = useState<
    { value: string; label: string }[]
  >([]);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
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

  useEffect(() => {
    async function fetchData() {
      if (status === "loading") return;
      if (!session?.user?.accessToken || !canCreateDepartment) {
        setIsLoadingData(false);
        return;
      }

      try {
        const [orgsRes, usersRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations`, {
            headers: { Authorization: `Bearer ${session.user.accessToken}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
            headers: { Authorization: `Bearer ${session.user.accessToken}` },
          }),
        ]);

        const orgsJson = await orgsRes.json();
        const usersJson = await usersRes.json();

        if (!orgsRes.ok) {
          throw new Error(
            orgsJson.error?.message || "Failed to load organizations",
          );
        }

        if (!usersRes.ok) {
          throw new Error(usersJson.error?.message || "Failed to load users");
        }

        if (orgsJson.success) {
          const organizationScopeIds = new Set(
            (session.user.scopes?.organizations || [])
              .filter((scope) => scope.role === "ORGANIZATION_MANAGER")
              .map((scope) => scope.id),
          );
          const creatableOrganizations = roles.includes("ADMIN")
            ? orgsJson.data
            : orgsJson.data.filter((org: any) =>
                organizationScopeIds.has(org.id),
              );

          setOrganizations(
            creatableOrganizations.map((org: any) => ({
              value: org.id,
              label: org.name,
            })),
          );
        }

        const userData = Array.isArray(usersJson)
          ? usersJson
          : usersJson.data || [];
        setUsers(
          userData.map((user: any) => ({
            value: user.id,
            label:
              user.name || user.githubUsername || user.email || "Unknown User",
          })),
        );
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Could not load form data. Please refresh and try again.");
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchData();
  }, [canCreateDepartment, session, status]);

  const onSubmit = async (data: DepartmentFormValues) => {
    if (!session?.user?.accessToken) return;
    setError(null);

    try {
      // 1. Create the Department
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
          }),
        },
      );

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || "Failed to create department");
      }

      const result = await res.json();
      const createdDeptId = result.data.id;

      // 2. If manager is selected, assign the role
      if (data.managerId) {
        const roleRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/${data.managerId}/roles`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.user.accessToken}`,
            },
            body: JSON.stringify({
              role: "DEPARTMENT_MANAGER",
              department_id: createdDeptId,
            }),
          },
        );

        if (!roleRes.ok) {
          const roleJson = await roleRes.json().catch(() => null);
          throw new Error(
            roleJson?.error?.message ||
              roleJson?.message ||
              "Department was created, but manager assignment failed",
          );
        }
      }

      router.push("/departments");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
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
                    options={users}
                    value={selectedManagerId}
                    onChange={(val) => setValue("managerId", val)}
                    placeholder="Search for a user to assign..."
                    emptyText="No users found."
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
