import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

// Pinged by UptimeRobot (or similar) to check that all backend dependencies
// are reachable. Returns 200 OK only if Postgres, Airtable, and Resend all
// respond. Returns 503 with per-component status otherwise.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const checks = await Promise.all([
    checkPostgres(),
    checkAirtable(),
    checkResend(),
  ]);
  const ok = checks.every((c) => c.ok);
  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      checks: Object.fromEntries(checks.map((c) => [c.name, c])),
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}

type CheckResult = {
  name: string;
  ok: boolean;
  durationMs: number;
  error?: string;
};

async function checkPostgres(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return { name: "postgres", ok: true, durationMs: Date.now() - start };
  } catch (e) {
    return {
      name: "postgres",
      ok: false,
      durationMs: Date.now() - start,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function checkAirtable(): Promise<CheckResult> {
  const start = Date.now();
  const key = process.env.AIRTABLE_SANDBOX_PAT;
  if (!key) {
    return {
      name: "airtable",
      ok: false,
      durationMs: 0,
      error: "AIRTABLE_SANDBOX_PAT not set",
    };
  }
  try {
    // List bases endpoint — cheapest authenticated call.
    const res = await fetch("https://api.airtable.com/v0/meta/bases?pageSize=1", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    return {
      name: "airtable",
      ok: res.ok,
      durationMs: Date.now() - start,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (e) {
    return {
      name: "airtable",
      ok: false,
      durationMs: Date.now() - start,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function checkResend(): Promise<CheckResult> {
  const start = Date.now();
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return {
      name: "resend",
      ok: false,
      durationMs: 0,
      error: "RESEND_API_KEY not set",
    };
  }
  try {
    // GET /domains is a cheap authenticated call. We don't actually need the
    // body; just confirming the API responds with 200 and the key works.
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    return {
      name: "resend",
      ok: res.ok,
      durationMs: Date.now() - start,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (e) {
    return {
      name: "resend",
      ok: false,
      durationMs: Date.now() - start,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
