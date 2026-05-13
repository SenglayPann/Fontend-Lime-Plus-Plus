"use client";

import { User } from "lucide-react";
import { useSession } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-8 backdrop-blur">
      <div />

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              {session?.user?.name || "User"}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {session?.user?.role?.replace("_", " ") || "MEMBER"}
            </p>
          </div>
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt="User"
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
              <User className="h-6 w-6" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
