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
    <main className="wrap">
      <p>
        <Link href="/dashboard">&larr; Back to dashboard</Link>
      </p>

      <p>
        {detail.programmeDisplayName} &middot; {detail.stageDisplayName}
      </p>
      <h1>{detail.project ?? "Application"}</h1>
      {detail.mentorName ? <p>Mentor: {detail.mentorName}</p> : null}

      <dl className="inline">
        {detail.stream ? (
          <div>
            <strong>Stream:</strong> {detail.stream}
          </div>
        ) : null}
        <div>
          <strong>Decision:</strong> {detail.decision ?? "Under review"}
        </div>
        {detail.submissionDate ? (
          <div>
            <strong>Submitted:</strong> {detail.submissionDate}
          </div>
        ) : null}
        {detail.decisionSentAt ? (
          <div>
            <strong>Decision sent:</strong> {detail.decisionSentAt}
          </div>
        ) : null}
      </dl>

      <hr />

      <h2>What you submitted</h2>
      {detail.content.map((c) => (
        <ContentBlock key={c.label} label={c.label} value={c.value} />
      ))}
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
      <>
        <h3>{label}</h3>
        <p>Not provided.</p>
      </>
    );
  }
  if (/^https?:\/\//.test(value)) {
    return (
      <>
        <h3>{label}</h3>
        <p>
          <a href={value} target="_blank" rel="noopener noreferrer">
            {value}
          </a>
        </p>
      </>
    );
  }
  return (
    <>
      <h3>{label}</h3>
      <p style={{ whiteSpace: "pre-wrap" }}>{value}</p>
    </>
  );
}
