"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Lock, 
  Unlock, 
  Github,
  Calendar,
  Users,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ProjectsPage() {
  const projects = [
    { 
      id: "1", 
      name: "Lime++ Backend", 
      org: "Engineering Faculty", 
      dept: "Computer Science",
      status: "ACTIVE", 
      tasks: 24, 
      members: 5, 
      avgScore: 88,
      lastSync: "2 hours ago"
    },
    { 
      id: "2", 
      name: "Project Alpha", 
      org: "Science Institute", 
      dept: "Mathematics",
      status: "LOCKED", 
      tasks: 15, 
      members: 3, 
      avgScore: 72,
      lastSync: "1 day ago"
    },
    { 
      id: "3", 
      name: "Smart City App", 
      org: "Engineering Faculty", 
      dept: "Information Technology",
      status: "ACTIVE", 
      tasks: 42, 
      members: 8, 
      avgScore: 91,
      lastSync: "Just now"
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-2">Oversee and manage active evaluation projects.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Create Project
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button variant="outline">Filters</Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:border-primary/50 transition-all cursor-pointer group">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <FolderKanban className="h-5 w-5" />
                    </div>
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      project.status === "ACTIVE" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {project.status === "ACTIVE" ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                      {project.status}
                    </span>
                  </div>
                  <CardTitle className="mt-4">{project.name}</CardTitle>
                  <CardDescription>{project.org} • {project.dept}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Users className="h-3 w-3 mr-1" /> Members
                      </p>
                      <p className="text-sm font-semibold">{project.members}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Trophy className="h-3 w-3 mr-1" /> Avg. Score
                      </p>
                      <p className="text-sm font-semibold">{project.avgScore}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" /> Updated {project.lastSync}
                    </span>
                    <span className="flex items-center text-primary">
                      View Details <Github className="h-3 w-3 ml-1" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
