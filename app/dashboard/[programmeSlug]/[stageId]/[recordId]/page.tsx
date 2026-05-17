import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getApplicationDetail } from "@/lib/airtable";

export const metadata = {
  title: "Application – CAISH Applications",
};

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{
    programmeSlug: string;
    stageId: string;
    recordId: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    notFound();
  }
  const { programmeSlug, stageId, recordId } = await params;
  const detail = await getApplicationDetail(
    session.user.email,
    programmeSlug,
    stageId,
    recordId,
  );
  // notFound() also for "exists but wrong email" — we deliberately don't
  // reveal whether a record exists at all if it belongs to someone else.
  if (!detail) notFound();

  return (
    <main className="flex-1 flex flex-col px-6 py-16">
      <div className="w-full max-w-2xl mx-auto">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Back to dashboard
        </Link>

        <header className="mt-6">
          <p className="text-xs uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-500">
            {detail.programmeDisplayName} · {detail.stageDisplayName}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {detail.project ?? "Application"}
          </h1>
          {detail.mentorName ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Mentor: {detail.mentorName}
            </p>
          ) : null}
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            {detail.stream ? (
              <div className="flex gap-2">
                <dt>Stream:</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">
                  {detail.stream}
                </dd>
              </div>
            ) : null}
            <div className="flex gap-2">
              <dt>Decision:</dt>
              <dd className="text-zinc-900 dark:text-zinc-100">
                {detail.decision ?? "Under review"}
              </dd>
            </div>
            {detail.submissionDate ? (
              <div className="flex gap-2">
                <dt>Submitted:</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">
                  {detail.submissionDate}
                </dd>
              </div>
            ) : null}
            {detail.decisionSentAt ? (
              <div className="flex gap-2">
                <dt>Decision sent:</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">
                  {detail.decisionSentAt}
                </dd>
              </div>
            ) : null}
          </dl>
        </header>

        <section className="mt-10">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            What you submitted
          </h2>
          <div className="mt-4 flex flex-col gap-6">
            {detail.content.map((c) => (
              <ContentBlock key={c.label} label={c.label} value={c.value} />
            ))}
          </div>
        </section>

        <footer className="mt-16 text-xs text-zinc-500 dark:text-zinc-500">
          To make changes to a submitted application, email{" "}
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

function ContentBlock({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  if (!value) {
    return (
      <div>
        <h3 className="text-xs uppercase tracking-wider font-medium text-zinc-500 dark:text-zinc-500">
          {label}
        </h3>
        <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-600 italic">
          Not provided
        </p>
      </div>
    );
  }
  // Render URLs as links
  if (/^https?:\/\//.test(value)) {
    return (
      <div>
        <h3 className="text-xs uppercase tracking-wider font-medium text-zinc-500 dark:text-zinc-500">
          {label}
        </h3>
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 text-sm text-zinc-900 dark:text-zinc-100 underline underline-offset-2 break-all"
        >
          {value}
        </a>
      </div>
    );
  }
  return (
    <div>
      <h3 className="text-xs uppercase tracking-wider font-medium text-zinc-500 dark:text-zinc-500">
        {label}
      </h3>
      <p className="mt-1 text-sm whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
    </div>
  );
}
