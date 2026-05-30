import { DashboardLayout } from "@/components/layout/DashboardLayout";

function ShimmerBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className}`}
      aria-hidden
    />
  );
}

export default function ProjectTasksLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-6" role="status" aria-label="Loading tasks">
        <div className="space-y-2">
          <ShimmerBlock className="h-4 w-32" />
          <ShimmerBlock className="h-9 w-56" />
          <ShimmerBlock className="h-4 w-80" />
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-muted/20 px-6 py-4 flex items-center justify-between">
            <ShimmerBlock className="h-9 w-72" />
            <ShimmerBlock className="h-9 w-40" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="grid grid-cols-8 gap-4 px-6 py-4 items-center"
              >
                <ShimmerBlock className="h-4 col-span-1" />
                <ShimmerBlock className="h-4 col-span-2" />
                <ShimmerBlock className="h-6 col-span-1" />
                <ShimmerBlock className="h-9 col-span-1" />
                <ShimmerBlock className="h-9 col-span-1" />
                <ShimmerBlock className="h-9 col-span-1" />
                <ShimmerBlock className="h-6 col-span-1" />
              </div>
            ))}
          </div>
        </div>

        <span className="sr-only">Loading tasks…</span>
      </div>
    </DashboardLayout>
  );
}
