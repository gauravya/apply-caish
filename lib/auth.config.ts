import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config (no providers, no DB adapter).
 * Imported by proxy.ts so it can run on Vercel Edge.
 * The full config with the Resend provider + Drizzle adapter lives in ./auth.ts.
 */
export const authConfig = {
  providers: [],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
    error: "/login/error",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = request.nextUrl.pathname.startsWith("/dashboard");
      if (isProtected && !isLoggedIn) {
        const loginUrl = new URL("/login", request.nextUrl.origin);
        loginUrl.searchParams.set("next", request.nextUrl.pathname);
        return Response.redirect(loginUrl);
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
