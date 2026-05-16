"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  GitBranch,
  Github,
  LayoutDashboard,
  LockKeyhole,
  Network,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
} from "lucide-react";

type RoleMode = {
  id: "admin" | "manager" | "student";
  label: string;
  eyebrow: string;
  headline: string;
  description: string;
  accent: string;
  stats: Array<{ label: string; value: string }>;
  checks: string[];
};

const roleModes: RoleMode[] = [
  {
    id: "admin",
    label: "Admin",
    eyebrow: "Governance",
    headline: "One control plane for every organization.",
    description:
      "Create scopes, assign managers, audit sensitive events, and keep GitHub data normalized across departments.",
    accent: "#A6E22E",
    stats: [
      { label: "Scopes", value: "28" },
      { label: "Audit paths", value: "9" },
    ],
    checks: ["Global role visibility", "Atomic manager assignment", "Export guardrails"],
  },
  {
    id: "manager",
    label: "Manager",
    eyebrow: "Execution",
    headline: "Manage projects without crossing scope lines.",
    description:
      "Sync boards, assign tasks, review pull requests, and see only the organizations, departments, and projects you own.",
    accent: "#16A3A3",
    stats: [
      { label: "Active boards", value: "14" },
      { label: "Open PRs", value: "86" },
    ],
    checks: ["Scoped users", "Locked project controls", "Live contribution trends"],
  },
  {
    id: "student",
    label: "Student",
    eyebrow: "Contribution",
    headline: "A clear view of your own project impact.",
    description:
      "Track assigned tasks, pull request outcomes, and contribution history without exposing project-wide private data.",
    accent: "#F06449",
    stats: [
      { label: "Own tasks", value: "12" },
      { label: "Merged PRs", value: "7" },
    ],
    checks: ["Personal dashboard", "Private project counts", "Contribution timeline"],
  },
];

const workflowSteps = [
  {
    icon: Github,
    title: "Connect GitHub",
    text: "Repository and Project V2 data land in one normalized workspace.",
  },
  {
    icon: Workflow,
    title: "Sync work",
    text: "Tasks, pull requests, reviews, and webhook events stay aligned.",
  },
  {
    icon: ShieldCheck,
    title: "Apply scope",
    text: "Every view is filtered through organization, department, and project access.",
  },
  {
    icon: BarChart3,
    title: "Report outcomes",
    text: "Managers get aggregate signals, while students get personal contribution clarity.",
  },
];

const proofPoints = [
  { value: "198", label: "backend tests" },
  { value: "28", label: "frontend tests" },
  { value: "5 MB", label: "webhook body limit" },
  { value: "0", label: "known auth-page loops" },
];

export function LandingPage() {
  const [activeRole, setActiveRole] = useState<RoleMode["id"]>("manager");
  const [teamSize, setTeamSize] = useState(48);
  const [sceneOffset, setSceneOffset] = useState({ x: 0, y: 0 });

  const selectedRole =
    roleModes.find((mode) => mode.id === activeRole) || roleModes[1];

  const estimate = useMemo(() => {
    const weeklyEvents = Math.round(teamSize * 7.4);
    const reviewHours = Math.round(teamSize * 1.8);
    const scopedReports = Math.max(3, Math.round(teamSize / 6));

    return { weeklyEvents, reviewHours, scopedReports };
  }, [teamSize]);

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    setSceneOffset({ x, y });
  }

  return (
    <main className="min-h-screen bg-[#F8FAF4] text-[#121614]">
      <section
        className="relative min-h-[84vh] overflow-hidden bg-[#ECF5E8]"
        onPointerMove={handlePointerMove}
      >
        <HeroScene role={selectedRole} offset={sceneOffset} />
        <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Lime++ home">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#121614] text-sm font-black text-[#A6E22E]">
              L+
            </span>
            <span className="text-base font-semibold text-[#121614]">
              Lime++
            </span>
          </Link>

          <nav
            className="hidden items-center gap-7 text-sm font-medium text-[#36413A] md:flex"
            aria-label="Primary"
          >
            <a href="#workflow" className="hover:text-[#121614]">
              Workflow
            </a>
            <a href="#roles" className="hover:text-[#121614]">
              Roles
            </a>
            <a href="#impact" className="hover:text-[#121614]">
              Impact
            </a>
          </nav>

          <Link
            href="/login"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#121614] px-4 text-sm font-semibold text-white transition hover:bg-[#263029]"
          >
            <Github className="h-4 w-4" />
            Sign in
          </Link>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[calc(84vh-80px)] max-w-7xl items-center px-5 pb-14 pt-10 sm:px-8 lg:pb-20">
          <div className="max-w-3xl">
            <div className="mb-7 flex flex-wrap items-center gap-3 text-sm font-semibold text-[#39443D]">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/80 text-[#537500] shadow-sm">
                <Sparkles className="h-4 w-4" />
              </span>
              Contribution intelligence for scoped project teams
            </div>

            <h1 className="text-6xl font-black leading-none text-[#121614] sm:text-7xl lg:text-8xl">
              Lime++
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#334139] sm:text-xl">
              Turn GitHub activity into role-aware dashboards, task ownership,
              pull request signals, and audit-ready reports for academic and
              software project programs.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex h-12 items-center gap-2 rounded-md bg-[#121614] px-5 text-sm font-bold text-white transition hover:bg-[#263029]"
              >
                <Github className="h-4 w-4" />
                Continue with GitHub
              </Link>
              <a
                href="#roles"
                className="inline-flex h-12 items-center gap-2 rounded-md border border-[#B8C7B5] bg-white/75 px-5 text-sm font-bold text-[#121614] transition hover:bg-white"
              >
                Explore roles
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#D9E4D4] bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-[#D9E4D4] px-5 sm:px-8 lg:grid-cols-4">
          {proofPoints.map((point) => (
            <div key={point.label} className="bg-white py-6">
              <p className="text-3xl font-black text-[#121614]">{point.value}</p>
              <p className="mt-1 text-sm font-medium text-[#5C685F]">
                {point.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="workflow" className="bg-[#F8FAF4] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase text-[#537500]">
              Operating model
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight text-[#121614] sm:text-5xl">
              From repository events to decisions.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <div
                key={step.title}
                className="group rounded-lg border border-[#D9E4D4] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#9ABD38]"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#ECF5E8] text-[#537500]">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-black text-[#C7D5C0]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-black text-[#121614]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#5C685F]">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="bg-[#121614] px-5 py-20 text-white sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase text-[#A6E22E]">
                Role-aware UX
              </p>
              <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
                One product, three clean views.
              </h2>
              <p className="mt-5 text-base leading-7 text-[#C8D2C6]">
                Lime++ keeps role checks centralized so each actor lands in a
                workspace that matches their scope without duplicate page logic.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#1B211D] p-4">
              <div className="grid gap-2 sm:grid-cols-3" role="tablist">
                {roleModes.map((mode) => {
                  const isActive = mode.id === activeRole;

                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setActiveRole(mode.id)}
                      className={`flex h-12 items-center justify-center gap-2 rounded-md border text-sm font-bold transition ${
                        isActive
                          ? "border-[#A6E22E] bg-[#A6E22E] text-[#121614]"
                          : "border-white/10 bg-[#252C27] text-[#DDE6DA] hover:border-white/30"
                      }`}
                      role="tab"
                      aria-selected={isActive}
                    >
                      {mode.id === "admin" && <ShieldCheck className="h-4 w-4" />}
                      {mode.id === "manager" && <UsersRound className="h-4 w-4" />}
                      {mode.id === "student" && <GitBranch className="h-4 w-4" />}
                      {mode.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
                <div className="rounded-lg bg-[#F8FAF4] p-6 text-[#121614]">
                  <p className="text-sm font-black uppercase text-[#537500]">
                    {selectedRole.eyebrow}
                  </p>
                  <h3 className="mt-3 text-3xl font-black leading-tight">
                    {selectedRole.headline}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-[#4B5A50]">
                    {selectedRole.description}
                  </p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    {selectedRole.stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-lg border border-[#D9E4D4] bg-white p-4"
                      >
                        <p className="text-3xl font-black">{stat.value}</p>
                        <p className="mt-1 text-xs font-bold uppercase text-[#6A766D]">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-[#252C27] p-5">
                  <p className="text-sm font-black uppercase text-[#A6E22E]">
                    Guarded capabilities
                  </p>
                  <div className="mt-5 space-y-3">
                    {selectedRole.checks.map((check) => (
                      <div key={check} className="flex items-start gap-3">
                        <CheckCircle2
                          className="mt-0.5 h-5 w-5 shrink-0"
                          style={{ color: selectedRole.accent }}
                        />
                        <span className="text-sm leading-6 text-[#E8EEE6]">
                          {check}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 rounded-lg bg-[#121614] p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <LockKeyhole className="h-4 w-4 text-[#A6E22E]" />
                      Session and scope checks run before render
                    </div>
                    <div className="mt-4 h-2 rounded-md bg-white/10">
                      <div
                        className="h-2 rounded-md"
                        style={{
                          width:
                            selectedRole.id === "admin"
                              ? "92%"
                              : selectedRole.id === "manager"
                                ? "68%"
                                : "42%",
                          backgroundColor: selectedRole.accent,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="impact" className="bg-white px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-[#537500]">
              Interactive planning
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight text-[#121614] sm:text-5xl">
              Size the signal before the semester starts.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#5C685F]">
              Move the team size to preview the weekly operational load Lime++
              can turn into scoped dashboards, review queues, and report data.
            </p>
          </div>

          <div className="rounded-lg border border-[#D9E4D4] bg-[#F8FAF4] p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#5C685F]">Team size</p>
                <p className="mt-1 text-5xl font-black text-[#121614]">
                  {teamSize}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#121614] text-[#A6E22E]">
                <Network className="h-6 w-6" />
              </div>
            </div>

            <input
              aria-label="Team size"
              className="mt-7 w-full accent-[#537500]"
              type="range"
              min="12"
              max="160"
              step="4"
              value={teamSize}
              onChange={(event) => setTeamSize(Number(event.target.value))}
            />

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <ImpactStat label="weekly events" value={estimate.weeklyEvents} />
              <ImpactStat label="review hours" value={estimate.reviewHours} />
              <ImpactStat label="scoped reports" value={estimate.scopedReports} />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#ECF5E8] px-5 py-16 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black text-[#121614]">
              Start with the same GitHub login your team already uses.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#4B5A50]">
              Authenticated users go straight to the app. Visitors can inspect
              the product story without hitting protected routes.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#121614] px-5 text-sm font-bold text-white transition hover:bg-[#263029]"
          >
            Launch Lime++
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function HeroScene({
  role,
  offset,
}: {
  role: RoleMode;
  offset: { x: number; y: number };
}) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[#ECF5E8]" />
      <div
        className="absolute -right-8 top-24 hidden w-[560px] rounded-lg border border-[#C8D9C2] bg-white/80 p-4 shadow-2xl shadow-[#3A4A36]/10 backdrop-blur md:block"
        style={{
          transform: `translate3d(${offset.x * -18}px, ${offset.y * -14}px, 0)`,
        }}
      >
        <div className="flex items-center justify-between border-b border-[#E3ECDf] pb-3">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-[#537500]" />
            <span className="text-sm font-black text-[#121614]">
              Live project board
            </span>
          </div>
          <span className="rounded-md bg-[#ECF5E8] px-2 py-1 text-xs font-bold text-[#537500]">
            Synced
          </span>
        </div>

        <div className="mt-4 grid gap-3">
          {["API audit trail", "Kanban sync lock", "PR review score"].map(
            (item, index) => (
              <div
                key={item}
                className="grid grid-cols-[1fr_88px_58px] items-center gap-3 rounded-md border border-[#E3ECDf] bg-[#FBFCF8] p-3"
              >
                <div>
                  <p className="text-sm font-bold text-[#121614]">{item}</p>
                  <p className="mt-1 text-xs text-[#6A766D]">
                    {role.label} scope
                  </p>
                </div>
                <div className="h-2 rounded-md bg-[#DDE8D8]">
                  <div
                    className="h-2 rounded-md"
                    style={{
                      width: `${62 + index * 11}%`,
                      backgroundColor: role.accent,
                    }}
                  />
                </div>
                <span className="text-right text-sm font-black text-[#121614]">
                  +{index + 4}
                </span>
              </div>
            ),
          )}
        </div>
      </div>

      <div
        className="absolute bottom-10 left-[5%] hidden w-[360px] rounded-lg border border-[#C8D9C2] bg-[#121614] p-4 text-white shadow-2xl shadow-[#3A4A36]/15 lg:block"
        style={{
          transform: `translate3d(${offset.x * 12}px, ${offset.y * 10}px, 0)`,
        }}
      >
        <div className="flex items-center gap-2 text-sm font-black">
          <ShieldCheck className="h-4 w-4 text-[#A6E22E]" />
          Access matrix
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {Array.from({ length: 16 }).map((_, index) => (
            <span
              key={index}
              className="h-10 rounded-md border border-white/10"
              style={{
                backgroundColor:
                  index % 5 === 0
                    ? role.accent
                    : index % 3 === 0
                      ? "#283029"
                      : "#1B211D",
              }}
            />
          ))}
        </div>
      </div>

      <div
        className="absolute right-[12%] top-[58%] hidden w-[300px] rounded-lg border border-[#C8D9C2] bg-white/90 p-4 shadow-2xl shadow-[#3A4A36]/10 backdrop-blur-xl xl:block"
        style={{
          transform: `translate3d(${offset.x * -8}px, ${offset.y * 16}px, 0)`,
        }}
      >
        <div className="flex items-center gap-2 text-sm font-black text-[#121614]">
          <BarChart3 className="h-4 w-4 text-[#16A3A3]" />
          Contribution pulse
        </div>
        <div className="mt-5 flex h-28 items-end gap-2">
          {[32, 54, 48, 72, 61, 88, 76, 94].map((height, index) => (
            <span
              key={index}
              className="flex-1 rounded-md"
              style={{
                height: `${height}%`,
                backgroundColor:
                  index % 3 === 0
                    ? "#16A3A3"
                    : index % 2 === 0
                      ? "#F5B942"
                      : "#A6E22E",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ImpactStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#D9E4D4] bg-white p-4">
      <p className="text-3xl font-black text-[#121614]">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase text-[#6A766D]">
        {label}
      </p>
    </div>
  );
}
