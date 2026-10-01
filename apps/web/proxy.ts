import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_SIGNED_IN_PATH, safeRedirectPath } from "@/utils/auth-api";
import {
  GUEST_ONLY_ROUTES,
  matchesRoute,
  SESSION_COOKIE,
  SIGNED_IN_ONLY_ROUTES,
  signInPath,
} from "@/utils/auth-routes";

/** The Nest API, reached directly from the server (as in next.config.js). */
const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

/** How long an embed's allowed sites are reused before asking again. */
const FRAME_ORIGINS_TTL_MS = 60_000;
const frameOrigins = new Map<string, { at: number; origins: string[] }>();

/** The sites an embed may be shown on; none if it's unavailable. */
const embedFrameOrigins = async (publicKey: string) => {
  const cached = frameOrigins.get(publicKey);
  if (cached && Date.now() - cached.at < FRAME_ORIGINS_TTL_MS) {
    return cached.origins;
  }
  let origins: string[] = [];
  try {
    const response = await fetch(
      `${API_URL}/embed/v1/frames/${encodeURIComponent(publicKey)}`,
    );
    if (response.ok) {
      origins = ((await response.json()) as { allowedOrigins: string[] })
        .allowedOrigins;
    }
  } catch {
    // Unreachable: framed nowhere else until it answers again.
  }
  frameOrigins.set(publicKey, { at: Date.now(), origins });
  return origins;
};

/**
 * An embed page may only be framed by the sites its owner allowed: the
 * browser enforces this header, whatever the page's own script does.
 */
const embedResponse = async (pathname: string) => {
  const publicKey = pathname.split("/")[2] ?? "";
  const origins = /^pk_[0-9a-f]{24}$/.test(publicKey)
    ? await embedFrameOrigins(publicKey)
    : [];
  const response = NextResponse.next();
  response.headers.set(
    "Content-Security-Policy",
    `frame-ancestors 'self' ${origins.join(" ")}`.trim(),
  );
  return response;
};

/**
 * Keeps signed-out visitors off the dashboard and signed-in users off the
 * sign-in pages. It only looks for the session cookie (an optimistic check);
 * the API still checks the session on every request. Embed pages get the
 * frame-ancestors their embed allows.
 */
export const proxy = async (request: NextRequest) => {
  const { pathname, search, searchParams } = request.nextUrl;
  if (pathname.startsWith("/embed/")) return embedResponse(pathname);
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
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/teams/:path*",
    "/auth/:path*",
    "/embed/:path*",
  ],
};
