import Link from "next/link";

export const metadata = {
  title: "Check your email – CAISH Applications",
};

export default function CheckEmailPage() {
  return (
    <main className="retro">
      <div className="box">
        <h1>
          <span className="big">CHECK</span>
          <span className="small cursor">YOUR EMAIL</span>
        </h1>
        <p>
          If your email is associated with an application, a sign-in link from
          hello@cambridgeaisafety.org is on its way.
        </p>
        <p>The link expires in 15 minutes. Check spam if you do not see it.</p>
        <footer className="retro-foot">
          <Link href="/">Home</Link> &middot;{" "}
          <Link href="/login">Back to sign in</Link>
        </footer>
      </div>
    </main>
  );
}
