"use client";

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
import { ArrowLeft, Building2, Loader2, Save, UserCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Combobox } from "@/components/ui/combobox";

export default function NewOrganizationPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
  const [managerId, setManagerId] = useState("");

  const isAdmin = session?.user?.roles?.includes("ADMIN");

  useEffect(() => {
    async function fetchUsers() {
      if (status === "loading" || !isAdmin || !session?.user?.accessToken) {
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
        });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(
            json.error?.message || json.message || "Failed to load users",
          );
        }

        const userData = Array.isArray(json) ? json : json.data || [];
        setUsers(
          userData.map((user: any) => ({
            value: user.id,
            label:
              user.name || user.githubUsername || user.email || "Unknown User",
          })),
        );
        setUsersError(null);
      } catch (err) {
        console.error("Failed to load organization manager candidates:", err);
        setUsersError("Could not load manager candidates.");
      }
    }

    fetchUsers();
  }, [isAdmin, session, status]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session?.user?.accessToken || !isAdmin) return;

    const formData = new FormData(e.currentTarget);
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/organizations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.accessToken}`,
          },
          body: JSON.stringify({
            name: formData.get("name"),
            license_plan: formData.get("license_plan"),
            manager_user_id: managerId || undefined,
          }),
        },
      );
      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error?.message ||
            json.message ||
            "Failed to create organization",
        );
      }

      router.push("/organizations");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create organization");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          You do not have permission to create organizations.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-1">
          <Link
            href="/organizations"
            className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Organizations
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Add New Organization
          </h1>
          <p className="text-muted-foreground">
            Register a new top-level organization in the Lime++ system.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>
                  Enter the primary information for the organization.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
                {error}
              </div>
            )}
            {usersError && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
                {usersError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Organization Name
                </label>
                <Input
                  name="name"
                  placeholder="e.g. Faculty of Engineering"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  License Plan
                </label>
                <select
                  name="license_plan"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="standard">Standard</option>
                  <option value="academic">Academic</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="trial">Trial</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <UserCircle className="h-4 w-4 text-primary" />
                  Organization Manager (Optional)
                </label>
                <Combobox
                  options={users}
                  value={managerId}
                  onChange={setManagerId}
                  placeholder="Search for a user to assign..."
                  emptyText={
                    usersError ? "Manager candidates failed to load." : "No users found."
                  }
                  disabled={Boolean(usersError)}
                />
                <p className="text-[10px] text-muted-foreground">
                  This user will be granted the ORGANIZATION_MANAGER role.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="gap-2" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}{" "}
                  Save Organization
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
