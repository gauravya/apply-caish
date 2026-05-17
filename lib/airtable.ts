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
  if (f.submissionDate)
    url.searchParams.append("fields[]", f.submissionDate);
  if (f.decisionSentAt)
    url.searchParams.append("fields[]", f.decisionSentAt);
  if (f.project) url.searchParams.append("fields[]", f.project);

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
  return {
    programmeSlug: programme.slug,
    programmeDisplayName: programme.displayName,
    stageId: stage.id,
    stageDisplayName: stage.displayName,
    recordId: record.id,
    name: getString(record.fields, f.name),
    email: getString(record.fields, f.email) ?? "",
    stream: f.stream ? getString(record.fields, f.stream) : null,
    decision: f.decision ? getString(record.fields, f.decision) : null,
    submissionDate: f.submissionDate
      ? getString(record.fields, f.submissionDate)
      : null,
    decisionSentAt: f.decisionSentAt
      ? getString(record.fields, f.decisionSentAt)
      : null,
    project: f.project ? getString(record.fields, f.project) : null,
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
