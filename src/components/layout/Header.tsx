"use client";

import { UserAccountDropdown } from "./UserAccountDropdown";
import { MobileSidebar } from "./MobileSidebar";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-4 sm:px-8 backdrop-blur">
      <div className="flex items-center gap-3">
        <MobileSidebar />
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserAccountDropdown />
      </div>
    </header>
  );
}
