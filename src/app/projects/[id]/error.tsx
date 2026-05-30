"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Project page error:", error);
  }, [error]);

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            We couldn’t load this project
          </h1>
          <p className="text-muted-foreground">
            The project may have been removed, your access may have changed, or
            the backend may be unreachable.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => reset()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" /> Back to projects
            </Link>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
