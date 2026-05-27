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

    const refresh = () => router.refresh();

    // The backend uses `type: 'project.updated'` for content events and
    // `type: 'heartbeat'` for keepalives. Only refresh on content events.
    es.addEventListener("project.updated", refresh);

    es.onerror = () => {
      // EventSource auto-reconnects internally; we just surface the state.
      setStatus("reconnecting");
    };

    return () => {
      es.removeEventListener("project.updated", refresh);
      es.close();
    };
  }, [projectId, accessToken, router]);

  return status;
}
