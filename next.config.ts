import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  // Only print to stdout when explicitly enabled — avoids noisy build logs.
  silent: !process.env.CI,
  // Sentry's organisation and project slugs.
  org: "cambridge-ai-safety-hub",
  project: "javascript-nextjs",
  // Upload sourcemaps for stack-trace readability. Requires SENTRY_AUTH_TOKEN
  // env var set in Vercel; without it, sourcemap upload silently no-ops.
  widenClientFileUpload: true,
  // Route Sentry requests through a tunnel to avoid ad-blocker false positives.
  tunnelRoute: "/monitoring",
  // Avoid bundling Sentry into the page directly; lets it be tree-shaken when
  // unused on a route.
  disableLogger: true,
});
