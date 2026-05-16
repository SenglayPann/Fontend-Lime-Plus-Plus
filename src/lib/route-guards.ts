import type { JWT } from "next-auth/jwt";

export const LOGIN_PATH = "/login";
export const AUTH_CALLBACK_PATH = "/auth/callback";
export const AUTHENTICATED_HOME_PATH = "/dashboard";

export const GUEST_ONLY_ROUTE_PREFIXES = [LOGIN_PATH];
export const PUBLIC_ROUTE_PREFIXES = [
  "/",
  ...GUEST_ONLY_ROUTE_PREFIXES,
  AUTH_CALLBACK_PATH,
];

export function isGuestOnlyRoute(pathname: string) {
  return matchesAnyRoutePrefix(pathname, GUEST_ONLY_ROUTE_PREFIXES);
}

export function isPublicRoute(pathname: string) {
  return matchesAnyRoutePrefix(pathname, PUBLIC_ROUTE_PREFIXES);
}

export function isValidSessionToken(token: JWT | null) {
  return Boolean(
    token &&
      !token.error &&
      typeof token.accessToken === "string" &&
      token.accessToken.length > 0,
  );
}

function matchesAnyRoutePrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => matchesRoutePrefix(pathname, prefix));
}

function matchesRoutePrefix(pathname: string, prefix: string) {
  if (prefix === "/") {
    return pathname === "/";
  }

  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
