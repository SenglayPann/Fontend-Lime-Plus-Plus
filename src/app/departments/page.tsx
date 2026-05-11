import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  Plus, 
  Search, 
  MoreHorizontal, 
  ExternalLink,
  FolderKanban,
  Building2
} from "lucide-react";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function fetchDepartments(token: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (error) {
    console.error("Error fetching departments:", error);
    return [];
  }
}

export default async function DepartmentsPage() {
  const session = await getServerSession(authOptions);
  let departments: any[] = [];

  if (session?.user?.accessToken) {
    departments = await fetchDepartments(session.user.accessToken);
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Departments</h1>
            <p className="text-muted-foreground mt-2">Manage academic departments within your organizations.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add Department
          </Button>
        </div>

        <Card>
          <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter departments..."
                  className="h-9 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border">
                  <tr>
                    <th className="px-6 py-4">Department Name</th>
                    <th className="px-6 py-4">Organization</th>
                    <th className="px-6 py-4">Active Projects</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {departments.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-4 text-center text-muted-foreground">No departments found.</td></tr>
                  )}
                  {departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                            <GraduationCap className="h-4 w-4" />
                          </div>
                          <span className="font-medium text-foreground">{dept.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-3 w-3" /> {dept.organization?.name || dept.org || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FolderKanban className="h-3 w-3" /> {dept._count?.projects || dept.projects?.length || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          (dept.status || 'Active') === "Active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          {dept.status || 'Active'}
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
        </Card>
      </div>
    </DashboardLayout>
  );
}

import { cn } from "@/lib/utils";
