import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Plus, 
  Search, 
  MoreHorizontal, 
  ExternalLink,
  Users
} from "lucide-react";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function fetchOrganizations(token: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return [];
  }
}

export default async function OrganizationsPage() {
  const session = await getServerSession(authOptions);
  let organizations: any[] = [];

  if (session?.user?.accessToken) {
    organizations = await fetchOrganizations(session.user.accessToken);
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Organizations</h1>
            <p className="text-muted-foreground mt-2">Manage all top-level organizations and their licenses.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add Organization
          </Button>
        </div>

        <Card>
          <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter organizations..."
                  className="h-9 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Filters</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border">
                  <tr>
                    <th className="px-6 py-4">Organization Name</th>
                    <th className="px-6 py-4">License Plan</th>
                    <th className="px-6 py-4">Departments</th>
                    <th className="px-6 py-4">Total Users</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {organizations.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">No organizations found.</td></tr>
                  )}
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <span className="font-medium text-foreground">{org.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {org.license || "Standard"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{org.departments?.length || 0}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-3 w-3" /> {org.users?.length || org._count?.users || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          (org.status || "Active") === "Active" ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700"
                        )}>
                          {org.status || "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
          <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/10">
            <p className="text-xs text-muted-foreground">Showing {organizations.length} results</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

import { cn } from "@/lib/utils";
