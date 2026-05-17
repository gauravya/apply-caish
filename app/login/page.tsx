import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { checkSignInRateLimit } from "@/lib/rate-limit";
import { SubmitButton } from "./_submit-button";

export const metadata = {
  title: "Sign in – CAISH Applications",
};

async function loginAction(formData: FormData) {
  "use server";
  const raw = formData.get("email");
  const email = typeof raw === "string" ? raw.trim() : "";
  if (!email || !email.includes("@")) {
    redirect("/login?error=invalid");
  }

  // Rate-limit by email and by IP. The email enumeration defence is
  // "always pretend to send", so we redirect to check-email on rate-limit
  // too — never reveal whether the email is registered or hit-limited.
  const ip = await resolveClientIp();
  const rl = await checkSignInRateLimit(email, ip);
  if (!rl.allowed) {
    redirect("/login/check-email");
  }

  await signIn("resend", { email, redirectTo: "/dashboard" });
}

async function resolveClientIp(): Promise<string | null> {
  const h = await headers();
  // Vercel populates these; the first XFF entry is the client.
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="wrap">
      <h1>Sign in</h1>
      <p>
        Enter the email you applied with. We will send you a link to sign in.
      </p>

      {error === "invalid" ? (
        <p>Error: please enter a valid email address.</p>
      ) : null}

      <form action={loginAction}>
        <p>
          <label htmlFor="email">Email: </label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            size={32}
          />
        </p>
        <p>
          <SubmitButton label="Send sign-in link" />
        </p>
      </form>

      <p>
        The link will arrive in your inbox and is valid for 15 minutes. Check
        your spam folder if you do not see it.
      </p>

      <footer className="page">
        <a href="/">Home</a> &middot; <a href="/privacy">Privacy</a>
      </footer>
    </main>
  );
}
