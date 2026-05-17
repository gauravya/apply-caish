export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-24">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Cambridge AI Safety Hub
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Applications portal
        </p>
        <p className="mt-12 text-sm text-zinc-500 dark:text-zinc-500">
          Sign-in coming soon. Reach out at{" "}
          <a
            className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100"
            href="mailto:hello@cambridgeaisafety.org"
          >
            hello@cambridgeaisafety.org
          </a>{" "}
          if you need help in the meantime.
        </p>
      </div>
    </main>
  );
}
