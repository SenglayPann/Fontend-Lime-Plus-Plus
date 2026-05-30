import { DashboardLayout } from "@/components/layout/DashboardLayout";

function ShimmerBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className}`}
      aria-hidden
    />
  );
}

export default function ProjectDetailLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-8" role="status" aria-label="Loading project">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <ShimmerBlock className="h-4 w-32" />
            <ShimmerBlock className="h-9 w-72" />
            <ShimmerBlock className="h-4 w-56" />
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <ShimmerBlock key={idx} className="h-9 w-24" />
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3"
            >
              <ShimmerBlock className="h-4 w-1/2" />
              <ShimmerBlock className="h-8 w-1/3" />
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4"
            >
              <ShimmerBlock className="h-5 w-1/3" />
              <ShimmerBlock className="h-64 w-full" />
            </div>
          ))}
        </div>

        <span className="sr-only">Loading project…</span>
      </div>
    </DashboardLayout>
  );
}
