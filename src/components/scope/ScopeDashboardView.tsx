import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FolderKanban,
  GitPullRequest,
  GraduationCap,
  Trophy,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScopeExportButton } from "@/components/reports/ScopeExportButton";

type ScopeDashboardData = {
  scope: {
    type: "organization" | "department";
    id: string;
    name: string;
    licensePlan?: string | null;
    description?: string | null;
    organizationId?: string | null;
    organizationName?: string | null;
    managers?: string[];
  };
  summary: {
    departments: number;
    projects: number;
    activeProjects: number;
    lockedProjects: number;
    members: number;
    activeContributors: number;
    tasks: number;
    doneTasks: number;
    pullRequests: number;
    mergedPrs: number;
    avgScore: number;
    avgDoneTasks: number;
  };
  departments?: Array<{
    id: string;
    name: string;
    managerNames: string[];
    projects: number;
    activeProjects: number;
    members: number;
    doneTasks: number;
    mergedPrs: number;
    avgScore: number;
  }>;
  projects: Array<{
    id: string;
    name: string;
    status: string;
    repository: string;
    departmentId: string;
    departmentName: string;
    members: number;
    tasks: number;
    doneTasks: number;
    mergedPrs: number;
    avgScore: number;
  }>;
  contributors: Array<{
    userId: string;
    name: string;
    githubUsername: string;
    projectCount: number;
    totalScore: number;
    doneTasks: number;
    mergedPrs: number;
    approvedReviews: number;
  }>;
};

interface ScopeDashboardViewProps {
  data: ScopeDashboardData;
  backHref: string;
}

export function ScopeDashboardView({ data, backHref }: ScopeDashboardViewProps) {
  const isOrganization = data.scope.type === "organization";
  const titleIcon = isOrganization ? Building2 : GraduationCap;
  const TitleIcon = titleIcon;
  const exportEndpoint = isOrganization
    ? `/reports/organizations/${data.scope.id}/csv`
    : `/reports/departments/${data.scope.id}/csv`;
  const exportFilename = isOrganization
    ? `lime_organization_scores_${data.scope.id}.csv`
    : `lime_department_scores_${data.scope.id}.csv`;

  const summaryCards = [
    {
      label: "Projects",
      value: data.summary.projects,
      icon: FolderKanban,
    },
    {
      label: "Members",
      value: data.summary.members,
      icon: Users,
    },
    {
      label: "Done Tasks",
      value: data.summary.doneTasks,
      icon: CheckCircle2,
    },
    {
      label: "Avg. Score",
      value: data.summary.avgScore,
      icon: Trophy,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Link
            href={backHref}
            className="flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
              <TitleIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {data.scope.name}
              </h1>
              <p className="text-muted-foreground">
                {isOrganization
                  ? `Organization dashboard - ${data.scope.licensePlan || "standard"}`
                  : `${data.scope.organizationName || "Organization"} department dashboard`}
              </p>
            </div>
          </div>
        </div>
        <ScopeExportButton
          endpoint={exportEndpoint}
          filename={exportFilename}
          label="Export Scores"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
              <card.icon className="h-6 w-6 text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Active Projects" value={data.summary.activeProjects} />
        <MetricCard label="Locked Projects" value={data.summary.lockedProjects} />
        <MetricCard label="Merged PRs" value={data.summary.mergedPrs} />
        <MetricCard label="Avg. Done Tasks" value={data.summary.avgDoneTasks} />
      </div>

      {isOrganization && data.departments && (
        <Card>
          <CardHeader>
            <CardTitle>Departments</CardTitle>
            <CardDescription>
              Department performance within this organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Managers</th>
                    <th className="px-6 py-4">Projects</th>
                    <th className="px-6 py-4">Members</th>
                    <th className="px-6 py-4">Done</th>
                    <th className="px-6 py-4">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.departments.map((department) => (
                    <tr key={department.id} className="hover:bg-muted/20">
                      <td className="px-6 py-4 font-medium">
                        <Link
                          href={`/departments/${department.id}`}
                          className="text-primary hover:underline"
                        >
                          {department.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {department.managerNames.length > 0
                          ? department.managerNames.join(", ")
                          : "Not assigned"}
                      </td>
                      <td className="px-6 py-4">{department.projects}</td>
                      <td className="px-6 py-4">{department.members}</td>
                      <td className="px-6 py-4">{department.doneTasks}</td>
                      <td className="px-6 py-4">{department.avgScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>Managed project outcomes in this scope.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4">Project</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Members</th>
                    <th className="px-6 py-4">Done</th>
                    <th className="px-6 py-4">Merged</th>
                    <th className="px-6 py-4">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.projects.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-muted-foreground"
                      >
                        No projects found in this scope.
                      </td>
                    </tr>
                  )}
                  {data.projects.map((project) => (
                    <tr key={project.id} className="hover:bg-muted/20">
                      <td className="px-6 py-4 font-medium">
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-primary hover:underline"
                        >
                          {project.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {project.repository}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {project.departmentName}
                      </td>
                      <td className="px-6 py-4">{project.status}</td>
                      <td className="px-6 py-4">{project.members}</td>
                      <td className="px-6 py-4">{project.doneTasks}</td>
                      <td className="px-6 py-4">{project.mergedPrs}</td>
                      <td className="px-6 py-4">{project.avgScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Contributors</CardTitle>
            <CardDescription>
              Contributors ranked by total score in this scope.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.contributors.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No contributor scores found.
              </p>
            )}
            {data.contributors.map((contributor, index) => (
              <div
                key={contributor.userId}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {index + 1}. {contributor.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {contributor.githubUsername
                      ? `@${contributor.githubUsername}`
                      : `${contributor.projectCount} project(s)`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{contributor.totalScore}</p>
                  <p className="text-xs text-muted-foreground">
                    {contributor.doneTasks} done
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SmallEvidenceCard
          icon={FolderKanban}
          label="Tasks"
          value={data.summary.tasks}
        />
        <SmallEvidenceCard
          icon={GitPullRequest}
          label="Pull Requests"
          value={data.summary.pullRequests}
        />
        <SmallEvidenceCard
          icon={Users}
          label="Active Contributors"
          value={data.summary.activeContributors}
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function SmallEvidenceCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FolderKanban;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
        <Icon className="h-5 w-5 text-primary" />
      </CardContent>
    </Card>
  );
}
