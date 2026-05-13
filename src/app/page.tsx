import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const roles = session.user.roles || [];
  const scopes = session.user.scopes;
  const hasManagementScope =
    roles.includes("ADMIN") ||
    (scopes?.organizations || []).some(
      (scope) => scope.role === "ORGANIZATION_MANAGER",
    ) ||
    (scopes?.departments || []).some(
      (scope) => scope.role === "DEPARTMENT_MANAGER",
    ) ||
    (scopes?.projects || []).some((scope) => scope.role === "PROJECT_MANAGER");

  redirect(hasManagementScope ? "/dashboard" : "/dashboard/my-contributions");
}
