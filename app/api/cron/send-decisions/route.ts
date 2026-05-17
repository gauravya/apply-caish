import { NextResponse } from "next/server";
import { sendPendingDecisions } from "@/lib/notifications";

// Vercel cron fires this every 5 minutes (see vercel.json). Vercel sends an
// Authorization: Bearer <CRON_SECRET> header that we verify. This same route
// can also be triggered manually with the same secret for ad-hoc sending.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const start = Date.now();
  const results = await sendPendingDecisions();

  const summary = {
    sent: results.filter((r) => r.status === "sent").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errored: results.filter((r) => r.status === "error").length,
    durationMs: Date.now() - start,
  };
  const errors = results
    .filter((r) => r.status === "error")
    .map((r) => ({
      programme: r.candidate.programmeSlug,
      stage: r.candidate.stageId,
      record: r.candidate.recordId,
      error: r.error,
    }));

  // Log to stdout so Vercel function logs capture it
  console.log("send-decisions:", summary);
  if (errors.length) console.error("send-decisions errors:", errors);

  return NextResponse.json({ ...summary, errors });
}
