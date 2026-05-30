"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Building2,
  LayoutDashboard,
  GraduationCap,
  FolderKanban,
  LogOut,
  Trophy,
  Users,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    visibility: "management",
  },
  {
    name: "My Contributions",
    href: "/dashboard/my-contributions",
    icon: Trophy,
    visibility: "all",
  },
  {
    name: "Organizations",
    href: "/organizations",
    icon: Building2,
    visibility: "organizations",
  },
  {
    name: "Departments",
    href: "/departments",
    icon: GraduationCap,
    visibility: "departments",
  },
  {
    name: "Project Managers",
    href: "/project-managers",
    icon: Users,
    visibility: "project-managers-admin",
  },
  {
    name: "Projects",
    href: "/projects",
    icon: FolderKanban,
    visibility: "projects",
  },
  {
    name: "Users & Roles",
    href: "/users",
    icon: UserCog,
    visibility: "users",
  },
];

interface SidebarContentProps {
  /**
   * Called whenever a nav link or the sign-out button is activated. Lets the
   * mobile drawer close itself in response to a navigation choice.
   */
  onNavigate?: () => void;
}

export function SidebarContent({ onNavigate }: SidebarContentProps = {}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userRoles = session?.user?.roles?.length
    ? session.user.roles
    : [session?.user?.role || "PROJECT_MEMBER"];
  const scopes = session?.user?.scopes;
  const isAdmin = userRoles.includes("ADMIN");
  const hasOrganizationScope = (scopes?.organizations || []).some(
    (scope) => scope.role === "ORGANIZATION_MANAGER",
  );
  const hasDepartmentScope = (scopes?.departments || []).some(
    (scope) => scope.role === "DEPARTMENT_MANAGER",
  );
  const hasDepartmentProjectManagerScope = (scopes?.departments || []).some(
    (scope) => scope.role === "PROJECT_MANAGER",
  );
  const hasProjectManagerScope = (scopes?.projects || []).some(
    (scope) => scope.role === "PROJECT_MANAGER",
  );
  const hasProjectScope =
    (scopes?.projects || []).length > 0 || hasDepartmentProjectManagerScope;
  const hasManagementScope =
    isAdmin ||
    hasOrganizationScope ||
    hasDepartmentScope ||
    hasProjectManagerScope ||
    hasDepartmentProjectManagerScope;
  const canAssignRoles = isAdmin || hasOrganizationScope;
  const isDepartmentOnlyManager =
    hasDepartmentScope && !isAdmin && !hasOrganizationScope;

  const filteredNavigation = navigation.filter((item) => {
    if (item.visibility === "all") return true;
    if (item.visibility === "management") return hasManagementScope;
    if (item.visibility === "organizations") {
      return isAdmin || hasOrganizationScope;
    }
    if (item.visibility === "departments") {
      return isAdmin || hasOrganizationScope || hasDepartmentScope;
    }
    if (item.visibility === "projects") {
      return (
        isAdmin || hasOrganizationScope || hasDepartmentScope || hasProjectScope
      );
    }
    if (item.visibility === "users") return hasManagementScope;
    if (item.visibility === "project-managers-admin") {
      return isAdmin || hasOrganizationScope || hasDepartmentScope;
    }
    return false;
  });

  // Pick the single best (longest-prefix) match so we don't highlight both
  // /dashboard and /dashboard/my-contributions at the same time.
  const activeHref = (() => {
    let best: string | null = null;
    for (const item of filteredNavigation) {
      if (pathname === item.href) return item.href;
      if (pathname.startsWith(item.href + "/")) {
        if (!best || item.href.length > best.length) best = item.href;
      }
    }
    return best;
  })();

  async function handleSignOut() {
    onNavigate?.();
    const refreshToken = session?.user?.refreshToken;

    if (refreshToken) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Local sign-out must still proceed even if the backend is unreachable.
      }
    }

    await signOut({ callbackUrl: "/login" });
  }

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 items-center px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2"
          onClick={onNavigate}
        >
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">L</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Lime++
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavigation.map((item) => {
          const isActive = activeHref === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-sidebar-foreground/70 group-hover:text-primary",
                )}
              />
              {item.href === "/users" && !canAssignRoles
                ? "Users"
                : item.href === "/departments" && isDepartmentOnlyManager
                  ? "My Departments"
                  : item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <div className="hidden md:flex">
      <SidebarContent />
    </div>
  );
}
