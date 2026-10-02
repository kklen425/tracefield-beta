import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Check,
  Database,
  ExternalLink,
  FileText,
  Film,
  Fingerprint,
  Headphones,
  History,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  ScanSearch,
  Shield,
  Sparkles,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { MethodsSheet } from "@/components/trace/methods-sheet";
import { SpectrumView } from "@/components/trace/spectrum-view";
import { createVerifiedReport, getEntitlement, listScanHistory, saveScanToHistory, type Entitlement, type HistoryItem, type ScanSummaryInput } from "@/lib/account/entitlements";
import { createCheckoutSession, type PaidPlan } from "@/lib/billing/checkout";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { LABS, labName } from "@/lib/scan/labs";
import { scanArtifact } from "@/lib/scan/artifact";
import { makeDalleSample, makeGeminiSample } from "@/lib/sample/make-sample";
import type { Hit, ScanProgress, ScanReport } from "@/lib/scan/types";
import { cn } from "@/lib/utils";

type Stage = "idle" | "scanning" | "ready";

const FREE_ENTITLEMENT: Entitlement = {
  plan: "free",
  status: "inactive",
  active: false,
  currentPeriodEnd: null,
};

import { DocumentWorkspace } from './document-workspace';
import { CleanWorkspace } from './clean-workspace';
import { BatchWorkspace } from './batch-workspace';
import { getAnalysisUsage, consumeAnalysis } from '@/lib/account/entitlements';
import { createBillingPortal } from '@/lib/billing/checkout';
export function FieldApp() {
  const [mode,setMode] = useState<'IMAGE'|'TEXT'|'PDF'>('IMAGE');
  const [usage,setUsage] = useState<{used:number,limit:number}|null>(null);
  const scanSequence=useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState<ScanProgress>({ step: "", pct: 0 });
  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [methods, setMethods] = useState(false);
  const [drag, setDrag] = useState(false);
  const [entitlement, setEntitlement] = useState<Entitlement>(FREE_ENTITLEMENT);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [accountBusy, setAccountBusy] = useState(false);
  const [workspaceNote, setWorkspaceNote] = useState<string | null>(null);
  const [verifiedReportId, setVerifiedReportId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, isPending: userPending } = useCurrentUserState();

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    if (!user) {
      setEntitlement(FREE_ENTITLEMENT);
      setHistory([]);
      return;
    }
    let live = true;
    void getEntitlement()
      .then((next) => {
        if (!live) return;
        setEntitlement(next);
        void getAnalysisUsage().then(setUsage).catch(()=>undefined);
        if (next.active) {
          void listScanHistory().then((items) => live && setHistory(items)).catch(() => undefined);
        }
      })
      .catch(() => live && setEntitlement(FREE_ENTITLEMENT));
    return () => {
      live = false;
    };
  }, [user?.id]);

  const openFile = async (next: File) => {
    if(stage === 'scanning') return;
    const sequence=++scanSequence.current;
    setError(null);
    setReport(null);
    setWorkspaceNote(null);
    setVerifiedReportId(null);
    if (preview) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(next);
    setFile(next);
    setPreview(url);
    setStage("scanning");
    setProgress({ step: "Reading file", pct: 2 });
    try {
      if(!user) throw new Error('Sign in for your 5 monthly analyses. Your image preview stays local.');
      const current=await getAnalysisUsage(); setUsage(current);
      if(current.used>=current.limit) throw new Error('Monthly analysis limit reached.');
      const job=crypto.randomUUID();
      const nextReport = await scanArtifact(next, setProgress);
      if(sequence!==scanSequence.current) return;
      setUsage(await consumeAnalysis({data:job}));
      setReport(nextReport);
      setStage("ready");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Scan failed.");
      setStage("idle");
    }
  };

  const onFiles = (list: FileList | null) => {
    const next = list?.[0];
    if (!next) return;
    if (!isSupported(next)) {
      setError("Use JPEG, PNG or WebP in IMAGE mode.");
      return;
    }
    void openFile(next);
  };

  const namedLabs = useMemo(() => {
    if (!report) return [];
    return report.labs.filter((id) => !["unknown", "c2pa", "china-aigc"].includes(id));
  }, [report]);

  const beginCheckout = async (plan: PaidPlan) => {
    if (!user) return;
    setAccountBusy(true);
    setWorkspaceNote(null);
    try {
      const result = await createCheckoutSession({ data: plan });
      window.location.assign(result.url);
    } catch (cause) {
      setWorkspaceNote(cause instanceof Error ? cause.message : "Checkout could not start.");
    } finally {
      setAccountBusy(false);
    }
  };

  const saveHistory = async () => {
    if (!report) return;
    setAccountBusy(true);
    setWorkspaceNote(null);
    try {
      await saveScanToHistory({ data: toSummary(report) });
      setWorkspaceNote("Saved to your private scan history. The original file was not uploaded.");
      setHistory(await listScanHistory());
    } catch (cause) {
      setWorkspaceNote(friendlyProError(cause));
    } finally {
      setAccountBusy(false);
    }
  };

  const makeVerifiedReport = async () => {
    if (!report) return;
    setAccountBusy(true);
    setWorkspaceNote(null);
    try {
      const created = await createVerifiedReport({ data: toSummary(report) });
      setVerifiedReportId(created.id);
      setWorkspaceNote("Created a server-backed scan receipt from this locally generated summary and file hash.");
    } catch (cause) {
      setWorkspaceNote(friendlyProError(cause));
    } finally {
      setAccountBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-2xl tracking-tight">TRACEFIELD</span>
            <span className="hidden font-mono text-xs uppercase tracking-widest text-subtle md:inline">
              AI source attribution · local-first
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a href="#pricing" className={buttonVariants({ variant: "ghost", size: "sm" })}>Pricing</a>
            <Button variant="ghost" size="sm" onClick={() => setMethods(true)}>Methods</Button>
            {userPending ? (
              <span className="h-8 w-20 animate-pulse rounded-md bg-bg-subtle" />
            ) : user ? (
              <div className="flex max-w-48 flex-wrap items-center justify-end gap-2">
                <PlanBadge entitlement={entitlement} />{entitlement.active&&<Button size="sm" variant="ghost" onClick={()=>void createBillingPortal().then(r=>window.location.assign(r.url)).catch(e=>setWorkspaceNote(String(e)))}>Billing</Button>}
                <UserButton />
              </div>
            ) : (
              <Link to="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 pt-5 sm:px-6" role="tablist" aria-label="Analysis mode">
        {(['IMAGE','TEXT','PDF'] as const).map(value=><Button key={value} role="tab" aria-selected={mode===value} variant={mode===value?'outline':'ghost'} size="sm" disabled={stage==='scanning'} onClick={()=>setMode(value)}>{value}</Button>)}
        <span className="ml-auto font-mono text-xs text-subtle">{usage?usage.used+' / '+usage.limit+' · UTC month':'Free · 5 jobs / month'}</span>
      </div>
      {mode !== 'IMAGE' ? <DocumentWorkspace key={mode} mode={mode} onUsage={setUsage}/> : (

      <main id="lab" className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-10 lg:py-10">
        <section className="flex flex-col gap-4">
          <DropSurface
            drag={drag}
            file={file}
            preview={preview}
            stage={stage}
            progress={progress}
            onDrag={setDrag}
            onFiles={onFiles}
            inputRef={inputRef}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              <Upload /> Open image
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void makeGeminiSample().then(openFile)}>
              Gemini sample
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void makeDalleSample().then(openFile)}>
              DALL·E sample
            </Button>
          </div>
          {error ? <p className="text-sm text-hit">{error}</p> : null}
          <BatchWorkspace onUsage={setUsage}/>
          {file && report ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs text-muted sm:grid-cols-3">
              <Fact k="file" v={report.facts.name} />
              <Fact
                k="size"
                v={report.facts.width > 0 ? `${report.facts.width}×${report.facts.height} · ${fmtBytes(report.facts.size)}` : fmtBytes(report.facts.size)}
              />
              <Fact k="MIME" v={report.facts.mime} /><div className="col-span-full break-all"><Fact k="sha-256" v={report.facts.sha256} /></div>
            </dl>
          ) : null}
          <p className="flex items-center gap-2 text-xs leading-relaxed text-subtle">
            <Shield className="size-3.5 shrink-0" />
            The scanner reads the file locally. Only scan summaries you explicitly save are sent to your account workspace.
          </p>
        </section>

        <section className="flex min-w-0 flex-col gap-8">
          {!report && stage !== "scanning" ? (
            <IdleCopy />
          ) : (
            <>
              <IdentifyBlock report={report} namedLabs={namedLabs} scanning={stage === "scanning"} />
              {report?.spectrum ? (
                <div className="stagger-in">
                  <SectionLabel n="02" title="Frequency field" />
                  <SpectrumView spectrum={report.spectrum} />
                  <p className="mt-2 text-xs leading-relaxed text-subtle">
                    Frequency analysis is a forensic heuristic. It is deliberately not labelled as SynthID or a specific vendor watermark unless direct provider evidence exists elsewhere in the file.
                  </p>
                </div>
              ) : null}
              {file && report && <CleanWorkspace key={report.facts.sha256} file={file} report={report}/>}
              <ProWorkspace
                report={report}
                user={user}
                entitlement={entitlement}
                history={history}
                busy={accountBusy}
                note={workspaceNote}
                verifiedReportId={verifiedReportId}
                onSave={saveHistory}
                onVerifiedReport={makeVerifiedReport}
                onCheckout={beginCheckout}
              />
            </>
          )}
        </section>
      </main>)}
      <Pricing userSignedIn={Boolean(user)} entitlement={entitlement} busy={accountBusy} onCheckout={beginCheckout} />
      
      <footer className="mx-auto max-w-6xl border-t border-border px-4 py-8 text-xs leading-relaxed text-subtle sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-3xl">
            TRACEFIELD reports observable provenance signals and ranks source evidence. A missing signal does not prove human origin. Provider-specific watermark verification may require the provider's official verifier. Hidden provenance signals are inspected, not defeated.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono uppercase tracking-wider">
            <span>Commercial beta · 2026</span>
            <Link to="/privacy" className="hover:text-fg">Privacy</Link>
            <Link to="/terms" className="hover:text-fg">Terms</Link>
          </div>
        </div>
      </footer>
      <MethodsSheet open={methods} onClose={() => setMethods(false)} />
    </div>
  );
}

function Pricing({
  userSignedIn,
  entitlement,
  busy,
  onCheckout,
}: {
  userSignedIn: boolean;
  entitlement: Entitlement;
  busy: boolean;
  onCheckout: (plan: PaidPlan) => Promise<void>;
}) {
  const plans = [
    {name:'Free',price:'HK$0',note:'5 analyses / UTC calendar month',features:['Image provenance · paragraph text · PDF extraction','Basic Clean / Export'],plan:null,featured:false},
    {name:'Plus',price:'HK$10',note:'per month · test billing',features:['300 analyses / month','Private scan history · saved reports','Full evidence · Clean comparison'],plan:'plus' as const,featured:true}
  ];
  return (
    <section id="pricing" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">Plans</p>
          <h2 className="mt-2 font-display text-2xl text-fg">Free + Plus.</h2>
          <p className="mt-3 text-muted">Account allowance and paid workspace access are checked on the server. Original files stay on your device.</p>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {plans.map((plan) => {
            const isCurrent = plan.plan ? entitlement.active && entitlement.plan === plan.plan : !entitlement.active;
            return (
              <article key={plan.name} className={cn("rounded-xl p-5 shadow-[var(--shadow-border)]", plan.featured ? "bg-bg-subtle" : "bg-bg-elevated")}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-fg">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted">{plan.note}</p>
                  </div>
                  {isCurrent ? <Badge tone="ok">Current</Badge> : plan.featured ? <Badge tone="paper">Popular</Badge> : null}
                </div>
                <p className="mt-6 font-display text-2xl text-fg">{plan.price}</p>
                <ul className="mt-5 space-y-3 text-sm text-muted">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.plan ? (
                  userSignedIn ? (
                    <Button
                      variant={plan.featured ? "accent" : "outline"}
                      size="lg"
                      className="mt-6 w-full"
                      disabled={busy || isCurrent}
                      onClick={() => void onCheckout(plan.plan)}
                    >
                      {busy ? <LoaderCircle className="animate-spin" /> : <LockKeyhole />}
                      {isCurrent ? "Current plan" : `Choose ${plan.name}`}
                    </Button>
                  ) : (
                    <Link to="/login" className={cn(buttonVariants({ variant: plan.featured ? "accent" : "outline", size: "lg" }), "mt-6 w-full")}>
                      <LockKeyhole /> Sign in to upgrade
                    </Link>
                  )
                ) : (
                  <a href="#lab" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "mt-6 w-full")}>Use free scanner</a>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function IdleCopy() {
  return (
    <div className="stagger-in space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-subtle">Evidence stack</p>
        <h2 className="mt-2 max-w-lg font-display text-4xl leading-tight tracking-tight text-fg sm:text-5xl">Identify what made it. See the evidence. Clean what you share.</h2>
        <p className="mt-4 max-w-prose text-muted">
          TRACEFIELD checks signed/open provenance and generator metadata first, then ranks the provider evidence it actually found. Raster images also get a local frequency pass as supporting evidence.
        </p>
      </div>
      <ol className="grid gap-3 sm:grid-cols-3">
        {[
          { n: "01", t: "Identify", d: "Provenance and source evidence." },
          { n: "02", t: "Frequency field", d: "Heuristic pixel observations." },
          { n: "03", t: "Clean / Export", d: "Ordinary metadata privacy." },
        ].map((step) => (
          <li key={step.n} className="rounded-lg bg-bg-elevated p-4 shadow-[var(--shadow-border)]">
            <p className="font-mono text-xs text-subtle">{step.n}</p>
            <p className="mt-2 font-medium text-fg">{step.t}</p>
            <p className="mt-1 text-sm text-muted">{step.d}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function IdentifyBlock({
  report,
  namedLabs,
  scanning,
}: {
  report: ScanReport | null;
  namedLabs: ScanReport["labs"];
  scanning: boolean;
}) {
  const top = report?.attribution[0] ?? null;
  const provider = report?.attribution.find((candidate) => candidate.role === "model-provider") ?? null;
  const workflow = report?.attribution.find((candidate) => candidate.role === "workflow" || candidate.role === "platform") ?? null;
  return (
    <div>
      <SectionLabel n="01" title="Identify" />
      {scanning && !report ? <p className="text-sm text-muted">Reading container, credentials and local forensic signals.</p> : null}
      {report ? (
        <div className="stagger-in space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <VerdictPill verdict={report.verdict} />
            {report.c2pa?.present ? <Badge tone={report.c2pa.validationState === "invalid" ? "warn" : "ok"}>C2PA {report.c2pa.validationState}</Badge> : null}
            {namedLabs.slice(0, 4).map((id) => (
              <Badge key={id} tone={id === "google" || id === "openai" ? "hit" : "paper"}>{labName(id)}</Badge>
            ))}
          </div>

          {top ? (
            <div className="rounded-xl bg-bg-subtle p-5 shadow-[var(--shadow-border)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-subtle">Strongest source evidence</p>
                  <h3 className="mt-2 font-display text-3xl text-fg">{labName(top.lab)}</h3>
                  <p className="mt-2 text-sm text-muted">{LABS[top.lab].org}</p>
                  <Badge tone="paper" className="mt-3">{roleLabel(top.role)}</Badge>
                </div>
                <div className="rounded-lg border border-border bg-bg px-4 py-3 text-right">
                  <p className="font-display text-3xl text-fg">{top.evidenceScore}</p>
                  <p className="font-mono text-xs uppercase tracking-wider text-subtle">evidence score / 100</p>
                </div>
              </div>
              {(provider || workflow) ? (
                <div className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
                  <AttributionLane label="Model / provider" candidate={provider} />
                  <AttributionLane label="Workflow / platform" candidate={workflow} />
                </div>
              ) : null}
              <p className="mt-4 text-xs leading-relaxed text-subtle">This score ranks observed evidence. It is not a probability that the file was generated by this provider.</p>
            </div>
          ) : null}

          <p className="max-w-prose text-sm leading-relaxed text-muted">{report.summary}</p>
          <details className="break-all border border-border p-3 text-xs text-muted">
            <summary>Content Credentials · {report.c2pa?.validatorAvailable ? report.c2pa.validationState : 'validator unavailable'}</summary>
            <p className="mt-2">Embedded manifest: {report.c2pa?.present ? 'present' : report.c2pa?.validatorAvailable ? 'not found' : 'unknown'}. Container marker: {report.c2paPresent ? 'observed' : 'not observed'}. Markers alone are not signature validation.</p>
            <p>Claim generator: {report.c2pa?.claimGenerator ?? 'not supplied'} · Signer: {report.c2pa?.issuer ?? 'not supplied'}</p>
            <p>Valid means the SDK accepted the local signature and hashes; only Trusted indicates signer trust. Review validation errors below, including untrusted certificates. SDK validation is separate from editable metadata and heuristic source ranking. Remote manifest and OCSP fetching are disabled; remote-only credentials and revocation state are not verified.</p>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap">{report.c2pa?.rawText || 'No embedded assertions / ingredients available.'}</pre>
          </details>
          <ul className="divide-y divide-border rounded-lg bg-bg-elevated shadow-[var(--shadow-border)]">
            {report.hits.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted">No supported provenance or named generator evidence found.</li>
            ) : (
              report.hits.map((hit) => <HitRow key={hit.id} hit={hit} />)
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function AttributionLane({
  label,
  candidate,
}: {
  label: string;
  candidate: ScanReport["attribution"][number] | null;
}) {
  return (
    <div className="rounded-lg border border-border bg-bg p-3">
      <p className="font-mono text-[11px] uppercase tracking-wider text-subtle">{label}</p>
      {candidate ? (
        <>
          <p className="mt-1.5 text-sm font-medium text-fg">{labName(candidate.lab)}</p>
          <p className="mt-1 text-xs text-muted">{candidate.confidence} confidence · {candidate.evidenceCount} evidence item{candidate.evidenceCount === 1 ? "" : "s"}</p>
        </>
      ) : (
        <p className="mt-1.5 text-sm text-muted">Not identified</p>
      )}
    </div>
  );
}

function roleLabel(role: ScanReport["attribution"][number]["role"]): string {
  if (role === "workflow") return "workflow tool";
  if (role === "platform") return "platform / wrapper";
  return "model / provider";
}

function ProWorkspace({
  report,
  user,
  entitlement,
  history,
  busy,
  note,
  verifiedReportId,
  onSave,
  onVerifiedReport,
  onCheckout,
}: {
  report: ScanReport | null;
  user: ReturnType<typeof useCurrentUserState>["user"];
  entitlement: Entitlement;
  history: HistoryItem[];
  busy: boolean;
  note: string | null;
  verifiedReportId: string | null;
  onSave: () => Promise<void>;
  onVerifiedReport: () => Promise<void>;
  onCheckout: (plan: PaidPlan) => Promise<void>;
}) {
  return (
    <div>
      <SectionLabel n="03" title="Plus workspace" />
      {!report ? <p className="text-sm text-muted">Scan a file before saving a history record or report.</p> : !user ? (
        <div className="rounded-xl bg-bg-elevated p-5 shadow-[var(--shadow-border)]">
          <LockKeyhole className="size-5 text-accent" />
          <h3 className="mt-4 text-lg font-semibold text-fg">Sign in for server-backed features.</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">Your raw file still stays local. The account layer stores plan status and only summaries you choose to save.</p>
          <Link to="/login" className={cn(buttonVariants({ size: "sm" }), "mt-4")}>Sign in</Link>
        </div>
      ) : !entitlement.active ? (
        <div className="rounded-xl bg-bg-elevated p-5 shadow-[var(--shadow-border)]">
          <Database className="size-5 text-accent" />
          <h3 className="mt-4 text-lg font-semibold text-fg">Free scan complete. Server workspace is locked.</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">Upgrade to store scan history and create public scan receipts. These endpoints verify your subscription server-side.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="accent" disabled={busy} onClick={() => void onCheckout("plus")}>Plus · HK$10/mo</Button>
                      </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl bg-bg-elevated p-5 shadow-[var(--shadow-border)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2"><PlanBadge entitlement={entitlement} /><Badge tone="ok">server verified</Badge></div>
                <h3 className="mt-3 text-lg font-semibold text-fg">Save only the evidence you choose.</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">The backend receives the SHA-256 hash, result summary and evidence strings — not the original file.</p>
              </div>
              <Shield className="size-5 text-accent" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={busy} onClick={() => void onSave()}>
                {busy ? <LoaderCircle className="animate-spin" /> : <History />} Save to history
              </Button>
              <Button variant="default" size="sm" disabled={busy} onClick={() => void onVerifiedReport()}>
                {busy ? <LoaderCircle className="animate-spin" /> : <BadgeCheck />} Create scan receipt
              </Button>
            </div>
            {verifiedReportId ? (
              <Link to="/verify/$reportId" params={{ reportId: verifiedReportId }} className="mt-4 inline-flex items-center gap-2 text-sm text-accent hover:underline">
                Open scan receipt <ExternalLink className="size-3.5" />
              </Link>
            ) : null}
            {note ? <p className="mt-4 text-sm text-muted">{note}</p> : null}
          </div>
          {history.length ? (
            <div className="rounded-xl bg-bg-elevated p-5 shadow-[var(--shadow-border)]">
              <div className="flex items-center gap-2"><History className="size-4 text-accent" /><h3 className="font-medium text-fg">Recent history</h3></div>
              <ul className="mt-3 divide-y divide-border">
                {history.slice(0, 5).map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <div className="min-w-0"><p className="truncate text-fg">{item.fileName}</p><p className="font-mono text-xs text-subtle">{item.fileSha256.slice(0, 12)}…</p></div>
                    <span className="shrink-0 text-xs text-muted">{item.primarySource ?? item.verdict}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function HitRow({ hit }: { hit: Hit }) {
  return (
    <li className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-fg">{hit.title}</span>
          <Badge tone={hit.confidence === "high" ? "hit" : hit.confidence === "medium" ? "warn" : "default"}>{hit.confidence}</Badge>
          <Badge tone="default">{hit.layer}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted">{hit.detail}</p>
        <p className="mt-1 truncate font-mono text-xs text-subtle">{hit.evidence}</p>
      </div>
      <p className="shrink-0 font-mono text-xs uppercase tracking-wider text-subtle">{labName(hit.lab)}</p>
    </li>
  );
}

function DropSurface({
  drag,
  file,
  preview,
  stage,
  progress,
  onDrag,
  onFiles,
  inputRef,
}: {
  drag: boolean;
  file: File | null;
  preview: string | null;
  stage: Stage;
  progress: ScanProgress;
  onDrag: (value: boolean) => void;
  onFiles: (files: FileList | null) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  return (
    <div
      onDragOver={(event) => { event.preventDefault(); onDrag(true); }}
      onDragLeave={() => onDrag(false)}
      onDrop={(event) => { event.preventDefault(); onDrag(false); onFiles(event.dataTransfer.files); }}
      className={cn("relative min-h-72 overflow-hidden rounded-xl bg-bg-elevated shadow-[var(--shadow-border)] transition-shadow duration-200", drag && "shadow-[var(--shadow-border-hover)]")}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        suppressHydrationWarning
        onChange={(event) => onFiles(event.target.files)}
      />
      {file && preview ? (
        <ArtifactPreview file={file} url={preview} />
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-72 w-full flex-col items-center justify-center gap-3 px-6 text-center">
          <ScanSearch className="size-7 text-muted" />
          <span className="font-display text-2xl text-fg">Drop a still</span>
          <span className="max-w-sm text-sm leading-relaxed text-muted">JPEG, PNG, WebP. The file is parsed here — nothing is uploaded.</span>
        </button>
      )}
      {stage === "scanning" ? (
        <div className="absolute inset-0 bg-bg/55 backdrop-blur-[1px]">
          <div className="absolute inset-x-0 top-0 h-px origin-top bg-accent opacity-80 scan-line" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg to-transparent p-4">
            <p className="font-mono text-xs uppercase tracking-wider text-fg">{progress.step}</p>
            <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-border"><div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${progress.pct}%` }} /></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ArtifactPreview({ file, url }: { file: File; url: string }) {
  if (file.type.startsWith("image/") && file.type !== "image/svg+xml" && !/tiff|heic|heif/i.test(file.type)) {
    return <img src={url} alt="Selected file" className="photo block max-h-96 w-full object-contain" />;
  }
  if (file.type.startsWith("video/")) {
    return <video src={url} controls className="block max-h-96 w-full bg-bg object-contain" />;
  }
  if (file.type.startsWith("audio/")) {
    return <div className="flex min-h-72 flex-col items-center justify-center gap-4 p-6"><Headphones className="size-10 text-accent" /><p className="text-sm text-fg">{file.name}</p><audio src={url} controls className="w-full max-w-md" /></div>;
  }
  const Icon = file.type === "application/pdf" ? FileText : Film;
  return <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-6 text-center"><Icon className="size-10 text-accent" /><p className="font-display text-2xl text-fg">{file.name}</p><p className="text-sm text-muted">Container provenance scan</p></div>;
}

function PlanBadge({ entitlement }: { entitlement: Entitlement }) {
  if (!entitlement.active) return <Badge tone="default">Free</Badge>;
  return <Badge tone="paper">Plus</Badge>;
}

function SectionLabel({ n, title }: { n: string; title: string }) {
  return <div className="mb-3 flex items-baseline gap-3"><span className="font-mono text-xs text-subtle">{n}</span><h2 className="font-display text-2xl text-fg">{title}</h2></div>;
}

function VerdictPill({ verdict }: { verdict: ScanReport["verdict"] }) {
  const map = {
    clean: { tone: "ok" as const, label: "No direct signal" },
    metadata: { tone: "warn" as const, label: "Provenance found" },
    pixel: { tone: "hit" as const, label: "Pixel anomaly" },
    mixed: { tone: "hit" as const, label: "Mixed evidence" },
  };
  const value = map[verdict];
  return <Badge tone={value.tone}>{value.label}</Badge>;
}

function Fact({ k, v }: { k: string; v: string }) {
  return <div className="min-w-0"><dt className="text-subtle">{k}</dt><dd className="break-all text-fg">{v}</dd></div>;
}

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isSupported(file:File):boolean {return ['image/jpeg','image/png','image/webp'].includes(file.type);}

function toSummary(report: ScanReport): ScanSummaryInput {
  return {
    fileName: report.facts.name,
    fileSha256: report.facts.sha256,
    mime: report.facts.mime,
    verdict: report.verdict,
    primarySource: report.attribution[0] ? labName(report.attribution[0].lab) : null,
    evidence: report.hits.slice(0, 30).map((hit) => ({
      source: labName(hit.lab),
      family: hit.family,
      confidence: hit.confidence,
      evidence: hit.evidence,
    })),
  };
}

function friendlyProError(cause: unknown): string {
  const message = cause instanceof Error ? cause.message : String(cause ?? "");
  if (message.includes("PRO_REQUIRED")) return "This server feature requires an active Plus subscription.";
  if (message.includes("Unauthorized")) return "Sign in again to use your workspace.";
  return message || "The workspace request could not be completed.";
}
