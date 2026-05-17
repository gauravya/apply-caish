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
    { displayName: string; stages: Map<string, { displayName: string; rows: ApplicationSummary[] }> }
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
    <main className="flex-1 flex flex-col px-6 py-16">
      <div className="w-full max-w-2xl mx-auto">
        <header className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Your applications
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Signed in as <span className="font-medium">{email}</span>
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-zinc-600 dark:text-zinc-400 underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Sign out
            </button>
          </form>
        </header>

        <section className="mt-10">
          {byProgramme.size === 0 ? (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-8 text-center">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                We don&apos;t have any applications on file for this email.
              </p>
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
                If you think this is a mistake, email{" "}
                <a
                  className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100"
                  href="mailto:hello@cambridgeaisafety.org"
                >
                  hello@cambridgeaisafety.org
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {Array.from(byProgramme.entries()).map(([progSlug, prog]) => (
                <section key={progSlug}>
                  <h2 className="text-xs uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-500">
                    {prog.displayName}
                  </h2>
                  <div className="mt-3 flex flex-col gap-6">
                    {Array.from(prog.stages.entries()).map(
                      ([stageId, stage]) => (
                        <div key={stageId}>
                          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {stage.displayName}
                          </h3>
                          <ul className="mt-2 flex flex-col gap-3">
                            {stage.rows.map((app) => (
                              <li key={app.recordId}>
                                <Link
                                  href={`/dashboard/${app.programmeSlug}/${app.stageId}/${app.recordId}`}
                                  className="block rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
                                >
                                  <div className="flex items-baseline justify-between gap-4">
                                    <div>
                                      {app.project ? (
                                        <p className="text-sm font-medium">
                                          {app.project}
                                        </p>
                                      ) : (
                                        <p className="text-sm font-medium">
                                          Application
                                        </p>
                                      )}
                                      {app.submissionDate ? (
                                        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
                                          Submitted {app.submissionDate}
                                        </p>
                                      ) : null}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {app.stream ? (
                                        <span className="text-xs rounded-full px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
                                          {app.stream}
                                        </span>
                                      ) : null}
                                      <DecisionBadge
                                        decision={app.decision}
                                      />
                                    </div>
                                  </div>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ),
                    )}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-16 text-xs text-zinc-500 dark:text-zinc-500">
          Data refreshes every 60 seconds. For anything urgent, email{" "}
          <a
            className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100"
            href="mailto:hello@cambridgeaisafety.org"
          >
            hello@cambridgeaisafety.org
          </a>
          .
        </footer>
      </div>
    </main>
  );
}

function DecisionBadge({ decision }: { decision: string | null }) {
  if (!decision) {
    return (
      <span className="text-xs rounded-full px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
        Under review
      </span>
    );
  }
  const lower = decision.toLowerCase();
  let cls = "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300";
  if (lower.startsWith("accept")) {
    cls =
      "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300";
  } else if (lower.startsWith("reject")) {
    cls = "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300";
  } else if (lower.startsWith("waitlist")) {
    cls =
      "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300";
  }
  return (
    <span className={`text-xs rounded-full px-2 py-0.5 ${cls}`}>
      {decision}
    </span>
  );
}
