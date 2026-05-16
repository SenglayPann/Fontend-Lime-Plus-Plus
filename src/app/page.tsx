import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Lime++ | Contribution intelligence for project teams",
  description:
    "Role-aware GitHub contribution dashboards, scoped project reporting, and audit-ready project workflows.",
};

export default function Home() {
  return <LandingPage />;
}
