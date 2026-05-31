import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { ArrowLeft, History } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";

// Audit log grows as webhooks land; bypass the Router Cache so navigating
// back to this tab shows the latest entries.
export const dynamic = "force-dynamic";

type ApiResult<T> = { data?: T; error?: string };

async function fetchApi<T>(path: string, token: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const json = await res.json();

    if (!res.ok) {
      return { error: json.error?.message || json.message || "Request failed" };
    }

    return { data: json.success ? json.data : json };
  } catch (error: any) {
    return { error: error.message || "Request failed" };
  }
}

function actorName(entry: any) {
  return (
    entry.actor?.name ||
    entry.actor?.githubUsername ||
    entry.actor?.email ||
    entry.actorId ||
    "System"
  );
}

function formatMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return "No metadata";
  return JSON.stringify(metadata);
}

export default async function ProjectAuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.accessToken) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">
          You need to sign in to view audit logs.
        </p>
      </DashboardLayout>
    );
  }

  const token = session.user.accessToken;
  const [projectResult, auditResult] = await Promise.all([
    fetchApi<any>(`/projects/${id}`, token),
    fetchApi<any[]>(`/audit-logs?project_id=${encodeURIComponent(id)}`, token),
  ]);

  if (projectResult.error || !projectResult.data) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {projectResult.error || "Project not found"}
        </div>
      </DashboardLayout>
    );
  }

  const logs = auditResult.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="space-y-1">
          <Link
            href={`/projects/${id}`}
            className="flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Project
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Project Audit
          </h1>
          <p className="text-muted-foreground">{projectResult.data.name}</p>
        </div>

        {auditResult.error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
            {auditResult.error}
          </div>
        )}

        <Card>
          <CardHeader className="border-b border-border/60">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> Audit Events
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Actor</th>
                    <th className="px-6 py-4">Metadata</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-muted-foreground"
                      >
                        No audit events found for this project.
                      </td>
                    </tr>
                  )}
                  {logs.map((entry) => (
                    <tr key={entry.id} className="hover:bg-muted/20">
                      <td className="px-6 py-4 font-medium">
                        {String(entry.action).replace("_", " ")}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {actorName(entry)}
                      </td>
                      <td className="max-w-xl truncate px-6 py-4 font-mono text-xs text-muted-foreground">
                        {formatMetadata(entry.metadata)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {entry.createdAt
                          ? new Date(entry.createdAt).toLocaleString()
                          : "Unknown"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
