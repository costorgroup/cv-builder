/**
 * Who may open which routes. Everything not listed (the home page, /print…)
 * is open to everyone.
 */

/** Only when signed out; signed-in users are sent to the dashboard. */
export const GUEST_ONLY_ROUTES = [
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
  "/auth/reset-password",
];

/** Only when signed in; others are sent to sign in and back. */
export const SIGNED_IN_ONLY_ROUTES = [
  "/dashboard",
  "/auth/change-password",
  "/auth/sign-out",
];

/**
 * Set by the API on sign-in and cleared on sign-out (or when it can't be
 * refreshed). It lasts as long as the session, unlike the 15-minute access
 * token, so it's what tells a signed-in browser apart.
 */
export const SESSION_COOKIE = "refresh_token";

export const matchesRoute = (pathname: string, routes: string[]) =>
  routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

export const signInPath = (next?: string) =>
  next ? `/auth/sign-in?next=${encodeURIComponent(next)}` : "/auth/sign-in";
