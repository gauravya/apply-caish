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
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {message.title}
        </h1>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          {message.body}
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-md bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          Request a new sign-in link
        </Link>
        <p className="mt-8 text-xs text-zinc-500 dark:text-zinc-500">
          Still stuck? Email{" "}
          <a
            className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100"
            href="mailto:hello@cambridgeaisafety.org"
          >
            hello@cambridgeaisafety.org
          </a>
          .
        </p>
      </div>
    </main>
  );
}
