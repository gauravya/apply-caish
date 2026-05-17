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
    // List bases — cheapest authenticated call. The endpoint doesn't accept
    // pageSize; we just take whatever default page Airtable returns.
    const res = await fetch("https://api.airtable.com/v0/meta/bases", {
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
  if (!key || !key.startsWith("re_")) {
    return {
      name: "resend",
      ok: false,
      durationMs: 0,
      error: "RESEND_API_KEY missing or malformed",
    };
  }
  try {
    // POST /emails with intentionally-empty body. If the key is valid we get
    // 422 (validation error — body is bad). If the key is invalid we get 401.
    // Either way, we never actually send an email — the request fails at
    // validation before delivery is attempted. Anything other than 401 means
    // the API is reachable and the key authenticates correctly.
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: "{}",
      cache: "no-store",
    });
    const ok = res.status !== 401 && res.status < 500;
    return {
      name: "resend",
      ok,
      durationMs: Date.now() - start,
      error: ok ? undefined : `HTTP ${res.status}`,
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
