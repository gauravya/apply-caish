export const metadata = {
  title: "Check your email – CAISH Applications",
};

export default function CheckEmailPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          If your email is associated with an application, you&apos;ll get a
          sign-in link from{" "}
          <span className="font-medium">hello@cambridgeaisafety.org</span>{" "}
          shortly.
        </p>
        <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-500">
          The link expires in 15 minutes. Check spam if you don&apos;t see it.
        </p>
      </div>
    </main>
  );
}
