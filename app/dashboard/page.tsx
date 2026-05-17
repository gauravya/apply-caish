import { auth, signOut } from "@/lib/auth";
import { getApplicationsByEmail } from "@/lib/airtable";
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
  const applications = await getApplicationsByEmail(email);

  return (
    <main className="flex-1 flex flex-col px-6 py-16">
      <div className="w-full max-w-2xl mx-auto">
        <header className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
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
          {applications.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-8 text-center">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                We don&apos;t have any applications on file for this email.
              </p>
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
                If you think this is a mistake, reach out at{" "}
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
            <ul className="flex flex-col gap-4">
              {applications.map((app) => (
                <li
                  key={app.recordId}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <h2 className="text-base font-medium">
                        {app.programmeDisplayName}
                      </h2>
                      {app.mentorProject ? (
                        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
                          {app.mentorProject}
                        </p>
                      ) : null}
                    </div>
                    {app.stream ? (
                      <span className="text-xs rounded-full px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
                        {app.stream}
                      </span>
                    ) : null}
                  </div>

                  <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
                    <dt className="text-zinc-500 dark:text-zinc-500">Stage</dt>
                    <dd>{app.stage ?? "Submitted"}</dd>
                    <dt className="text-zinc-500 dark:text-zinc-500">
                      Decision
                    </dt>
                    <dd>
                      {app.decision ?? (
                        <span className="text-zinc-500 dark:text-zinc-500">
                          Pending
                        </span>
                      )}
                    </dd>
                    {app.decisionSentAt ? (
                      <>
                        <dt className="text-zinc-500 dark:text-zinc-500">
                          Decision sent
                        </dt>
                        <dd>{app.decisionSentAt}</dd>
                      </>
                    ) : null}
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="mt-12 text-xs text-zinc-500 dark:text-zinc-500">
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
