import * as Sentry from "@sentry/nextjs";

// Server-side Sentry initialisation. Runs on Node + Edge runtimes.
// Browser-side initialisation lives in instrumentation-client.ts.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      // Lower sample rate in prod to stay well under free-tier quota.
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      // Don't sample noisy 4xx errors as transactions.
      enableLogs: false,
    });
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
