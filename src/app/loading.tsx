import { DashboardLayout } from "@/components/layout/DashboardLayout";

function ShimmerBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className}`}
      aria-hidden
    />
  );
}

export default function RootLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-8" role="status" aria-label="Loading page">
        <div className="space-y-2">
          <ShimmerBlock className="h-9 w-1/3" />
          <ShimmerBlock className="h-4 w-2/3" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3"
            >
              <ShimmerBlock className="h-4 w-1/2" />
              <ShimmerBlock className="h-8 w-2/3" />
              <ShimmerBlock className="h-3 w-1/3" />
            </div>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4"
            >
              <ShimmerBlock className="h-5 w-1/3" />
              <ShimmerBlock className="h-4 w-2/3" />
              <div className="space-y-3 pt-2">
                <ShimmerBlock className="h-14 w-full" />
                <ShimmerBlock className="h-14 w-full" />
                <ShimmerBlock className="h-14 w-full" />
              </div>
            </div>
          ))}
        </div>

        <span className="sr-only">Loading…</span>
      </div>
    </DashboardLayout>
  );
}
