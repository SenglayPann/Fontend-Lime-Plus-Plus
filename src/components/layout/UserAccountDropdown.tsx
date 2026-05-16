"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  User,
  Settings,
  LogOut,
  UserPlus,
  Loader2,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AUTH_POPUP_CHANNEL,
  AUTH_POPUP_EVENT_KEY,
  AUTH_POPUP_PENDING_KEY,
  isAuthPopupEvent,
  parseAuthPopupEvent,
} from "@/lib/auth-popup";
import { getBrowserIdHeader, getBrowserId } from "@/lib/browser-id";
import { cn } from "@/lib/utils";

interface LinkedAccount {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  roles: string[];
}

export function UserAccountDropdown() {
  const { data: session, status } = useSession();
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAccounts();
    }
  }, [status]);

  async function fetchAccounts() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/accounts`, {
        headers: getBrowserIdHeader(),
      });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.success ? data.data : data);
      }
    } catch (error) {
      console.error("Failed to fetch linked accounts:", error);
    }
  }

  async function handleSwitch(targetUserId: string) {
    if (targetUserId === session?.user?.id) return;

    console.log("Switching to account:", targetUserId);
    setIsSwitching(targetUserId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/switch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getBrowserIdHeader(),
        },
        body: JSON.stringify({ targetUserId }),
      });

      if (!res.ok) throw new Error("Switch failed");

      const json = await res.json();
      const tokens = json.success ? json.data : json;

      console.log("Switch authorized, updating session...");

      // Update next-auth session
      // Force sign out first to clear any existing session (Account A)
      await signOut({ redirect: false });

      const result = await signIn("credentials", {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: String(tokens.expiresIn),
        browserId: getBrowserId(),
        redirect: false,
      });

      if (result?.ok) {
        console.log("Session updated, reloading...");
        window.location.href = "/dashboard"; // Hard redirect to ensure fresh state
      } else {
        console.error("NextAuth signIn failed:", result?.error);
      }
    } catch (error) {
      console.error("Switch failed:", error);
    } finally {
      setIsSwitching(null);
    }
  }

  function handleAddAccount() {
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    let channel: BroadcastChannel | null = null;
    let popupCheckTimer: number | undefined;
    let handled = false;

    localStorage.setItem(AUTH_POPUP_PENDING_KEY, String(Date.now()));

    const reloadMainWindow = () => {
      window.setTimeout(() => {
        window.location.reload();
      }, 100);
    };

    const cleanup = () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorage);
      channel?.close();
      if (popupCheckTimer) {
        window.clearInterval(popupCheckTimer);
        popupCheckTimer = undefined;
      }
    };

    const handleAuthEvent = (data: unknown) => {
      if (!isAuthPopupEvent(data) || handled) return;

      handled = true;
      cleanup();

      if (data.type === "AUTH_SUCCESS") {
        reloadMainWindow();
      } else {
        console.error("Popup auth failed:", data.error);
        fetchAccounts();
      }
    };

    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      handleAuthEvent(event.data);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== AUTH_POPUP_EVENT_KEY || !event.newValue) return;
      handleAuthEvent(parseAuthPopupEvent(event.newValue));
    }

    window.addEventListener("message", handleMessage);
    window.addEventListener("storage", handleStorage);

    try {
      channel = new BroadcastChannel(AUTH_POPUP_CHANNEL);
      channel.onmessage = (event) => handleAuthEvent(event.data);
    } catch (error) {
      console.error("Failed to listen for auth popup events:", error);
    }

    const popup = window.open(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/github?mode=popup`,
      "Add Account",
      `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
    );

    if (!popup) {
      cleanup();
      localStorage.removeItem(AUTH_POPUP_PENDING_KEY);
      console.error("Popup blocked");
      alert("Please allow popups for this site to add an account.");
      return;
    }

    popup.focus();

    popupCheckTimer = window.setInterval(() => {
      if (popup.closed) {
        if (!handled) {
          handled = true;
          reloadMainWindow();
        }

        cleanup();
      }
    }, 500);
  }

  const currentUser = session?.user;

  if (status === "loading") {
    return (
      <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 outline-none group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {currentUser?.name || "User"}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {currentUser?.role?.replace("_", " ") || "MEMBER"}
            </p>
          </div>
          {currentUser?.image ? (
            <img
              src={currentUser.image}
              alt="User"
              className="h-10 w-10 rounded-full border-2 border-transparent group-hover:border-primary/20 transition-all"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:bg-primary/20 transition-all">
              <User className="h-6 w-6" />
            </div>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64 p-2" align="end">
        <DropdownMenuLabel className="font-normal p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{currentUser?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {currentUser?.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Profile Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {accounts.length > 0 && (
          <>
            <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground tracking-widest px-2 py-1">
              Switch Account
            </DropdownMenuLabel>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {accounts.map((account) => (
                <DropdownMenuItem
                  key={account.id}
                  className={cn(
                    "flex items-center justify-between cursor-pointer p-2 rounded-md transition-colors",
                    account.id === currentUser?.id ? "bg-primary/5 text-primary pointer-events-none" : "hover:bg-accent"
                  )}
                  onSelect={(e) => {
                    e.preventDefault();
                    handleSwitch(account.id);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {account.avatarUrl ? (
                      <img src={account.avatarUrl} className="h-6 w-6 rounded-full" alt="" />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-xs font-medium truncate w-32">{account.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate w-32">{account.email}</span>
                    </div>
                  </div>
                  {isSwitching === account.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : account.id === currentUser?.id ? (
                    <Check className="h-3 w-3" />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          className="cursor-pointer text-primary focus:text-primary focus:bg-primary/5"
          onSelect={handleAddAccount}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          <span>Add another account</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5"
          onSelect={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
