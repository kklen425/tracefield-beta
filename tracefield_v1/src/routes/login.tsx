import { useState, type FormEvent } from "react";
import { ArrowLeft, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { authClient } from "@/lib/auth/client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({ component: Login });

type Mode = "signin" | "signup";

function Login() {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        const result = await authClient.signUp.email({
          name: name.trim() || email.split("@")[0] || "TRACEFIELD user",
          email: email.trim(),
          password,
          callbackURL: "/",
        });
        if (result.error) throw new Error(result.error.message ?? "Could not create account");
      } else {
        const result = await authClient.signIn.email({
          email: email.trim(),
          password,
          callbackURL: "/",
        });
        if (result.error) throw new Error(result.error.message ?? "Could not sign in");
      }
      window.location.href = "/";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-4 py-10 text-fg">
      <section className="w-full max-w-md rounded-xl bg-bg-elevated p-6 shadow-[var(--shadow-border)] sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <span className="font-display text-2xl tracking-tight">TRACEFIELD</span>
          <LockKeyhole className="size-5 text-accent" />
        </div>

        <h1 className="mt-8 font-display text-4xl leading-none">
          {mode === "signin" ? "Sign in to your workspace." : "Create your workspace."}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Your raw files stay in your browser for the default scan. Your account stores billing status and only the scan summaries you choose to save.
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-lg bg-bg-subtle p-1">
          {(["signin", "signup"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => { setMode(value); setError(null); }}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                mode === value ? "bg-bg-elevated text-fg shadow-[var(--shadow-border)]" : "text-muted hover:text-fg",
              )}
            >
              {value === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <form className="mt-5 space-y-4" onSubmit={submit}>
          {mode === "signup" ? (
            <label className="block text-sm">
              <span className="text-muted">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                maxLength={100}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-bg px-3 text-fg outline-none transition focus:border-accent"
              />
            </label>
          ) : null}
          <label className="block text-sm">
            <span className="text-muted">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-bg px-3 text-fg outline-none transition focus:border-accent"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={8}
              required
              className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-bg px-3 text-fg outline-none transition focus:border-accent"
            />
          </label>

          {error ? <p className="rounded-lg border border-hit/30 bg-hit/5 p-3 text-sm text-hit">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
          >
            {busy ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-xs leading-relaxed text-subtle">
          Paid access is checked again on the server for every protected workspace action. Changing browser JavaScript does not grant subscription entitlements.
        </p>

        <Link to="/" className={buttonVariants({ variant: "ghost", size: "sm", className: "mt-6" })}>
          <ArrowLeft />
          Back to scanner
        </Link>
      </section>
    </main>
  );
}
