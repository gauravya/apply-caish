import type { NextAuthConfig } from "next-auth";
import Resend from "next-auth/providers/resend";

/**
 * Edge-compatible auth config (no DB adapter here).
 * Imported by middleware.ts so it can run on Vercel Edge.
 * The full config with the Drizzle adapter lives in ./auth.ts.
 */
export const authConfig = {
  providers: [
    Resend({
      from: process.env.EMAIL_FROM,
      apiKey: process.env.RESEND_API_KEY,
      // Magic-link tokens expire after 15 min (Auth.js default is 24h — too long for a portal)
      maxAge: 15 * 60,
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
  },
  session: {
    strategy: "jwt",
  },
  // Required when the app's URL differs from request hostname (Vercel preview deploys, etc.)
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
