"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface ReportDownloadButtonProps {
  projectId: string;
  userId?: string;
  type: "individual" | "project";
  format: "pdf" | "csv";
}

export function ReportDownloadButton({
  projectId,
  userId,
  type,
  format,
}: ReportDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  const handleDownload = async () => {
    setLoading(true);
    try {
      const endpoint =
        type === "individual"
          ? `${process.env.NEXT_PUBLIC_API_URL}/reports/projects/${projectId}/users/${userId}/pdf`
          : `${process.env.NEXT_PUBLIC_API_URL}/reports/projects/${projectId}/${format}`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${session?.user?.accessToken}`,
        },
      });

      if (!response.ok) {
        let message = "Failed to generate report";
        try {
          const json = await response.json();
          message =
            json?.message ||
            json?.error?.message ||
            json?.error ||
            message;
        } catch {
          // Body wasn't JSON — keep the default message.
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        getFilenameFromDisposition(
          response.headers.get("Content-Disposition"),
        ) ||
        (type === "individual"
          ? `lime_individual_report_${userId}.pdf`
          : `lime_project_report_${projectId}.${format}`);
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error(error?.message || "Failed to download report");
    } finally {
      setLoading(false);
    }
  };

  const Icon = format === "pdf" ? FileText : FileSpreadsheet;

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      disabled={loading}
      onClick={handleDownload}
    >
      {loading ? (
        <Loader2 data-testid="loader" className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      {format === "pdf" ? "Export PDF" : "Export CSV"}
    </Button>
  );
}

function getFilenameFromDisposition(disposition: string | null) {
  if (!disposition) return null;

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);

  const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
  return asciiMatch?.[1] || null;
}
