"use client";

import { Bell, Search, User } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-8 backdrop-blur">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search projects, tasks..."
            className="h-10 w-full rounded-md border border-input bg-muted/50 pl-10 pr-4 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        </button>

        <div className="h-8 w-px bg-border mx-2" />

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">Senglay Pann</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Administrator</p>
          </div>
          <button className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20 hover:bg-primary/30 transition-colors">
            <User className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
