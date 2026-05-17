/**
 * Programme registry — single source of truth for which Airtable bases this
 * portal connects to.
 *
 * Adding a new programme (e.g. MARS VI when it launches):
 *   1. Add a new entry to the array below with its base/table/field mapping
 *   2. Add an env var for the PAT (`AIRTABLE_<SLUG>_PAT`)
 *   3. Deploy.
 *
 * No other code should hardcode programme info.
 */

export type ProgrammeFields = {
  name: string;
  email: string;
  stream: string;
  stage: string;
  decision: string;
  decisionSentAt: string;
  mentorProject?: string;
};

export type Programme = {
  /** url-safe identifier, e.g. "mars-vi" */
  slug: string;
  /** shown in the applicant-facing UI */
  displayName: string;
  airtable: {
    /** env var name holding the Airtable PAT for this programme's base */
    apiKeyEnv: string;
    baseId: string;
    tableName: string;
    fields: ProgrammeFields;
  };
};

export const programmes: Programme[] = [
  {
    slug: "sandbox",
    displayName: "Portal Sandbox",
    airtable: {
      apiKeyEnv: "AIRTABLE_SANDBOX_PAT",
      baseId: "appklxly8WiSDXnoy",
      tableName: "Applications",
      fields: {
        name: "Name",
        email: "Email",
        stream: "Stream",
        stage: "Stage",
        decision: "Decision",
        decisionSentAt: "Decision Sent At",
        mentorProject: "Mentor Project",
      },
    },
  },
  // When MARS VI launches:
  // {
  //   slug: "mars-vi",
  //   displayName: "MARS VI",
  //   airtable: {
  //     apiKeyEnv: "AIRTABLE_MARS_VI_PAT",
  //     baseId: "appXXX",
  //     tableName: "Mentee Application",
  //     fields: { name: "name", email: "email", ... },
  //   },
  // },
];

/** Resolve a programme's API key from env vars at runtime. Throws if missing. */
export function getProgrammeApiKey(p: Programme): string {
  const key = process.env[p.airtable.apiKeyEnv];
  if (!key) {
    throw new Error(
      `Missing env var ${p.airtable.apiKeyEnv} for programme ${p.slug}`,
    );
  }
  return key;
}
