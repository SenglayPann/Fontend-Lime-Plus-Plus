"use client";

import { AlertCircle, Bell, Info, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export type AlertType = "info" | "warning" | "success" | "error";

export interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  time: string;
}

const styles: Record<AlertType, { bg: string; text: string; icon: any; border: string }> = {
  info: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400", icon: Info, border: "border-blue-200" },
  warning: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", icon: AlertCircle, border: "border-amber-200 dark:border-amber-900/50" },
  success: { bg: "bg-primary/10", text: "text-primary", icon: CheckCircle2, border: "border-primary/20" },
  error: { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400", icon: X, border: "border-red-200" },
};

export function AlertsList({ alerts: initialAlerts }: { alerts: AlertItem[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);

  const dismiss = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-4">
      {alerts.map((alert) => {
        const style = styles[alert.type];
        const Icon = style.icon;

        return (
          <div 
            key={alert.id} 
            className={cn(
              "relative flex gap-4 rounded-xl border p-4 shadow-sm transition-all",
              style.bg,
              style.border
            )}
          >
            <div className={cn("h-10 w-10 shrink-0 rounded-full flex items-center justify-center bg-white shadow-sm", style.text)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 pr-8">
              <div className="flex items-center justify-between mb-1">
                <h4 className={cn("text-sm font-bold", style.text)}>{alert.title}</h4>
                <span className="text-[10px] uppercase font-bold opacity-70">{alert.time}</span>
              </div>
              <p className="text-sm opacity-90 leading-relaxed text-foreground/80">{alert.message}</p>
            </div>
            <button 
              onClick={() => dismiss(alert.id)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
