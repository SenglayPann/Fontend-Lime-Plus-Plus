"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  FolderKanban,
  Github,
  Lock,
  Plus,
  Search,
  Unlock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  name: string;
  repository?: string | null;
  status: string;
  updatedAt?: string | null;
  createdAt?: string | null;
  department?: { name?: string | null } | null;
  members?: unknown[];
  _count?: { members?: number };
};

interface ProjectListClientProps {
  initialProjects: Project[];
  departmentId?: string;
}

export function ProjectListClient({ initialProjects, departmentId }: ProjectListClientProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");

  const projects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return initialProjects.filter((project) => {
      const matchesQuery =
        !normalizedQuery ||
        project.name.toLowerCase().includes(normalizedQuery) ||
        (project.repository || "").toLowerCase().includes(normalizedQuery) ||
        (project.department?.name || "").toLowerCase().includes(normalizedQuery);

      const matchesStatus = status === "ALL" || project.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [initialProjects, query, status]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-2">
            {departmentId
              ? "Projects filtered by the selected department."
              : "Oversee and manage active evaluation projects."}
          </p>
        </div>
        <Button className="gap-2" asChild>
          <Link href="/projects/new">
            <Plus className="h-4 w-4" /> Create Project
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects..."
            className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Filter projects by status"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="LOCKED">Locked</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 && (
          <p className="text-muted-foreground col-span-full">
            No projects match the current search or filter.
          </p>
        )}
        {projects.map((project) => {
          const updatedAt = project.updatedAt || project.createdAt;

          return (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:border-primary/50 transition-all cursor-pointer group">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <FolderKanban className="h-5 w-5" />
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        project.status === "ACTIVE"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {project.status === "ACTIVE" ? (
                        <Unlock className="h-3 w-3 mr-1" />
                      ) : (
                        <Lock className="h-3 w-3 mr-1" />
                      )}
                      {project.status}
                    </span>
                  </div>
                  <CardTitle className="mt-4">{project.name}</CardTitle>
                  <CardDescription>{project.department?.name || "No Department"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Users className="h-3 w-3 mr-1" /> Members
                      </p>
                      <p className="text-sm font-semibold">
                        {project._count?.members || project.members?.length || 0}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center">
                        <FolderKanban className="h-3 w-3 mr-1" /> Repository
                      </p>
                      <p className="text-sm font-semibold truncate max-w-full" title={project.repository || undefined}>
                        {project.repository || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {updatedAt ? `Updated ${new Date(updatedAt).toLocaleDateString()}` : "No update date"}
                    </span>
                    <span className="flex items-center text-primary">
                      View Details <Github className="h-3 w-3 ml-1" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
