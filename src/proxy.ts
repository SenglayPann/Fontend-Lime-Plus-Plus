import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  AUTHENTICATED_HOME_PATH,
  LOGIN_PATH,
  isGuestOnlyRoute,
  isPublicRoute,
  isValidSessionToken,
} from "./lib/route-guards";

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const isAuthenticated = isValidSessionToken(token);
  const { pathname, search } = request.nextUrl;

  if (isGuestOnlyRoute(pathname)) {
    if (isAuthenticated) {
      return redirectTo(request, AUTHENTICATED_HOME_PATH);
    }

    return NextResponse.next();
  }

  if (!isPublicRoute(pathname) && !isAuthenticated) {
    return redirectToLogin(request, `${pathname}${search}`);
  }

  return NextResponse.next();
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  return NextResponse.redirect(url);
}

function redirectToLogin(request: NextRequest, callbackUrl: string) {
  const url = request.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.search = "";

  if (callbackUrl && callbackUrl !== LOGIN_PATH) {
    url.searchParams.set("callbackUrl", callbackUrl);
  }

  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static files with extensions in /public
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
