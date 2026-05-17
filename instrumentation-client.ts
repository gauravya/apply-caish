import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Smaller sample rate in production to stay under quota.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  // Capture replays for sessions with errors. Helps debug "applicant says X happened".
  replaysOnErrorSampleRate: 1.0,
  // Don't always-on replay (privacy + quota).
  replaysSessionSampleRate: 0,
  integrations: [
    Sentry.replayIntegration({
      // Mask all text + inputs by default — applicants' essay content is PII.
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
});

// Required by Next.js for client-side navigation instrumentation.
export const onRouterTransitionStart =
  Sentry.captureRouterTransitionStart;
