import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { 
  Plus
} from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { DepartmentTable } from "@/components/departments/DepartmentTable";

async function fetchDepartments(token: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 }, // Disable cache for real-time count
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
          <Button className="gap-2" asChild>
            <Link href="/departments/new">
              <Plus className="h-4 w-4" /> Add Department
            </Link>
          </Button>
        </div>

        <DepartmentTable 
          initialDepartments={departments} 
          accessToken={session?.user?.accessToken || ""} 
        />
      </div>
    </DashboardLayout>
  );
}
