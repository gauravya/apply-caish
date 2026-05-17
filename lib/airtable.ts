/**
 * Server-only Airtable client.
 *
 * Critical: the email argument MUST come from a verified auth session, never
 * from request body or query parameters. All filtering happens server-side
 * via Airtable filterByFormula — we never receive other applicants' records.
 */
import "server-only";
import {
  programmes,
  getProgrammeApiKey,
  findProgramme,
  findStage,
  type Programme,
  type Stage,
} from "./programmes";

export type ApplicationSummary = {
  programmeSlug: string;
  programmeDisplayName: string;
  stageId: string;
  stageDisplayName: string;
  recordId: string;
  name: string | null;
  email: string;
  stream: string | null;
  decision: string | null;
  submissionDate: string | null;
  decisionSentAt: string | null;
  project: string | null;
  mentorName: string | null;
};

export type ApplicationDetail = ApplicationSummary & {
  /** All content fields (label → value) for re-reading the application */
  content: Array<{ label: string; value: string | null }>;
};

/** Fetch all applications across all programmes + stages for an email. */
export async function getApplicationsByEmail(
  email: string,
): Promise<ApplicationSummary[]> {
  if (!email) return [];
  const lower = email.trim().toLowerCase();
  if (!lower) return [];

  const queries: Array<Promise<ApplicationSummary[]>> = [];
  for (const p of programmes) {
    for (const s of p.stages) {
      queries.push(fetchSummaries(p, s, lower));
    }
  }
  const results = await Promise.all(queries);
  return results.flat();
}

/**
 * Fetch one specific record by id, verifying it belongs to the given email.
 * Returns null if the record doesn't exist or the email doesn't match.
 */
export async function getApplicationDetail(
  email: string,
  programmeSlug: string,
  stageId: string,
  recordId: string,
): Promise<ApplicationDetail | null> {
  if (!email) return null;
  const lower = email.trim().toLowerCase();
  const programme = findProgramme(programmeSlug);
  if (!programme) return null;
  const stage = findStage(programme, stageId);
  if (!stage) return null;

  const apiKey = getProgrammeApiKey(programme);
  const f = stage.fields;

  const url = `https://api.airtable.com/v0/${programme.airtable.baseId}/${encodeURIComponent(stage.tableName)}/${encodeURIComponent(recordId)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    if (res.status !== 404) {
      console.error(
        `Airtable detail fetch failed for ${programmeSlug}/${stageId}/${recordId}: HTTP ${res.status}`,
      );
    }
    return null;
  }
  const record = (await res.json()) as {
    id: string;
    fields: Record<string, unknown>;
  };

  const recordEmail = getString(record.fields, f.email)?.toLowerCase() ?? null;
  // Security: only return the record if its email matches the session.
  if (!recordEmail || recordEmail !== lower) return null;

  // Detail page also respects the Decision sent gate (summary handles this
  // already, but be explicit so the content + decision are consistent).
  return {
    ...summaryFromRecord(programme, stage, record),
    content: f.contentFields.map((cf) => ({
      label: cf.label,
      value: getString(record.fields, cf.field),
    })),
  };
}

async function fetchSummaries(
  programme: Programme,
  stage: Stage,
  emailLower: string,
): Promise<ApplicationSummary[]> {
  const apiKey = getProgrammeApiKey(programme);
  const f = stage.fields;

  const formula = `LOWER({${f.email}})="${emailLower.replace(/"/g, '\\"')}"`;

  const url = new URL(
    `https://api.airtable.com/v0/${programme.airtable.baseId}/${encodeURIComponent(stage.tableName)}`,
  );
  url.searchParams.set("filterByFormula", formula);
  url.searchParams.set("pageSize", "100");
  // Fetch only the summary fields here; detail page fetches content separately.
  url.searchParams.append("fields[]", f.name);
  url.searchParams.append("fields[]", f.email);
  if (f.stream) url.searchParams.append("fields[]", f.stream);
  if (f.decision) url.searchParams.append("fields[]", f.decision);
  if (f.decisionSent) url.searchParams.append("fields[]", f.decisionSent);
  if (f.submissionDate)
    url.searchParams.append("fields[]", f.submissionDate);
  if (f.decisionSentAt)
    url.searchParams.append("fields[]", f.decisionSentAt);
  if (f.project) url.searchParams.append("fields[]", f.project);
  if (f.mentorName) url.searchParams.append("fields[]", f.mentorName);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    // 60s cache to soften rate-limit spikes during decision-send surges.
    next: {
      revalidate: 60,
      tags: [`programme:${programme.slug}:${stage.id}:${emailLower}`],
    },
  });
  if (!res.ok) {
    console.error(
      `Airtable list fetch failed for ${programme.slug}/${stage.id}: HTTP ${res.status}`,
    );
    return [];
  }
  const data: { records: Array<{ id: string; fields: Record<string, unknown> }> } =
    await res.json();
  return data.records.map((r) => summaryFromRecord(programme, stage, r));
}

function summaryFromRecord(
  programme: Programme,
  stage: Stage,
  record: { id: string; fields: Record<string, unknown> },
): ApplicationSummary {
  const f = stage.fields;
  // Gate decision visibility behind the Decision sent checkbox. Until an
  // admin explicitly ticks it, the applicant sees "Under review" even if a
  // value has been set in the Decision field. Lets admins change their mind
  // in Airtable without leaking premature decisions.
  const isPublished = f.decisionSent
    ? Boolean(record.fields[f.decisionSent])
    : true;
  const rawDecision = f.decision
    ? getString(record.fields, f.decision)
    : null;
  return {
    programmeSlug: programme.slug,
    programmeDisplayName: programme.displayName,
    stageId: stage.id,
    stageDisplayName: stage.displayName,
    recordId: record.id,
    name: getString(record.fields, f.name),
    email: getString(record.fields, f.email) ?? "",
    stream: f.stream ? getString(record.fields, f.stream) : null,
    decision: isPublished ? rawDecision : null,
    submissionDate: f.submissionDate
      ? getString(record.fields, f.submissionDate)
      : null,
    decisionSentAt:
      isPublished && f.decisionSentAt
        ? getString(record.fields, f.decisionSentAt)
        : null,
    project: f.project ? getString(record.fields, f.project) : null,
    mentorName: f.mentorName ? getString(record.fields, f.mentorName) : null,
  };
}

function getString(
  fields: Record<string, unknown>,
  key: string,
): string | null {
  const v = fields[key];
  if (v == null || v === "") return null;
  return String(v);
}

/**
 * GDPR-safe delete. Removes:
 *   - All Airtable rows in all programmes/stages where the email matches
 *   - All decision_sends log entries for that email
 *   - All auth tokens, sessions, and users for that email (cascade)
 *
 * Returns counts so the caller can audit. Throws on the first programme
 * that fails — partial deletes are preferred to silent skips so the caller
 * can retry.
 */
export async function deleteByEmail(email: string): Promise<{
  airtableDeleted: number;
  decisionSendsDeleted: number;
  authRowsDeleted: number;
}> {
  if (!email) throw new Error("email required");
  const lower = email.trim().toLowerCase();

  // 1. Airtable: scan each programme/stage, find records matching email, batch-delete
  let airtableDeleted = 0;
  for (const p of programmes) {
    for (const s of p.stages) {
      const apiKey = getProgrammeApiKey(p);
      const f = s.fields;
      const formula = `LOWER({${f.email}})="${lower.replace(/"/g, '\\"')}"`;

      // List matching records (we only need ids)
      const listUrl = new URL(
        `https://api.airtable.com/v0/${p.airtable.baseId}/${encodeURIComponent(s.tableName)}`,
      );
      listUrl.searchParams.set("filterByFormula", formula);
      listUrl.searchParams.set("fields[]", f.email);
      listUrl.searchParams.set("pageSize", "100");

      const listRes = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
      });
      if (!listRes.ok) {
        throw new Error(
          `deleteByEmail list failed for ${p.slug}/${s.id}: HTTP ${listRes.status}`,
        );
      }
      const data: { records: Array<{ id: string }> } = await listRes.json();
      if (data.records.length === 0) continue;

      // Batch delete (10 per call)
      const ids = data.records.map((r) => r.id);
      for (let i = 0; i < ids.length; i += 10) {
        const batch = ids.slice(i, i + 10);
        const delUrl = new URL(
          `https://api.airtable.com/v0/${p.airtable.baseId}/${encodeURIComponent(s.tableName)}`,
        );
        for (const id of batch) delUrl.searchParams.append("records[]", id);
        const delRes = await fetch(delUrl, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!delRes.ok) {
          throw new Error(
            `deleteByEmail delete failed for ${p.slug}/${s.id}: HTTP ${delRes.status}`,
          );
        }
        airtableDeleted += batch.length;
      }
    }
  }

  // 2. Postgres: decision_sends + auth tables
  const { db: pgDb } = await import("@/db/client");
  const { sql } = await import("drizzle-orm");

  const decisionSendsResult = await pgDb.execute(sql`
    DELETE FROM decision_sends WHERE LOWER(email_to) = ${lower}
  `);
  const authResult = await pgDb.execute(sql`
    DELETE FROM "user" WHERE LOWER(email) = ${lower}
  `);
  // 'user' has ON DELETE CASCADE to account/session, so those go too.

  return {
    airtableDeleted,
    decisionSendsDeleted: Number(decisionSendsResult.rowCount ?? 0),
    authRowsDeleted: Number(authResult.rowCount ?? 0),
  };
}
