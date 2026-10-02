import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, FileCheck2, Shield } from "lucide-react";
import { getVerifiedReport, type VerifiedReport } from "@/lib/account/entitlements";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/verify/$reportId")({ component: VerifyReportPage });

function VerifyReportPage() {
  const { reportId } = Route.useParams();
  const [report, setReport] = useState<VerifiedReport | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    void getVerifiedReport({ data: reportId })
      .then((value) => live && setReport(value))
      .catch(() => live && setReport(null));
    return () => {
      live = false;
    };
  }, [reportId]);

  return (
    <main className="min-h-dvh bg-bg px-4 py-10 text-fg sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="font-display text-2xl tracking-tight">TRACEFIELD</Link>
          <Badge tone="paper">Scan receipt</Badge>
        </div>

        {report === undefined ? (
          <div className="mt-16 rounded-xl bg-bg-elevated p-8 shadow-[var(--shadow-border)]">
            <p className="text-sm text-muted">Loading scan receipt…</p>
          </div>
        ) : report === null ? (
          <div className="mt-16 rounded-xl bg-bg-elevated p-8 shadow-[var(--shadow-border)]">
            <h1 className="font-display text-4xl">Receipt not found.</h1>
            <p className="mt-3 text-sm text-muted">The ID is invalid, unavailable, or the record has been removed.</p>
            <Link to="/" className={buttonVariants({ variant: "outline", size: "sm", className: "mt-6" })}>Open TRACEFIELD</Link>
          </div>
        ) : (
          <article className="mt-10 space-y-6">
            <section className="rounded-xl bg-bg-subtle p-6 shadow-[var(--shadow-border)] sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <BadgeCheck className="size-5 text-accent" />
                <Badge tone="ok">Server-backed receipt</Badge>
              </div>
              <h1 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">{report.fileName}</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                This page confirms that TRACEFIELD stored a client-generated local scan summary tied to the file hash below. The receipt is tamper-evident after storage, but it is not an independent server forensic examination and does not prove the file is authentic, unedited, or legally owned.
              </p>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <Fact label="Verdict" value={report.verdict} />
              <Fact label="Primary source" value={report.primarySource ?? "Unattributed"} />
              <Fact label="MIME" value={report.mime} />
              <Fact label="Created" value={new Date(report.createdAt).toLocaleString()} />
            </section>

            <section className="rounded-xl bg-bg-elevated p-5 shadow-[var(--shadow-border)]">
              <div className="flex items-center gap-2"><FileCheck2 className="size-4 text-accent" /><h2 className="font-medium">File SHA-256</h2></div>
              <code className="mt-3 block break-all font-mono text-xs leading-relaxed text-muted">{report.fileSha256}</code>
            </section>

            <section className="rounded-xl bg-bg-elevated p-5 shadow-[var(--shadow-border)]">
              <div className="flex items-center gap-2"><Shield className="size-4 text-accent" /><h2 className="font-medium">Receipt integrity SHA-256</h2></div>
              <code className="mt-3 block break-all font-mono text-xs leading-relaxed text-muted">{report.integritySha256}</code>
            </section>

            <section>
              <h2 className="font-display text-2xl">Recorded evidence</h2>
              <ul className="mt-3 divide-y divide-border rounded-xl bg-bg-elevated shadow-[var(--shadow-border)]">
                {report.evidence.length ? report.evidence.map((item, index) => (
                  <li key={`${item.source}-${item.family}-${index}`} className="p-4">
                    <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium">{item.source}</span><Badge tone={item.confidence === "high" ? "hit" : item.confidence === "medium" ? "warn" : "default"}>{item.confidence}</Badge><Badge tone="default">{item.family}</Badge></div>
                    <p className="mt-2 break-words font-mono text-xs leading-relaxed text-subtle">{item.evidence}</p>
                  </li>
                )) : <li className="p-4 text-sm text-muted">No evidence strings were recorded.</li>}
              </ul>
            </section>
          </article>
        )}
      </div>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-bg-elevated p-4 shadow-[var(--shadow-border)]"><p className="font-mono text-xs uppercase tracking-wider text-subtle">{label}</p><p className="mt-2 text-sm text-fg">{value}</p></div>;
}
