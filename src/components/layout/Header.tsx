"use client";

import { UserAccountDropdown } from "./UserAccountDropdown";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-8 backdrop-blur">
      <div />

      <div className="flex items-center gap-4">
        <UserAccountDropdown />
      </div>
    </header>
  );
}
