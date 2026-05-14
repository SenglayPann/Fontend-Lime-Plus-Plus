import "server-only";

export type ServerApiResult<T> = {
  data: T;
  error: string | null;
  status?: number;
};

export async function fetchServerApi<T>(
  path: string,
  token: string,
  fallback: T,
): Promise<ServerApiResult<T>> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    return {
      data: fallback,
      error: "Backend API URL is not configured",
    };
  }

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        data: fallback,
        error: apiErrorMessage(json, res.status, res.statusText),
        status: res.status,
      };
    }

    return {
      data: json?.success ? (json.data as T) : ((json ?? fallback) as T),
      error: null,
      status: res.status,
    };
  } catch (error) {
    console.error(`Error fetching ${path}:`, error);
    return {
      data: fallback,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}

function apiErrorMessage(json: unknown, status: number, statusText: string) {
  if (isRecord(json)) {
    const nestedError = json.error;
    if (isRecord(nestedError) && typeof nestedError.message === "string") {
      return nestedError.message;
    }

    if (typeof json.message === "string") {
      return json.message;
    }
  }

  return statusText || `Request failed with status ${status}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
