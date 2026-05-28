import Link from "next/link";

export const metadata = {
  title: "Sign-in error – CAISH Applications",
};

const ERROR_MESSAGES: Record<string, { title: string; body: string }> = {
  Verification: {
    title: "Sign-in link is no longer valid",
    body: "Magic links can only be used once and expire after 15 minutes. Request a fresh one below.",
  },
  AccessDenied: {
    title: "Access denied",
    body: "Your account isn't permitted to sign in. If this is a mistake, contact us.",
  },
  Configuration: {
    title: "Sign-in is temporarily unavailable",
    body: "Our team has been notified. Please try again in a few minutes.",
  },
};

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const known = error ? ERROR_MESSAGES[error] : undefined;
  const message = known ?? {
    title: "Something went wrong",
    body: "An unexpected error occurred during sign-in. Try requesting a new link.",
  };

  return (
    <main className="wrap">
      <h1>{message.title}</h1>
      <p>{message.body}</p>

      <p>
        <Link href="/login">Request a new sign-in link</Link>
      </p>

      <hr />

      <p>
        Still stuck? Email{" "}
        <a href="mailto:hello@cambridgeaisafety.org">
          hello@cambridgeaisafety.org
        </a>
        .
      </p>

      <footer className="page">
        <Link href="/">Home</Link> &middot; <Link href="/privacy">Privacy</Link>
      </footer>
    </main>
  );
}
