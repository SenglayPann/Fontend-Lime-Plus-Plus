"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Github,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ---------------------------------------------------------------- */

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <div className="min-w-0">
        <p className="font-semibold text-destructive">Sign-in failed</p>
        <p className="mt-1 break-words text-destructive/90">{message}</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [isRedirecting, setIsRedirecting] = useState(false);

  function handleGitHubLogin() {
    if (isRedirecting) return;
    setIsRedirecting(true);
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/github`;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6 lg:px-8">
      {/* Decorative background — same wash + grid as the landing hero */}
      <div
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black_30%,transparent_85%)]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-primary/[0.06]" />
        <div className="absolute inset-0 [background-image:linear-gradient(to_right,color-mix(in_srgb,var(--color-border)_60%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--color-border)_60%,transparent)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back to home */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-primary/5 sm:p-10">
          {/* Brand mark */}
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <span className="text-xl font-black tracking-tighter">L+</span>
            </span>
            <div>
              <p className="text-base font-bold tracking-tight">Lime++</p>
              <p className="text-xs text-muted-foreground">
                Contribution intelligence
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="mt-8">
            <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Use the GitHub account your team already uses. We&apos;ll redirect
              you to GitHub to authorise the connection.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6">
              <ErrorBanner message={decodeURIComponent(error)} />
            </div>
          )}

          {/* CTA */}
          <Button
            onClick={handleGitHubLogin}
            disabled={isRedirecting}
            size="lg"
            className="mt-6 w-full gap-2.5 bg-[#24292F] text-white hover:bg-[#24292F]/90"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecting to GitHub…
              </>
            ) : (
              <>
                <Github className="h-4 w-4" />
                Continue with GitHub
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          {/* Trust panel */}
          <div className="mt-7 space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              What happens next
            </p>
            <ol className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                  1
                </span>
                <span>You&apos;ll be redirected to <strong className="text-foreground">github.com</strong> to authorise Lime++.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                  2
                </span>
                <span>GitHub returns to Lime++ with a read-only token used to verify your identity.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                  3
                </span>
                <span>You land on the dashboard matching your role.</span>
              </li>
            </ol>
          </div>

          {/* Fine print */}
          <div className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>
              We never request write access. Tokens are encrypted at rest.
            </span>
          </div>
        </div>

        {/* Sub-card row */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-primary" />
            No credit card
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-primary" />
            Free for students
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-primary" />
            Audit-ready
          </span>
        </div>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------- */

function LoginFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-primary/5 sm:p-10">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <span className="text-xl font-black tracking-tighter">L+</span>
          </span>
          <div className="space-y-1.5">
            <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="mt-8 space-y-3">
          <div className="h-7 w-24 animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-6 h-11 w-full animate-pulse rounded-md bg-muted" />
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
