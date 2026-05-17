import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import {
  getApplicationsByEmail,
  type ApplicationSummary,
} from "@/lib/airtable";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard – CAISH Applications",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }
  const email = session.user.email;
  const apps = await getApplicationsByEmail(email);

  // Group by programme, then by stage. Preserve order from the registry.
  const byProgramme = new Map<
    string,
    {
      displayName: string;
      stages: Map<string, { displayName: string; rows: ApplicationSummary[] }>;
    }
  >();
  for (const a of apps) {
    if (!byProgramme.has(a.programmeSlug)) {
      byProgramme.set(a.programmeSlug, {
        displayName: a.programmeDisplayName,
        stages: new Map(),
      });
    }
    const prog = byProgramme.get(a.programmeSlug)!;
    if (!prog.stages.has(a.stageId)) {
      prog.stages.set(a.stageId, {
        displayName: a.stageDisplayName,
        rows: [],
      });
    }
    prog.stages.get(a.stageId)!.rows.push(a);
  }

  return (
    <main className="wrap">
      <h1>Your applications</h1>
      <p>
        Signed in as {email}.{" "}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
          style={{ display: "inline" }}
        >
          <button
            type="submit"
            style={{
              background: "none",
              border: 0,
              padding: 0,
              color: "-webkit-link",
              textDecoration: "underline",
              cursor: "pointer",
              font: "inherit",
            }}
          >
            Sign out
          </button>
        </form>
        .
      </p>

      <hr />

      {byProgramme.size === 0 ? (
        <>
          <p>We do not have any applications on file for this email.</p>
          <p>
            If you think this is a mistake, email{" "}
            <a href="mailto:hello@cambridgeaisafety.org">
              hello@cambridgeaisafety.org
            </a>
            .
          </p>
        </>
      ) : (
        Array.from(byProgramme.entries()).map(([progSlug, prog]) => (
          <section key={progSlug}>
            <h2>{prog.displayName}</h2>
            {Array.from(prog.stages.entries()).map(([stageId, stage]) => (
              <div key={stageId}>
                <h3>{stage.displayName}</h3>
                <ul>
                  {stage.rows.map((app) => (
                    <li key={app.recordId}>
                      <Link
                        href={`/dashboard/${app.programmeSlug}/${app.stageId}/${app.recordId}`}
                      >
                        {app.project ?? "Application"}
                      </Link>
                      {app.stream ? <> &middot; Stream: {app.stream}</> : null}
                      {app.mentorName ? (
                        <> &middot; Mentor: {app.mentorName}</>
                      ) : null}
                      {app.submissionDate ? (
                        <> &middot; Submitted {app.submissionDate}</>
                      ) : null}
                      {" "}
                      <DecisionTag decision={app.decision} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))
      )}

      <hr />

      <footer className="page">
        Data refreshes every 60 seconds. For anything urgent, email{" "}
        <a href="mailto:hello@cambridgeaisafety.org">
          hello@cambridgeaisafety.org
        </a>
        . <Link href="/privacy">Privacy</Link>.
      </footer>
    </main>
  );
}

function DecisionTag({ decision }: { decision: string | null }) {
  const label = decision ?? "Under review";
  return <span>[{label.toUpperCase()}]</span>;
}
