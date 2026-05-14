"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface ScopeExportButtonProps {
  endpoint: string;
  filename: string;
  label?: string;
}

export function ScopeExportButton({
  endpoint,
  filename,
  label = "Export CSV",
}: ScopeExportButtonProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    if (!session?.user?.accessToken) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        {
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to export CSV");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        getFilenameFromDisposition(response.headers.get("Content-Disposition")) ||
        filename;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
    } catch (error) {
      console.error("Export error:", error);
      setError("Failed to export CSV. Please check your permissions.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={download}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        <Download className="hidden h-4 w-4 sm:block" />
        {label}
      </Button>
      {error && (
        <p className="max-w-64 text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function getFilenameFromDisposition(disposition: string | null) {
  if (!disposition) return null;

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);

  const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
  return asciiMatch?.[1] || null;
}
