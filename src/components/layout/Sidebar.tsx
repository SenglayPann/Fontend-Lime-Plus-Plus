"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  GraduationCap, 
  FolderKanban, 
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "ORGANIZATION_OWNER", "DEPARTMENT_MANAGER", "PROJECT_MANAGER", "PROJECT_MEMBER"] },
  { name: "Departments", href: "/departments", icon: GraduationCap, roles: ["ADMIN", "DEPARTMENT_MANAGER"] },
  { name: "Projects", href: "/projects", icon: FolderKanban, roles: ["ADMIN", "DEPARTMENT_MANAGER", "PROJECT_MANAGER", "PROJECT_MEMBER"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userRoles = session?.user?.roles?.length
    ? session.user.roles
    : [session?.user?.role || "PROJECT_MEMBER"];

  const filteredNavigation = navigation.filter(item => 
    item.roles.some((role) => userRoles.includes(role))
  );

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">L</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">Lime++</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                isActive ? "text-primary" : "text-sidebar-foreground/70 group-hover:text-primary"
              )} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
