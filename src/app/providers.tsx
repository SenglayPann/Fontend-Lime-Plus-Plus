'use client';

import { AuthPopupRefreshListener } from "@/components/auth/AuthPopupRefreshListener";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthPopupRefreshListener />
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{ duration: 5000 }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}
