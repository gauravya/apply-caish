import Link from "next/link";

export default function Home() {
  return (
    <main className="wrap">
      <h1>Cambridge AI Safety Hub</h1>
      <p>Applications portal.</p>

      <p>
        Track the status of any application you have submitted to a CAISH
        programme: MARS, HVP, internships, and more.
      </p>

      <p>
        <Link href="/login">Sign in</Link>
      </p>

      <hr />

      <p>
        Need help? Email{" "}
        <a href="mailto:hello@cambridgeaisafety.org">
          hello@cambridgeaisafety.org
        </a>
        .
      </p>

      <footer className="page">
        Cambridge AI Safety Hub. <Link href="/privacy">Privacy</Link>.
      </footer>
    </main>
  );
}
