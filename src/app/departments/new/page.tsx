"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, GraduationCap, Save, Building2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function NewDepartmentPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    organizationId: "",
    managerId: "",
    description: ""
  });

  useEffect(() => {
    async function fetchData() {
      if (!session?.user?.accessToken) return;

      try {
        const [orgsRes, usersRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations`, {
            headers: { Authorization: `Bearer ${session.user.accessToken}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
            headers: { Authorization: `Bearer ${session.user.accessToken}` }
          })
        ]);

        const orgsJson = await orgsRes.json();
        const usersJson = await usersRes.json();

        if (orgsJson.success) setOrganizations(orgsJson.data);
        if (Array.isArray(usersJson)) {
           setUsers(usersJson);
        } else if (usersJson.success) {
           setUsers(usersJson.data);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Could not load form data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.accessToken) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`
        },
        body: JSON.stringify({
          name: formData.name,
          organization_id: formData.organizationId
        })
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || "Failed to create department");
      }

      // If manager is selected, assign the role
      const createdDept = await res.json();
      if (formData.managerId && createdDept.success) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${formData.managerId}/roles`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.accessToken}`
          },
          body: JSON.stringify({
            role: "DEPARTMENT_MANAGER",
            department_id: createdDept.data.id
          })
        });
      }

      router.push("/departments");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-1">
          <Link href="/departments" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Departments
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Add New Department</h1>
          <p className="text-muted-foreground">Create a new academic or operational department within an organization.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Department Details</CardTitle>
                <CardDescription>Associate this department with a parent organization.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Building2 className="h-3 w-3" /> Parent Organization
                </label>
                <select 
                  required
                  value={formData.organizationId}
                  onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="" disabled>Select an organization...</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Department Name</label>
                <Input 
                  placeholder="e.g. Computer Science" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Department Head / Manager (Optional)</label>
                <select 
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">No manager assigned yet</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name || user.githubUsername}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea 
                  placeholder="Describe the department's role..." 
                  className="h-32" 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => router.back()} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" className="gap-2" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
