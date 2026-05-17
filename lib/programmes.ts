/**
 * Programme registry.
 *
 * Each CAISH programme lives in its own Airtable base — they stay isolated
 * for permissions, schema independence, and safe archival. A programme has
 * one or more *stages*, each backed by a separate Airtable table. MARS has
 * two stages (one row per applicant for Stage 1; many rows per applicant
 * for Stage 2 mentor projects). HVP or internships might have just one stage.
 *
 * Adding a new programme:
 *   1. New Airtable base with one or more application tables
 *   2. Add an env var for its PAT (`AIRTABLE_<SLUG>_PAT`)
 *   3. Add an entry to the `programmes` array below
 */

export type StageFieldMap = {
  /** field holding the applicant's name */
  name: string;
  /** field holding the applicant's email (used for filtering — case-insensitive) */
  email: string;
  /** field holding stream/track, if applicable */
  stream?: string;
  /** field holding the decision (Accept/Reject/Waitlist/...) */
  decision?: string;
  /** field holding when the application was submitted */
  submissionDate?: string;
  /** field holding when the decision was sent to the applicant */
  decisionSentAt?: string;
  /** field holding the mentor project name (Stage 2 only) */
  project?: string;
  /**
   * Fields to render as the applicant's submitted content on the detail page.
   * Order is preserved in the UI.
   */
  contentFields: Array<{ label: string; field: string }>;
};

export type Stage = {
  /** stable id used in URLs, e.g. "stage1" */
  id: string;
  /** shown to applicants in the dashboard, e.g. "Stage 1 Application" */
  displayName: string;
  /** Airtable table name */
  tableName: string;
  fields: StageFieldMap;
};

export type Programme = {
  slug: string;
  displayName: string;
  airtable: {
    /** env var name holding the Airtable PAT for this programme */
    apiKeyEnv: string;
    baseId: string;
  };
  stages: Stage[];
};

export const programmes: Programme[] = [
  {
    slug: "mars-sandbox",
    displayName: "MARS (Sandbox)",
    airtable: {
      apiKeyEnv: "AIRTABLE_SANDBOX_PAT",
      baseId: "appklxly8WiSDXnoy",
    },
    stages: [
      {
        id: "stage1",
        displayName: "Stage 1 Application",
        tableName: "Stage 1",
        fields: {
          name: "Name",
          email: "Email",
          stream: "Stream Type",
          decision: "Decision",
          submissionDate: "Submission Date",
          contentFields: [
            { label: "Why MARS?", field: "Why MARS?" },
            { label: "Technical Background", field: "Technical Background" },
            { label: "AI Safety Background", field: "AI Safety Background" },
            { label: "Hours per Week", field: "Hours per Week" },
            { label: "Hours Justification", field: "Hours Justification" },
            { label: "LinkedIn", field: "LinkedIn" },
            { label: "CV", field: "CV URL" },
          ],
        },
      },
      {
        id: "stage2",
        displayName: "Stage 2 — Mentor Project Application",
        tableName: "Stage 2",
        fields: {
          name: "Name",
          email: "Email",
          stream: "Stream Type",
          decision: "Decision",
          submissionDate: "Submission Date",
          decisionSentAt: "Decision Sent At",
          project: "Mentor Project",
          contentFields: [
            { label: "Project Response", field: "Project Response" },
            {
              label: "Three Impressive Achievements",
              field: "Three Impressive Achievements",
            },
            { label: "AIS Experience", field: "AIS Experience" },
            { label: "Hours Justification", field: "Hours Justification" },
          ],
        },
      },
    ],
  },
  // When MARS VI launches, add a new entry pointing at its own base.
  // When HVP launches, add a single-stage entry.
];

/** Resolve a programme's API key from env vars at runtime. */
export function getProgrammeApiKey(p: Programme): string {
  const key = process.env[p.airtable.apiKeyEnv];
  if (!key) {
    throw new Error(
      `Missing env var ${p.airtable.apiKeyEnv} for programme ${p.slug}`,
    );
  }
  return key;
}

export function findProgramme(slug: string): Programme | undefined {
  return programmes.find((p) => p.slug === slug);
}

export function findStage(
  programme: Programme,
  stageId: string,
): Stage | undefined {
  return programme.stages.find((s) => s.id === stageId);
}
