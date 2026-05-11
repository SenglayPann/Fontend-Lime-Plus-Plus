"use client";

import { useState } from "react";
import { 
  GraduationCap, 
  MoreHorizontal, 
  ExternalLink,
  FolderKanban,
  Building2,
  Trash2,
  Edit2,
  Search
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DepartmentTableProps {
  initialDepartments: any[];
  accessToken: string;
}

export function DepartmentTable({ initialDepartments, accessToken }: DepartmentTableProps) {
  const [departments, setDepartments] = useState(initialDepartments);
  const [filter, setFilter] = useState("");

  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(filter.toLowerCase()) ||
    (dept.organization?.name || "").toLowerCase().includes(filter.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department? This will also delete all projects within it.")) {
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (res.ok) {
        setDepartments(prev => prev.filter(d => d.id !== id));
      } else {
        alert("Failed to delete department");
      }
    } catch (error) {
      console.error("Error deleting department:", error);
      alert("An error occurred while deleting");
    }
  };

  return (
    <Card>
      <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter departments..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
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
              {filteredDepartments.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-muted-foreground">No departments found.</td></tr>
              )}
              {filteredDepartments.map((dept) => {
                const projectCount = dept._count?.projects || 0;
                const status = projectCount > 0 ? "Active" : "Idle";
                
                return (
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
                        <Building2 className="h-3 w-3" /> {dept.organization?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FolderKanban className="h-3 w-3" /> {projectCount}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        status === "Active" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                      )}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
                          <Link href={`/projects?departmentId=${dept.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 cursor-pointer">
                              <Edit2 className="h-3.5 w-3.5" /> Edit Dept
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                              onClick={() => handleDelete(dept.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
