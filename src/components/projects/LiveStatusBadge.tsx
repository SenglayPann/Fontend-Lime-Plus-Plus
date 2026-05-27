"use client";

import { cn } from "@/lib/utils";
import type { LiveStatus } from "@/hooks/use-project-live-updates";

interface LiveStatusBadgeProps {
  status: LiveStatus;
  className?: string;
}

const COPY: Record<LiveStatus, { label: string; dot: string; text: string }> = {
  connecting: {
    label: "Connecting",
    dot: "bg-muted-foreground/60 animate-pulse",
    text: "text-muted-foreground",
  },
  live: {
    label: "Live",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
  },
  reconnecting: {
    label: "Reconnecting",
    dot: "bg-amber-500 animate-pulse",
    text: "text-amber-700",
  },
  disabled: {
    label: "Offline",
    dot: "bg-muted-foreground/40",
    text: "text-muted-foreground",
  },
};

export function LiveStatusBadge({ status, className }: LiveStatusBadgeProps) {
  const copy = COPY[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2 py-0.5 text-xs font-medium",
        copy.text,
        className,
      )}
      title="Project updates stream from GitHub via webhooks."
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", copy.dot)} />
      {copy.label}
    </span>
  );
}
