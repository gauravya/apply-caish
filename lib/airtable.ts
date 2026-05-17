/**
 * Server-only Airtable client.
 *
 * Critical: never call these from the browser. The email argument MUST come
 * from a verified auth session (await auth()), never from request body/query
 * parameters. Filtering happens server-side via Airtable's filterByFormula —
 * we never receive other applicants' records.
 */
import "server-only";
import {
  programmes,
  getProgrammeApiKey,
  type Programme,
} from "./programmes";

export type ApplicationRecord = {
  /** programme slug — for grouping in the UI */
  programmeSlug: string;
  /** programme display name — for the UI header */
  programmeDisplayName: string;
  /** opaque Airtable record id — only used internally, never trust from client */
  recordId: string;
  name: string | null;
  email: string;
  stream: string | null;
  stage: string | null;
  decision: string | null;
  decisionSentAt: string | null;
  mentorProject: string | null;
};

/**
 * Fetch all application records across all registered programmes for a given
 * email. Email comparison is case-insensitive via Airtable's LOWER().
 */
export async function getApplicationsByEmail(
  email: string,
): Promise<ApplicationRecord[]> {
  if (!email) return [];
  const lower = email.trim().toLowerCase();
  if (!lower) return [];

  const perProgramme = await Promise.all(
    programmes.map((p) => fetchProgrammeApplications(p, lower)),
  );
  return perProgramme.flat();
}

async function fetchProgrammeApplications(
  p: Programme,
  emailLower: string,
): Promise<ApplicationRecord[]> {
  const apiKey = getProgrammeApiKey(p);
  const f = p.airtable.fields;

  // filterByFormula: LOWER({Email})="someone@example.com"
  const formula = `LOWER({${f.email}})="${emailLower.replace(/"/g, '\\"')}"`;

  const url = new URL(
    `https://api.airtable.com/v0/${p.airtable.baseId}/${encodeURIComponent(
      p.airtable.tableName,
    )}`,
  );
  url.searchParams.set("filterByFormula", formula);
  url.searchParams.set("pageSize", "100");
  // Only fetch the fields we display, never the Internal Notes
  url.searchParams.append("fields[]", f.name);
  url.searchParams.append("fields[]", f.email);
  url.searchParams.append("fields[]", f.stream);
  url.searchParams.append("fields[]", f.stage);
  url.searchParams.append("fields[]", f.decision);
  url.searchParams.append("fields[]", f.decisionSentAt);
  if (f.mentorProject) {
    url.searchParams.append("fields[]", f.mentorProject);
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    // Cache for 60s per programme+email — cuts rate-limit exposure during
    // decision-send surges where many applicants log in within minutes.
    next: { revalidate: 60, tags: [`programme:${p.slug}:${emailLower}`] },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(
      `Airtable fetch failed for programme=${p.slug} status=${res.status}: ${body.slice(0, 200)}`,
    );
    return [];
  }

  const data: { records: Array<{ id: string; fields: Record<string, unknown> }> } =
    await res.json();

  return data.records.map((r) => ({
    programmeSlug: p.slug,
    programmeDisplayName: p.displayName,
    recordId: r.id,
    name: getString(r.fields, f.name),
    email: getString(r.fields, f.email) ?? emailLower,
    stream: getString(r.fields, f.stream),
    stage: getString(r.fields, f.stage),
    decision: getString(r.fields, f.decision),
    decisionSentAt: getString(r.fields, f.decisionSentAt),
    mentorProject: f.mentorProject
      ? getString(r.fields, f.mentorProject)
      : null,
  }));
}

function getString(
  fields: Record<string, unknown>,
  key: string,
): string | null {
  const v = fields[key];
  if (v == null || v === "") return null;
  return String(v);
}
