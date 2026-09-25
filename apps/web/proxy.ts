import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_SIGNED_IN_PATH, safeRedirectPath } from "@/utils/auth-api";
import {
  GUEST_ONLY_ROUTES,
  matchesRoute,
  SESSION_COOKIE,
  SIGNED_IN_ONLY_ROUTES,
  signInPath,
} from "@/utils/auth-routes";

/**
 * Keeps signed-out visitors off the dashboard and signed-in users off the
 * sign-in pages. It only looks for the session cookie (an optimistic check);
 * the API still checks the session on every request.
 */
export const proxy = (request: NextRequest) => {
  const { pathname, search, searchParams } = request.nextUrl;
  const signedIn = request.cookies.has(SESSION_COOKIE);

  if (!signedIn && matchesRoute(pathname, SIGNED_IN_ONLY_ROUTES)) {
    return NextResponse.redirect(
      new URL(signInPath(`${pathname}${search}`), request.url),
    );
  }
  if (signedIn && matchesRoute(pathname, GUEST_ONLY_ROUTES)) {
    const next = safeRedirectPath(searchParams.get("next"));
    // `?next=` pointing at another guest-only page would redirect forever.
    const target = matchesRoute(
      new URL(next, request.url).pathname,
      GUEST_ONLY_ROUTES,
    )
      ? DEFAULT_SIGNED_IN_PATH
      : next;
    return NextResponse.redirect(new URL(target, request.url));
  }
  return NextResponse.next();
};

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
