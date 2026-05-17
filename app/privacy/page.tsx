export const metadata = {
  title: "Privacy – CAISH Applications",
};

export default function PrivacyPage() {
  return (
    <main className="wrap">
      <h1>Privacy notice</h1>
      <p>Last updated 17 May 2026.</p>

      <h2>Who we are</h2>
      <p>
        Cambridge AI Safety Hub (CAISH) is a Cambridge-based non-profit running
        programmes (MARS, HVP, internships) for early-career AI safety
        researchers. We run this applications portal at{" "}
        <code>application.caish.org</code>.
      </p>

      <h2>What we store</h2>
      <p>When you apply to a CAISH programme, we store:</p>
      <ul>
        <li>
          Your application content (essays, CV, LinkedIn, contact details) in
          Airtable. This is the source of truth.
        </li>
        <li>
          Authentication state (session tokens, magic-link tokens) in a
          Postgres database hosted on Neon (London, UK).
        </li>
        <li>
          A log of decision emails we have sent you, also in Postgres, so we do
          not send duplicates.
        </li>
        <li>
          Operational error reports (sent to Sentry, EU region). Browser
          replays mask all text and inputs, so application content never reaches
          Sentry.
        </li>
        <li>
          Outbound email metadata (from / to / subject / delivery status) in
          Resend, our transactional email provider (EU region).
        </li>
      </ul>

      <h2>What we don&apos;t store</h2>
      <ul>
        <li>Passwords. The portal uses email-only magic-link sign-in.</li>
        <li>
          Payment information. We do not charge applicants for anything.
        </li>
        <li>
          Browsing or tracking data beyond what is necessary to run the portal.
        </li>
      </ul>

      <h2>Retention</h2>
      <p>
        We keep application data for up to 12 months after the cycle closes, so
        we can refer back during follow-ups (e.g. waitlist movement, future
        programmes you might be a fit for). After 12 months, we delete the
        records or ask you whether you would like to be kept on file for future
        cycles.
      </p>

      <h2>Your rights</h2>
      <p>
        If you are in the UK or EU, you have the right to access, correct, or
        delete your data. To exercise any of these, email{" "}
        <a href="mailto:privacy@cambridgeaisafety.org">
          privacy@cambridgeaisafety.org
        </a>
        . We will respond within 30 days.
      </p>

      <h2>Contact</h2>
      <p>
        For anything else, email{" "}
        <a href="mailto:hello@cambridgeaisafety.org">
          hello@cambridgeaisafety.org
        </a>
        .
      </p>

      <footer className="page">
        <a href="/">Home</a>
      </footer>
    </main>
  );
}
