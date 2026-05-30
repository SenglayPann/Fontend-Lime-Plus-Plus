'use client';

import { AuthPopupRefreshListener } from "@/components/auth/AuthPopupRefreshListener";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthPopupRefreshListener />
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{ duration: 5000 }}
      />
    </SessionProvider>
  );
}
