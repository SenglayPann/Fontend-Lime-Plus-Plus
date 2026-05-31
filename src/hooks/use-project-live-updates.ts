"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type LiveStatus = "connecting" | "live" | "reconnecting" | "disabled";

/**
 * Subscribe to the SSE stream for a project and call `router.refresh()`
 * whenever the backend publishes a project.updated event.
 *
 * The browser EventSource API cannot set custom headers, so the JWT is
 * passed via the `access_token` query parameter. The backend JwtStrategy
 * accepts either source.
 *
 * Returns the connection status for UI badges.
 */
export function useProjectLiveUpdates(
  projectId: string | undefined,
  accessToken: string | undefined,
): LiveStatus {
  const router = useRouter();
  const [status, setStatus] = useState<LiveStatus>("connecting");

  useEffect(() => {
    if (!projectId || !accessToken) {
      setStatus("disabled");
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setStatus("disabled");
      return;
    }

    const url = `${apiUrl}/projects/${projectId}/events?access_token=${encodeURIComponent(accessToken)}`;
    const es = new EventSource(url);

    es.onopen = () => setStatus("live");

    // NestJS @Sse serializes the entire MessageEvent object as `data:`
    // without emitting a matching `event:` line, so every message arrives
    // here on the default "message" handler instead of the named one we
    // used to listen for. We inspect the payload's `type` field instead.
    es.onmessage = (ev) => {
      try {
        const parsed = JSON.parse(ev.data);
        if (parsed?.type === "project.updated") {
          router.refresh();
        }
      } catch {
        // Ignore malformed payloads; keepalives are JSON and won't throw.
      }
    };

    es.onerror = () => {
      // EventSource auto-reconnects internally; we just surface the state.
      setStatus("reconnecting");
    };

    return () => {
      es.close();
    };
  }, [projectId, accessToken, router]);

  return status;
}
