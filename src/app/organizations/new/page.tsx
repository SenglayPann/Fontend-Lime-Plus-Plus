"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Building2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewOrganizationPage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to save org
    router.push("/organizations");
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-1">
          <Link href="/organizations" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Organizations
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Add New Organization</h1>
          <p className="text-muted-foreground">Register a new top-level organization in the Lime++ system.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>Enter the primary information for the organization.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Organization Name</label>
                <Input placeholder="e.g. Faculty of Engineering" required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea placeholder="Describe the organization's purpose or scope..." className="h-32" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">License Plan</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>Standard</option>
                    <option>Academic</option>
                    <option>Enterprise</option>
                    <option>Trial</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Contact Email</label>
                  <Input type="email" placeholder="admin@org.edu" />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" className="gap-2">
                  <Save className="h-4 w-4" /> Save Organization
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
