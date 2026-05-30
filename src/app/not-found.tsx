import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Compass className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-primary">404</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Page not found
          </h1>
          <p className="text-muted-foreground">
            The page you’re looking for doesn’t exist or has been moved. Use
            the sidebar or head back to your dashboard.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard">
            <Home className="h-4 w-4" /> Back to dashboard
          </Link>
        </Button>
      </div>
    </DashboardLayout>
  );
}
