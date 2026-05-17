import { signIn } from "@/lib/auth";
import { SubmitButton } from "./_submit-button";

export const metadata = {
  title: "Sign in – CAISH Applications",
};

async function loginAction(formData: FormData) {
  "use server";
  await signIn("resend", {
    email: formData.get("email"),
    redirectTo: "/dashboard",
  });
}

export default function LoginPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Enter the email you applied with. We&apos;ll send you a link to sign in.
        </p>
        <form action={loginAction} className="mt-8 flex flex-col gap-3">
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
          />
          <SubmitButton label="Send sign-in link" />
        </form>
        <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-500">
          The link will arrive in your inbox and is valid for 15 minutes. Check
          your spam folder if you don&apos;t see it.
        </p>
      </div>
    </main>
  );
}
