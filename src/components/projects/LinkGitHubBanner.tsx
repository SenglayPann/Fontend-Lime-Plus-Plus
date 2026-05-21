"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Github, Info, Loader2, Lock, ShieldAlert, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LinkGitHubBannerProps = {
  projectId: string;
  accessToken: string;
};

export function LinkGitHubBanner({ projectId, accessToken }: LinkGitHubBannerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [repository, setRepository] = useState("");
  const [githubProjectId, setGithubProjectId] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAttach(e: React.FormEvent) {
    e.preventDefault();
    if (!consentChecked) {
      setError("You must review and consent to the Security & Privacy Disclaimer to proceed.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/attach-github`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          repository,
          github_project_id: githubProjectId,
          github_token: githubToken || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || json.message || "Failed to link GitHub repository");
      }

      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during attachment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* Premium Glassmorphic Banner */}
      <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent p-5 backdrop-blur-md shadow-lg transition-all duration-300 hover:shadow-amber-500/5">
        <div className="absolute -right-4 -top-4 opacity-10">
          <Github className="h-32 w-32 rotate-12" />
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-start gap-4">
            <div className="mt-1 rounded-lg bg-amber-500/20 p-2 text-amber-500">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-amber-500 flex items-center gap-2">
                GitHub Repository Not Linked
                <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-500">
                  Setup Required
                </span>
              </h3>
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                This project is currently an empty shell. Link a GitHub Repository and Project V2 board to begin real-time activity tracking, metric calculations, and automated scoring.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsOpen(true)}
            className="self-start sm:self-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-md transition-all duration-300 hover:scale-[1.02]"
          >
            <Github className="h-4 w-4" /> Link GitHub
          </Button>
        </div>
      </div>

      {/* Modern Consent Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="relative border-b border-border/50 bg-gradient-to-b from-muted/50 to-transparent px-6 py-5">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Github className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-1.5">
                    Link GitHub Repository <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Connect repository tracking and board synchronization
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleAttach} className="space-y-6 p-6">
              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive flex items-start gap-2.5">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Input Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="modal-repo" className="flex items-center gap-1.5">
                    Repository Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="modal-repo"
                    value={repository}
                    onChange={(e) => setRepository(e.target.value)}
                    placeholder="owner/repo (e.g. facebook/react)"
                    required
                    className="bg-muted/30 focus-visible:ring-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modal-project" className="flex items-center gap-1.5">
                    GitHub Project V2 ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="modal-project"
                    value={githubProjectId}
                    onChange={(e) => setGithubProjectId(e.target.value)}
                    placeholder="PVT_kwHO... (found in project URL)"
                    required
                    className="bg-muted/30 focus-visible:ring-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modal-token" className="flex items-center gap-1.5">
                    GitHub Access Token
                  </Label>
                  <Input
                    id="modal-token"
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="Personal Access Token with read/write permissions"
                    className="bg-muted/30 focus-visible:ring-amber-500"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Required if the backend does not have GITHUB_PERSONAL_ACCESS_TOKEN configured.
                  </p>
                </div>
              </div>

              {/* Ethical Consent & Transparency Disclaimer */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-amber-500/20 p-1 text-amber-500">
                    <Info className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-amber-500 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5" /> Security & Privacy Consent
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      By attaching this repository, you consent to store your encrypted GitHub credential (`projectGithubToken`) associated with this project. This enables teachers, supervisors, and background processes to synchronize Kanban board states and pull request activity even if they are not collaborators on your GitHub repository.
                    </p>
                  </div>
                </div>
                <label className="flex items-start gap-2.5 pt-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-1 rounded border-border bg-muted text-amber-500 focus:ring-amber-500 h-4 w-4"
                  />
                  <span className="text-xs font-medium text-foreground select-none">
                    I explicitly consent to delegate this encrypted credential for project synchronization.
                  </span>
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 border-t border-border/50 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !repository || !githubProjectId || !consentChecked}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Github className="h-4 w-4" />
                  )}
                  {isSubmitting ? "Linking..." : "Attach Repository"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
