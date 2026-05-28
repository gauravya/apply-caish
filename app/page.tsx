import Link from "next/link";

export default function Home() {
  return (
    <main className="retro">
      <div className="box">
        <h1>
          <span className="big">CAISH</span>
          <span className="small cursor">APPLICATION PORTAL</span>
        </h1>
        <p>
          <Link href="/login" className="key">
            Sign in
          </Link>
        </p>
        <footer className="retro-foot">
          Need help? Email{" "}
          <a href="mailto:hello@cambridgeaisafety.org">
            hello@cambridgeaisafety.org
          </a>
          <br />
          <Link href="/privacy">Privacy</Link>
        </footer>
      </div>
    </main>
  );
}
