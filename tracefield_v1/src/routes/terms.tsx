import { Link, createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/terms")({ component: TermsPage });

function TermsPage() {
  return (
    <main className="min-h-dvh bg-bg px-4 py-10 text-fg sm:px-6">
      <article className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="font-display text-2xl tracking-tight">TRACEFIELD</Link>
          <FileText className="size-5 text-accent" />
        </div>
        <h1 className="mt-12 font-display text-5xl">Terms</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">Commercial beta · Last updated October 1, 2026.</p>
        <div className="mt-8 space-y-7 text-sm leading-7 text-muted">
          <section><h2 className="text-lg font-semibold text-fg">What TRACEFIELD provides</h2><p className="mt-2">TRACEFIELD inspects observable provenance, Content Credentials, metadata and forensic signals and ranks evidence that may identify a generating provider, model family, workflow or platform.</p></section>
          <section><h2 className="text-lg font-semibold text-fg">Not a certainty engine</h2><p className="mt-2">Results are evidence-based indicators, not a guarantee of authorship, authenticity, ownership or legal status. Evidence scores rank observed signals and are not probabilities.</p></section>
          <section><h2 className="text-lg font-semibold text-fg">Text and Clean limitations</h2><p className="mt-2">Text results use experimental English style heuristics without a validated classifier. Do not use them for disciplinary decisions. Clean re-encodes ordinary metadata and may alter colour, transparency or animation; it does not promise removal of hidden watermarks. Free allows five completed analyses per account per UTC calendar month. Plus targets 300 analyses at HK$10/month; billing remains test-only during this beta.</p></section>
          <section><h2 className="text-lg font-semibold text-fg">Acceptable use</h2><p className="mt-2">You must have the right to analyze content you submit or process. TRACEFIELD must not be used to misrepresent provenance, fabricate evidence, impersonate an issuer, or claim that a scan receipt is an independent forensic certification.</p></section>
          <section><h2 className="text-lg font-semibold text-fg">Subscriptions</h2><p className="mt-2">Paid plans provide server-backed workspace features subject to the limits shown at purchase. Billing recurs until cancelled through the available subscription-management flow. Beta features and limits may change prospectively as the product develops.</p></section>
          <section><h2 className="text-lg font-semibold text-fg">Scan receipts</h2><p className="mt-2">A scan receipt records a locally generated summary and file hash at a point in time. It is tamper-evident after storage but is not an independent server-side examination of the original file.</p></section>
          <section><h2 className="text-lg font-semibold text-fg">Service availability</h2><p className="mt-2">The commercial beta is provided on a best-effort basis. External standards libraries, identity providers, payment services and provenance systems can change or become unavailable.</p></section>
        </div>
        <Link to="/" className={buttonVariants({ variant: "outline", size: "sm", className: "mt-10" })}>Back to TRACEFIELD</Link>
      </article>
    </main>
  );
}
