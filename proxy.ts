import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Use the edge-compatible config (no Drizzle/pg). The `authorized` callback
// inside authConfig handles the redirect logic for /dashboard.
export const { auth: middleware } = NextAuth(authConfig);

export default middleware(() => {
  // The `authorized` callback in authConfig returns the redirect Response
  // when needed. If we get here as a callback handler, just let the request
  // through.
  return undefined;
});

export const config = {
  // Run middleware on /dashboard and any subpaths.
  // Exclude api routes, static files, and Next internals.
  matcher: ["/dashboard/:path*"],
};
