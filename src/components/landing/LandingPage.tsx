"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileText,
  GitPullRequest,
  Github,
  Layers,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type RoleMode = {
  id: "admin" | "manager" | "student";
  label: string;
  eyebrow: string;
  headline: string;
  description: string;
  bullets: string[];
};

const roleModes: RoleMode[] = [
  {
    id: "admin",
    label: "Admin & Org Manager",
    eyebrow: "Governance",
    headline: "One control plane across every department.",
    description:
      "Create organisations, assign managers, audit sensitive events, and keep GitHub data scoped without leaking between departments.",
    bullets: [
      "Global role visibility across all scopes",
      "Append-only audit log of score-changing actions",
      "Allowlist-based auto-enrolment by email or GitHub username",
    ],
  },
  {
    id: "manager",
    label: "Project Manager",
    eyebrow: "Execution",
    headline: "Manage projects without crossing scope lines.",
    description:
      "Sync the GitHub Project board, assign tasks, freeze scoring at the deadline, and export a defensible per-student report.",
    bullets: [
      "Inline difficulty + due-date editing on every task",
      "Lock the project to freeze scores at the evaluation window",
      "On-demand PDF and CSV reports scoped per project",
    ],
  },
  {
    id: "student",
    label: "Student",
    eyebrow: "Contribution",
    headline: "A clear view of your own project impact.",
    description:
      "Watch tasks, pull requests, and reviews accumulate into a per-project score that you can inspect — without exposing peers' data.",
    bullets: [
      "Personal dashboard for tasks, PRs, and reviews",
      "Per-task linked pull-request evidence",
      "Live updates the moment GitHub fires a webhook",
    ],
  },
];

const features = [
  {
    icon: Github,
    title: "GitHub-native ingestion",
    text: "OAuth login plus a GitHub App that listens to repository, Projects v2, pull request, and review events in near real time.",
  },
  {
    icon: Target,
    title: "Per-task attribution",
    text: "Every contribution event ties a student to a specific GitHub Issue or PR — no commit-count or LOC games.",
  },
  {
    icon: ShieldCheck,
    title: "Scoped role model",
    text: "Seven roles from Admin to Project Member, enforced by guards at every endpoint and partial unique indexes in the database.",
  },
  {
    icon: FileText,
    title: "Audit-ready reports",
    text: "PDF and CSV exports per project or per student, with an append-only audit log of every score-changing action.",
  },
  {
    icon: Lock,
    title: "Locked evaluation window",
    text: "Freeze scoring at the deadline so late merges can't retroactively invalidate a teacher's grading.",
  },
  {
    icon: Zap,
    title: "Live dashboards",
    text: "Server-Sent Events stream contribution updates the moment a webhook lands — no manual refresh.",
  },
];

const workflowSteps = [
  {
    n: "01",
    title: "Connect GitHub",
    text: "Install the Lime++ GitHub App on your organisation and link a Projects v2 board to each course project.",
  },
  {
    n: "02",
    title: "Students log in",
    text: "GitHub OAuth handoff. Allowlist auto-enrolment matches them to the right department on first sign-in.",
  },
  {
    n: "03",
    title: "Work flows in",
    text: "Tasks sync from the project board. PRs, reviews, and merges feed the scoring engine through queued workers.",
  },
  {
    n: "04",
    title: "Grade with evidence",
    text: "At the evaluation deadline, lock the project and export PDF/CSV reports backed by an append-only audit log.",
  },
];

export function LandingPage() {
  const [activeRole, setActiveRole] = useState<RoleMode["id"]>("manager");
  const selectedRole =
    roleModes.find((mode) => mode.id === activeRole) || roleModes[1];

  return (
    <main className="min-h-screen bg-background text-foreground antialiased">
      <SiteHeader />
      <Hero />
      <FeatureGrid />
      <RolesSection
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        selectedRole={selectedRole}
      />
      <WorkflowSection />
      <PreviewSection />
      <ClosingCta />
      <SiteFooter />
    </main>
  );
}

/* ---------------------------------------------------------------- */
/* Header                                                            */
/* ---------------------------------------------------------------- */
function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-lg font-black tracking-tighter">L+</span>
          </span>
          <span className="text-base font-bold tracking-tight">Lime++</span>
        </Link>

        <nav
          className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex"
          aria-label="Primary"
        >
          <a href="#features" className="transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#roles" className="transition-colors hover:text-foreground">
            Roles
          </a>
          <a href="#workflow" className="transition-colors hover:text-foreground">
            How it works
          </a>
          <a href="#preview" className="transition-colors hover:text-foreground">
            Preview
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/login">
              <Github className="h-4 w-4" />
              Get started
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- */
/* Hero                                                              */
/* ---------------------------------------------------------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Decorative background — soft primary wash + subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_30%,transparent_80%)]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-primary/[0.06]" />
        <div className="absolute inset-0 [background-image:linear-gradient(to_right,color-mix(in_srgb,var(--color-border)_60%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--color-border)_60%,transparent)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pb-32 lg:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Contribution intelligence for student software projects
          </div>

          <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Grade GitHub work
            <br />
            <span className="text-primary">with evidence</span>, not memory.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            Lime++ turns repository activity into role-scoped dashboards,
            verifiable per-student contribution scores, and audit-ready reports
            — built for the way undergraduate software teams actually run.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2 px-6">
              <Link href="/login">
                <Github className="h-4 w-4" />
                Continue with GitHub
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 px-6">
              <a href="#features">
                See what it does
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            No credit card. Sign in with the GitHub account your team already uses.
          </p>
        </div>

        {/* Stylised dashboard preview card — themed, no fake numbers */}
        <div className="relative mx-auto mt-16 max-w-5xl lg:mt-20">
          <div className="relative rounded-2xl border border-border bg-card p-1.5 shadow-2xl shadow-primary/10">
            <HeroDashboardMock />
          </div>
          {/* edge glow */}
          <div className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/30 via-transparent to-transparent opacity-50 blur-2xl" />
        </div>
      </div>
    </section>
  );
}

function HeroDashboardMock() {
  return (
    <div className="overflow-hidden rounded-xl bg-background">
      {/* Mock app header */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-3 text-xs text-muted-foreground">
          lime.app/projects/cs401-webapp
        </span>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-12 sm:gap-5 sm:p-6">
        {/* Sidebar mock */}
        <div className="hidden flex-col gap-2 sm:col-span-3 sm:flex">
          {[
            { label: "Dashboard", active: false },
            { label: "Projects", active: true },
            { label: "Tasks", active: false },
            { label: "Audit", active: false },
            { label: "Reports", active: false },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs ${
                item.active
                  ? "bg-primary/10 font-semibold text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${item.active ? "bg-primary" : "bg-muted-foreground/40"}`}
              />
              {item.label}
            </div>
          ))}
        </div>

        {/* Main mock */}
        <div className="sm:col-span-9 sm:space-y-4 space-y-3">
          {/* Stat row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Completion", v: "78%" },
              { label: "Members", v: "12" },
              { label: "Open PRs", v: "8" },
              { label: "Merged", v: "34" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-border bg-card px-3 py-2.5"
              >
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-1 text-lg font-bold text-foreground">{stat.v}</p>
              </div>
            ))}
          </div>

          {/* Activity rows */}
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recent contributions
            </div>
            <div className="divide-y divide-border">
              {[
                { who: "alice-c", what: "PR #42 — Implement task assignment", pts: "+5" },
                { who: "bob-w", what: "PR #41 — Add audit log endpoint", pts: "+8" },
                { who: "diana-m", what: "Reviewed PR #40", pts: "+2" },
              ].map((row) => (
                <div key={row.what} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {row.who.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {row.what}
                    </p>
                    <p className="text-[10px] text-muted-foreground">@{row.who}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {row.pts} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Features                                                          */
/* ---------------------------------------------------------------- */
function FeatureGrid() {
  return (
    <section id="features" className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            What it does
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Built for the way student software projects actually run.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Every feature maps to something the supervisor, the student, or the
            audit reviewer actually needs.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-background p-6 transition-colors hover:bg-muted/40 sm:p-7"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold tracking-tight">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Roles                                                             */
/* ---------------------------------------------------------------- */
function RolesSection({
  activeRole,
  setActiveRole,
  selectedRole,
}: {
  activeRole: RoleMode["id"];
  setActiveRole: (id: RoleMode["id"]) => void;
  selectedRole: RoleMode;
}) {
  return (
    <section
      id="roles"
      className="border-t border-border bg-muted/30 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Role-aware UX
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            One product, three clean views.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Lime++ enforces role checks at the API boundary, so each person
            lands in a workspace shaped by their scope — with no duplicate page
            logic.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-4xl">
          {/* Tab strip */}
          <div
            className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-border bg-background p-1 shadow-sm sm:w-auto"
            role="tablist"
          >
            {roleModes.map((mode) => {
              const isActive = mode.id === activeRole;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setActiveRole(mode.id)}
                  role="tab"
                  aria-selected={isActive}
                  className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition-colors sm:flex-none sm:text-sm ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>

          {/* Active panel */}
          <div
            className="mt-6 grid gap-6 rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8 lg:grid-cols-[1.2fr_1fr]"
            role="tabpanel"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {selectedRole.eyebrow}
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {selectedRole.headline}
              </h3>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {selectedRole.description}
              </p>
            </div>

            <div className="space-y-3">
              {selectedRole.bullets.map((bullet) => (
                <div
                  key={bullet}
                  className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm leading-5 text-foreground">
                    {bullet}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Workflow                                                          */
/* ---------------------------------------------------------------- */
function WorkflowSection() {
  return (
    <section id="workflow" className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            From GitHub event to defensible grade.
          </h2>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {workflowSteps.map((step, i) => (
            <li
              key={step.n}
              className="group relative rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <span className="absolute right-5 top-5 text-xs font-mono font-semibold text-muted-foreground/60">
                {step.n}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {i === 0 && <Github className="h-4 w-4" />}
                {i === 1 && <Users className="h-4 w-4" />}
                {i === 2 && <GitPullRequest className="h-4 w-4" />}
                {i === 3 && <FileText className="h-4 w-4" />}
              </div>
              <h3 className="mt-4 text-base font-bold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Preview / "Under the hood"                                        */
/* ---------------------------------------------------------------- */
function PreviewSection() {
  return (
    <section
      id="preview"
      className="border-t border-border bg-muted/30 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Under the hood
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Verifiable evidence, all the way down.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              Every score points to a specific GitHub event: a merged PR, an
              approving review, a completed task. Every sensitive action — score
              overrides, role changes, project locks — lands in an append-only
              audit log that nobody can rewrite.
            </p>

            <div className="mt-8 space-y-4">
              {[
                {
                  icon: Layers,
                  title: "TypeScript monorepo",
                  text: "NestJS backend · Next.js 15 frontend · Prisma + PostgreSQL · Redis-backed BullMQ workers.",
                },
                {
                  icon: ShieldCheck,
                  title: "Multi-tenant by design",
                  text: "Seven scoped roles. Three partial unique indexes enforce role uniqueness at the database level.",
                },
                {
                  icon: Lock,
                  title: "Locked at the deadline",
                  text: "Freeze a project at the end of the evaluation window so late merges can't drift the final score.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit-log style mock */}
          <div className="rounded-2xl border border-border bg-card p-1.5 shadow-xl shadow-primary/5">
            <div className="overflow-hidden rounded-xl bg-background">
              <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold">Audit log</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  append-only
                </span>
              </div>
              <div className="divide-y divide-border font-mono text-[11px]">
                {[
                  {
                    t: "10:42",
                    action: "SCORE_OVERRIDE",
                    actor: "prof.johnson",
                    meta: "+5 → alice-c · reason: late-merge credit",
                  },
                  {
                    t: "10:38",
                    action: "PROJECT_LOCK",
                    actor: "prof.johnson",
                    meta: "cs401-webapp · evaluation closed",
                  },
                  {
                    t: "10:31",
                    action: "ROLE_CHANGE",
                    actor: "admin",
                    meta: "diana-m → PROJECT_LEAD · cs402-mobile",
                  },
                  {
                    t: "10:17",
                    action: "TASK_REASSIGN",
                    actor: "prof.johnson",
                    meta: "TASK-024 · bob-w → charlie-d",
                  },
                  {
                    t: "10:02",
                    action: "WEBHOOK_IGNORED",
                    actor: "system",
                    meta: "PR merged after lock · #38",
                  },
                ].map((entry) => (
                  <div
                    key={entry.t + entry.action}
                    className="grid grid-cols-[44px_140px_1fr] gap-2 px-4 py-2 hover:bg-muted/40"
                  >
                    <span className="text-muted-foreground">{entry.t}</span>
                    <span className="font-semibold text-primary">
                      {entry.action}
                    </span>
                    <span className="truncate text-foreground/80">
                      <span className="text-muted-foreground">@{entry.actor}</span>{" "}
                      · {entry.meta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Closing CTA                                                       */
/* ---------------------------------------------------------------- */
function ClosingCta() {
  return (
    <section className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card px-8 py-14 shadow-sm">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Github className="h-5 w-5" />
          </div>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Sign in with the GitHub account your team already uses.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            Authenticated users go straight to the app. Visitors can browse this
            page without hitting protected routes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2 px-6">
              <Link href="/login">
                <Github className="h-4 w-4" />
                Continue with GitHub
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Footer                                                            */
/* ---------------------------------------------------------------- */
function SiteFooter() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-sm font-black tracking-tighter">L+</span>
          </span>
          <span className="text-sm font-semibold">Lime++</span>
          <span className="text-xs text-muted-foreground">
            · Contribution intelligence for student software projects
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Built at the Royal University of Phnom Penh.
        </p>
      </div>
    </footer>
  );
}
