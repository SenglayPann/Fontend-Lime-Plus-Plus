jest.mock("next-auth/jwt", () => ({
  getToken: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    next: jest.fn(() =>
      mockProxyResponse(200, {
        "x-middleware-next": "1",
      }),
    ),
    redirect: jest.fn((url: URL) =>
      mockProxyResponse(307, {
        location: url.toString(),
      }),
    ),
  },
}));

import { getToken } from "next-auth/jwt";
import { proxy } from "./proxy";
import {
  AUTHENTICATED_HOME_PATH,
  LOGIN_PATH,
  isGuestOnlyRoute,
  isPublicRoute,
  isValidSessionToken,
} from "./lib/route-guards";

describe("request proxy authorization", () => {
  const mockedGetToken = getToken as jest.Mock;

  beforeEach(() => {
    mockedGetToken.mockReset();
  });

  it("allows valid authenticated tokens on protected routes", async () => {
    mockedGetToken.mockResolvedValue({ sub: "user-1", accessToken: "token" });

    const response = await proxy(createRequest("/dashboard"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects missing tokens from protected routes to login", async () => {
    mockedGetToken.mockResolvedValue(null);

    const response = await proxy(createRequest("/dashboard?tab=summary"));
    const location = new URL(response.headers.get("location")!);

    expect(location.pathname).toBe(LOGIN_PATH);
    expect(location.searchParams.get("callbackUrl")).toBe(
      "/dashboard?tab=summary",
    );
  });

  it("redirects tokens with refresh errors from protected routes", async () => {
    mockedGetToken.mockResolvedValue({
      sub: "user-1",
      accessToken: "token",
      error: "RefreshAccessTokenError",
    });

    const response = await proxy(createRequest("/projects"));
    const location = new URL(response.headers.get("location")!);

    expect(location.pathname).toBe(LOGIN_PATH);
  });

  it("allows unauthenticated users to access guest-only auth routes", async () => {
    mockedGetToken.mockResolvedValue(null);

    const response = await proxy(createRequest("/login"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
  });

  it("allows unauthenticated users to access the public landing page", async () => {
    mockedGetToken.mockResolvedValue(null);

    const response = await proxy(createRequest("/"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
  });

  it("allows unauthenticated users to complete the auth callback", async () => {
    mockedGetToken.mockResolvedValue(null);

    const response = await proxy(createRequest("/auth/callback?code=abc"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects authenticated users away from guest-only auth routes", async () => {
    mockedGetToken.mockResolvedValue({ sub: "user-1", accessToken: "token" });

    const response = await proxy(createRequest("/login"));
    const location = new URL(response.headers.get("location")!);

    expect(location.pathname).toBe(AUTHENTICATED_HOME_PATH);
    expect(location.search).toBe("");
  });

  it("classifies auth routes centrally", () => {
    expect(isGuestOnlyRoute("/login")).toBe(true);
    expect(isGuestOnlyRoute("/auth/callback")).toBe(true);
    expect(isPublicRoute("/")).toBe(true);
    expect(isPublicRoute("/login")).toBe(true);
    expect(isPublicRoute("/dashboard")).toBe(false);
  });

  it("treats missing access tokens as invalid sessions", () => {
    expect(isValidSessionToken({ sub: "user-1" } as never)).toBe(false);
    expect(
      isValidSessionToken({ sub: "user-1", accessToken: "token" } as never),
    ).toBe(true);
  });
});

function createRequest(path: string) {
  const url = new URL(path, "http://localhost:3000");

  return {
    nextUrl: {
      get pathname() {
        return url.pathname;
      },
      get search() {
        return url.search;
      },
      clone() {
        return new URL(url.toString());
      },
    },
  } as never;
}

function mockProxyResponse(status: number, headers: Record<string, string>) {
  const normalizedHeaders = new Map(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );

  return {
    status,
    headers: {
      get(name: string) {
        return normalizedHeaders.get(name.toLowerCase()) ?? null;
      },
    },
  };
}
