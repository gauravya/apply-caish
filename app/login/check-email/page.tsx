import Link from "next/link";

export const metadata = {
  title: "Check your email – CAISH Applications",
};

export default function CheckEmailPage() {
  return (
    <main className="wrap">
      <h1>Check your email</h1>
      <p>
        If your email is associated with an application, you will get a sign-in
        link from <code>hello@cambridgeaisafety.org</code> shortly.
      </p>
      <p>
        The link expires in 15 minutes. Check spam if you do not see it.
      </p>

      <footer className="page">
        <Link href="/">Home</Link> &middot;{" "}
        <Link href="/login">Back to sign in</Link>
      </footer>
    </main>
  );
}
