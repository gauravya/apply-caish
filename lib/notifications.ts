/**
 * Decision email sending — the bridge from Airtable to applicant inbox.
 *
 * Flow (called by a Vercel cron every ~5 min):
 *   1. For each (programme, stage) in the registry, fetch all rows from
 *      Airtable with Decision sent = true and a non-empty Decision value.
 *   2. For each such row, check Postgres `decision_sends` for an existing
 *      record matching (programme, stage, record, decision_value).
 *   3. If not present: send a templated email via Resend, insert a log row.
 *
 * Idempotency: UNIQUE constraint on the four columns above means duplicate
 * cron runs can't double-send. A NEW Decision value on the same row produces
 * a new send (e.g. Interview -> Accept fires two emails over time).
 */
import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  programmes,
  getProgrammeApiKey,
  type Programme,
  type Stage,
} from "./programmes";

type Candidate = {
  programmeSlug: string;
  programmeDisplayName: string;
  stageId: string;
  stageDisplayName: string;
  recordId: string;
  decisionValue: string;
  emailTo: string;
  name: string | null;
  project: string | null;
  mentorName: string | null;
};

export type SendResult = {
  candidate: Candidate;
  status: "sent" | "skipped" | "error";
  messageId?: string;
  error?: string;
};

/**
 * Main entry point. Returns one result per row considered. Caller decides
 * what to log / surface.
 */
export async function sendPendingDecisions(): Promise<SendResult[]> {
  const candidates: Candidate[] = [];
  for (const p of programmes) {
    for (const s of p.stages) {
      const rows = await fetchCandidates(p, s);
      candidates.push(...rows);
    }
  }

  const results: SendResult[] = [];
  for (const c of candidates) {
    try {
      const alreadySent = await isAlreadySent(c);
      if (alreadySent) {
        results.push({ candidate: c, status: "skipped" });
        continue;
      }
      const messageId = await sendEmail(c);
      await recordSend(c, messageId);
      results.push({ candidate: c, status: "sent", messageId });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ candidate: c, status: "error", error: msg });
    }
  }
  return results;
}

async function fetchCandidates(
  p: Programme,
  s: Stage,
): Promise<Candidate[]> {
  const decisionField = s.fields.decision;
  const decisionSentField = s.fields.decisionSent;
  if (!decisionField || !decisionSentField) return [];
  const apiKey = getProgrammeApiKey(p);
  const f = s.fields;

  // Airtable's filterByFormula needs unticked checkboxes treated as 0/empty.
  const formula = `AND({${decisionSentField}}=1, {${decisionField}}!="")`;

  const out: Candidate[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(
      `https://api.airtable.com/v0/${p.airtable.baseId}/${encodeURIComponent(s.tableName)}`,
    );
    url.searchParams.set("filterByFormula", formula);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      // Don't cache here — cron needs fresh state.
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(
        `sendPendingDecisions: Airtable fetch failed for ${p.slug}/${s.id}: HTTP ${res.status}`,
      );
      break;
    }
    const data: {
      records: Array<{ id: string; fields: Record<string, unknown> }>;
      offset?: string;
    } = await res.json();
    for (const r of data.records) {
      const email = stringOrNull(r.fields, f.email);
      const decisionValue = stringOrNull(r.fields, decisionField);
      if (!email || !decisionValue) continue;
      out.push({
        programmeSlug: p.slug,
        programmeDisplayName: p.displayName,
        stageId: s.id,
        stageDisplayName: s.displayName,
        recordId: r.id,
        decisionValue,
        emailTo: email.toLowerCase(),
        name: stringOrNull(r.fields, f.name),
        project: f.project ? stringOrNull(r.fields, f.project) : null,
        mentorName: f.mentorName
          ? stringOrNull(r.fields, f.mentorName)
          : null,
      });
    }
    offset = data.offset;
  } while (offset);
  return out;
}

async function isAlreadySent(c: Candidate): Promise<boolean> {
  const r = await db.execute<{ exists: boolean }>(sql`
    SELECT EXISTS (
      SELECT 1 FROM decision_sends
      WHERE programme_slug = ${c.programmeSlug}
        AND stage_id = ${c.stageId}
        AND record_id = ${c.recordId}
        AND decision_value = ${c.decisionValue}
    ) AS exists
  `);
  return Boolean(r.rows[0]?.exists);
}

async function recordSend(c: Candidate, messageId: string): Promise<void> {
  await db.execute(sql`
    INSERT INTO decision_sends
      (id, programme_slug, stage_id, record_id, decision_value, email_to, resend_message_id)
    VALUES
      (gen_random_uuid(), ${c.programmeSlug}, ${c.stageId}, ${c.recordId},
       ${c.decisionValue}, ${c.emailTo}, ${messageId})
    ON CONFLICT (programme_slug, stage_id, record_id, decision_value) DO NOTHING
  `);
}

async function sendEmail(c: Candidate): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not set");
  const from = process.env.EMAIL_FROM ?? "hello@cambridgeaisafety.org";

  const { subject, text, html } = renderTemplate(c);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: c.emailTo,
      subject,
      html,
      text,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

function renderTemplate(c: Candidate): {
  subject: string;
  text: string;
  html: string;
} {
  const greeting = c.name ? `Hi ${c.name.split(" ")[0]},` : "Hello,";
  const programmeLabel = c.project
    ? `${c.programmeDisplayName} — ${c.project}`
    : `${c.programmeDisplayName}: ${c.stageDisplayName}`;
  const portalUrl = process.env.AUTH_URL ?? "https://application.caish.org";

  const body = buildBody(c);

  const subject = `${c.programmeDisplayName} application — ${c.decisionValue}`;
  const text = `${greeting}

${body}

You can see the full details (and what you submitted) in your portal:
${portalUrl}/dashboard

If you have any questions, just reply to this email.

— CAISH Admissions`;

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:24px auto;padding:0 16px;color:#18181b;line-height:1.55">
<p>${greeting}</p>
<p>${escapeHtml(body).replaceAll("\n\n", "</p><p>")}</p>
<p>You can see the full details (and what you submitted) in your portal:</p>
<p><a href="${portalUrl}/dashboard" style="color:#0f172a;text-decoration:underline">${portalUrl}/dashboard</a></p>
<p>If you have any questions, just reply to this email.</p>
<p style="color:#71717a;margin-top:32px">— CAISH Admissions</p>
</body></html>`;

  return { subject: subject + ` (re: ${programmeLabel})`, text, html };
}

function buildBody(c: Candidate): string {
  const programme = c.programmeDisplayName;
  const stage = c.stageDisplayName;
  const project = c.project ? `the project "${c.project}"` : programme;
  const decision = c.decisionValue.toLowerCase();

  // Map decision values to message bodies. Add new branches as new
  // decision values get used in the registry.
  if (decision === "accept") {
    return c.mentorName
      ? `Great news — you've been accepted to ${project} with ${c.mentorName}. They'll be in touch directly to set things up.

Welcome to MARS.`
      : `Great news — you've been accepted to ${programme} (${stage}). We'll follow up shortly with next steps.

Welcome.`;
  }
  if (decision === "reject") {
    return `Thank you for applying to ${programme}. Unfortunately we're not able to offer you a place this round. We had many more strong applications than spots; this is not a reflection of the quality of your work.

We hope to see you apply to future programmes.`;
  }
  if (decision === "waitlist") {
    return `You've been waitlisted for ${project}. We'll be in touch if a spot opens up. This usually resolves within a couple of weeks of the cycle starting.`;
  }
  if (decision.includes("interview")) {
    return c.mentorName
      ? `Good news — ${c.mentorName} has invited you to interview for ${project}. They'll reach out shortly to schedule.`
      : `Good news — you've been invited to interview for ${project}. We'll be in touch to schedule.`;
  }
  if (decision.includes("excited about future")) {
    return `Thank you for applying to ${programme}. We aren't able to offer you a place this round, but we were genuinely impressed by your application and would love to see you apply again. Please stay in touch.`;
  }
  // Fallback for unrecognised decision values.
  return `Your application to ${project} has been updated to: ${c.decisionValue}.`;
}

function stringOrNull(
  fields: Record<string, unknown>,
  key: string,
): string | null {
  const v = fields[key];
  if (v == null || v === "") return null;
  return String(v);
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
