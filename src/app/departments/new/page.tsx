"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, GraduationCap, Save, Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewDepartmentPage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/departments");
  };

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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Building2 className="h-3 w-3" /> Parent Organization
                </label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option disabled selected>Select an organization...</option>
                  <option>Engineering Faculty</option>
                  <option>Science Institute</option>
                  <option>Tech Bootcamp A</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Department Name</label>
                <Input placeholder="e.g. Computer Science" required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Department Head / Manager</label>
                <Input placeholder="Search for a user to assign as manager..." />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea placeholder="Describe the department's role..." className="h-32" />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" className="gap-2">
                  <Save className="h-4 w-4" /> Create Department
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
