import { auth, signOut } from "@/lib/auth";

export const metadata = {
  title: "Dashboard – CAISH Applications",
};

export default async function DashboardPage() {
  const session = await auth();

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Signed in as{" "}
          <span className="font-medium">{session?.user?.email}</span>
        </p>
        <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-500">
          Application data will appear here once we wire up the Airtable
          fetch (Phase 1.3).
        </p>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
          className="mt-8"
        >
          <button
            type="submit"
            className="text-sm text-zinc-600 dark:text-zinc-400 underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
