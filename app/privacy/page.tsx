export const metadata = {
  title: "Privacy – CAISH Applications",
};

export default function PrivacyPage() {
  return (
    <main className="flex-1 flex flex-col px-6 py-16">
      <div className="w-full max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight">Privacy notice</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
          Last updated 17 May 2026.
        </p>

        <Section title="Who we are">
          Cambridge AI Safety Hub (CAISH) is a Cambridge-based non-profit running
          programmes (MARS, HVP, internships) for early-career AI safety researchers.
          We run this applications portal at <code>application.caish.org</code>.
        </Section>

        <Section title="What we store">
          When you apply to a CAISH programme, we store:
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              Your application content (essays, CV, LinkedIn, contact details)
              in Airtable. This is the source of truth.
            </li>
            <li>
              Authentication state (session tokens, magic-link tokens) in a
              Postgres database hosted on Neon (London, UK).
            </li>
            <li>
              A log of decision emails we&apos;ve sent you, also in Postgres,
              so we don&apos;t send duplicates.
            </li>
            <li>
              Operational error reports (sent to Sentry, EU region). Browser
              replays mask all text and inputs, so application content never
              reaches Sentry.
            </li>
            <li>
              Outbound email metadata (from / to / subject / delivery status)
              in Resend, our transactional email provider (EU region).
            </li>
          </ul>
        </Section>

        <Section title="What we don't store">
          <ul className="list-disc pl-5 space-y-1">
            <li>Passwords. The portal uses email-only magic-link sign-in.</li>
            <li>Payment information. We don&apos;t charge applicants for anything.</li>
            <li>
              Browsing or tracking data beyond what&apos;s necessary to run the
              portal.
            </li>
          </ul>
        </Section>

        <Section title="Retention">
          We keep application data for up to 12 months after the cycle closes,
          so we can refer back during follow-ups (e.g. waitlist movement, future
          programmes you might be a fit for). After 12 months, we delete the
          records or ask you whether you&apos;d like to be kept on file for future
          cycles.
        </Section>

        <Section title="Your rights">
          If you&apos;re in the UK or EU, you have the right to access, correct,
          or delete your data. To exercise any of these, email{" "}
          <a
            href="mailto:privacy@cambridgeaisafety.org"
            className="underline underline-offset-2"
          >
            privacy@cambridgeaisafety.org
          </a>
          . We&apos;ll respond within 30 days.
        </Section>

        <Section title="Contact">
          For anything else, email{" "}
          <a
            href="mailto:hello@cambridgeaisafety.org"
            className="underline underline-offset-2"
          >
            hello@cambridgeaisafety.org
          </a>
          .
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
