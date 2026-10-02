import { Link, createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/privacy")({ component: PrivacyPage });

function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-bg px-4 py-10 text-fg sm:px-6">
      <article className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="font-display text-2xl tracking-tight">TRACEFIELD</Link>
          <Shield className="size-5 text-accent" />
        </div>
        <h1 className="mt-12 font-display text-5xl">Privacy</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">Last updated October 2, 2026.</p>
        <div className="mt-8 space-y-7 text-sm leading-7 text-muted">
          <section><h2 className="text-lg font-semibold text-fg">Local-first scanning</h2><p className="mt-2">The default TRACEFIELD scanner processes the file in your browser. The raw file is not sent to TRACEFIELD's application server for the standard local scan.</p></section>
          <section><h2 className="text-lg font-semibold text-fg">Account data</h2><p className="mt-2">If you create an account, TRACEFIELD stores information needed to operate the account, including your sign-in identity, plan status and subscription entitlement.</p></section>
          <section><h2 className="text-lg font-semibold text-fg">Monthly allowance and third parties</h2><p className="mt-2">Completed scans send a random job identifier to record your account's UTC monthly usage. Original image, text and PDF bytes stay local. Content Credentials remote-manifest and revocation fetches are disabled. Google Fonts receives ordinary font requests; Render hosts the application and Neon stores account records. Billing is currently Stripe test mode.</p></section>
          <section><h2 className="text-lg font-semibold text-fg">Saved scan data</h2><p className="mt-2">Paid users can choose to save a scan summary or create a scan receipt. Those actions send the file name, SHA-256 hash, MIME type, verdict, source attribution and evidence strings to the server. They do not send the original file.</p></section>
          <section><h2 className="text-lg font-semibold text-fg">Optional cloud verification</h2><p className="mt-2">Future provider-verification or cloud-forensics features may require uploading an asset to TRACEFIELD or a named verification provider. Those features must disclose that transfer and ask for explicit consent before upload. They are separate from the default local scan.</p></section>
          <section><h2 className="text-lg font-semibold text-fg">Payments</h2><p className="mt-2">Payments and subscription billing are handled by Stripe. TRACEFIELD stores Stripe identifiers and subscription status needed to enforce paid access, but does not store full card numbers.</p></section>
          <section><h2 className="text-lg font-semibold text-fg">Limitations</h2><p className="mt-2">A missing provenance signal does not establish that content is human-made. Metadata and credentials can be absent after ordinary editing, screenshots, transcoding or platform processing.</p></section>
        </div>
        <Link to="/" className={buttonVariants({ variant: "outline", size: "sm", className: "mt-10" })}>Back to TRACEFIELD</Link>
      </article>
    </main>
  );
}
