import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const roles = session.user.roles || [];
  const hasManagementRole = roles.some((role) =>
    [
      "ADMIN",
      "ORGANIZATION_OWNER",
      "DEPARTMENT_MANAGER",
      "PROJECT_MANAGER",
    ].includes(role),
  );

  redirect(hasManagementRole ? "/dashboard" : "/dashboard/my-contributions");
}
