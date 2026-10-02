import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export type Plan = "free" | "plus";

export type Entitlement = {
  plan: Plan;
  status: string;
  active: boolean;
  currentPeriodEnd: string | null;
};

export type ScanSummaryInput = {
  fileName: string;
  fileSha256: string;
  mime: string;
  verdict: string;
  primarySource: string | null;
  evidence: Array<{
    source: string;
    family: string;
    confidence: "high" | "medium" | "low";
    evidence: string;
  }>;
};

export type HistoryItem = {
  id: string;
  fileName: string;
  fileSha256: string;
  mime: string;
  verdict: string;
  primarySource: string | null;
  createdAt: string;
};

export type VerifiedReport = {
  id: string;
  fileName: string;
  fileSha256: string;
  mime: string;
  verdict: string;
  primarySource: string | null;
  evidence: ScanSummaryInput["evidence"];
  integritySha256: string;
  createdAt: string;
};

const PAID_STATUSES = new Set(["active", "trialing"]);
export const ANALYSIS_LIMITS = { free: 5, plus: 300 } as const;
export const getAnalysisUsage = createServerFn({method:'GET'}).middleware([authMiddleware]).handler(async ({context}) => {
 const entitlement = await entitlementForUser(context.userId);
 const sql = await getSql();
 const rows = await sql<{analysis_count:number}>`select analysis_count from tracefield_monthly_usage where user_id=${context.userId} and period_start=date_trunc('month',now() at time zone 'UTC')::date`;
 return {used: rows[0]?.analysis_count ?? 0, limit: ANALYSIS_LIMITS[entitlement.plan], period:'UTC calendar month'};
});
export const consumeAnalysis = createServerFn({method:'POST'}).validator((id:string) => {
 if(!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid job identifier'); return id;
}).middleware([authMiddleware]).handler(async ({context,data}) => {
 const entitlement = await entitlementForUser(context.userId);
 const sql = await getSql(); const limit = ANALYSIS_LIMITS[entitlement.plan];
 const rows = await sql<{used:number}>`select tracefield_consume_analysis(${context.userId},${data}::uuid,${limit}) as used`;
 return {used:rows[0].used,limit,period:'UTC calendar month'};
});

const MONTHLY_LIMITS = {
  plus: { history: 300, receipts: 300 },
} as const;

type MeteredAction = keyof (typeof MONTHLY_LIMITS)["plus"];

function cleanText(value: unknown, max = 512): string {
  return String(value ?? "").trim().slice(0, max);
}

function validateSummary(input: ScanSummaryInput): ScanSummaryInput {
  if (!input || typeof input !== "object") throw new Error("Invalid scan summary");
  const fileName = cleanText(input.fileName, 260);
  const fileSha256 = cleanText(input.fileSha256, 128).toLowerCase();
  const mime = cleanText(input.mime, 160);
  const verdict = cleanText(input.verdict, 64);
  const primarySource = input.primarySource ? cleanText(input.primarySource, 120) : null;
  if (!fileName || !/^[a-f0-9]{64}$/.test(fileSha256) || !mime || !verdict) {
    throw new Error("Invalid scan summary");
  }
  const evidence: ScanSummaryInput['evidence'] = Array.isArray(input.evidence)
    ? input.evidence.slice(0, 40).map((item) => ({
        source: cleanText(item?.source, 120),
        family: cleanText(item?.family, 120),
        confidence: item?.confidence === "high" || item?.confidence === "medium" ? item.confidence : "low",
        evidence: cleanText(item?.evidence, 1000),
      }))
    : [];
  return { fileName, fileSha256, mime, verdict, primarySource, evidence };
}

async function entitlementForUser(userId: string): Promise<Entitlement> {
  const sql = await getSql();
  const rows = await sql<{
    plan: Plan;
    status: string;
    current_period_end: string | null;
  }>`
    select plan, status, current_period_end
    from tracefield_subscriptions
    where user_id = ${userId}
    limit 1
  `;
  const row = rows[0];
  if (!row) return { plan: "free", status: "inactive", active: false, currentPeriodEnd: null };
  const active = row.plan !== "free" && PAID_STATUSES.has(row.status) && (!row.current_period_end || new Date(row.current_period_end).getTime() > Date.now());
  return {
    plan: active ? "plus" : "free",
    status: row.status,
    active,
    currentPeriodEnd: row.current_period_end,
  };
}

async function requirePaid(userId: string): Promise<Entitlement> {
  const entitlement = await entitlementForUser(userId);
  if (!entitlement.active) throw new Error("PRO_REQUIRED");
  return entitlement;
}

async function enforceMonthlyLimit(userId: string, plan: Exclude<Plan, "free">, action: MeteredAction): Promise<void> {
  const sql = await getSql();
  const table = action === "history" ? "tracefield_scan_history" : "tracefield_verified_reports";
  // Table name comes exclusively from the closed enum above; values remain parameterized.
  const rows = await sql.query<{ count: number }>(
    `select count(*)::bigint as count from ${table} where user_id = $1 and created_at >= date_trunc('month', now())`,
    [userId],
  );
  const used = Number(rows[0]?.count ?? 0);
  const limit = MONTHLY_LIMITS[plan][action];
  if (used >= limit) throw new Error(`MONTHLY_LIMIT_REACHED:${action}:${limit}`);
}

export const getEntitlement = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => entitlementForUser(context.userId));

export const saveScanToHistory = createServerFn({ method: "POST" })
  .validator(validateSummary)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const entitlement = await requirePaid(context.userId);
    const plan = entitlement.plan as Exclude<Plan, "free">;
    await enforceMonthlyLimit(context.userId, plan, "history");
    const sql = await getSql();
    const id = crypto.randomUUID();
    await sql`
      insert into tracefield_scan_history
        (id, user_id, file_name, file_sha256, mime, verdict, primary_source, evidence_json)
      values
        (${id}, ${context.userId}, ${data.fileName}, ${data.fileSha256}, ${data.mime}, ${data.verdict}, ${data.primarySource}, ${JSON.stringify(data.evidence)})
    `;
    return { id };
  });

export const listScanHistory = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requirePaid(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      file_name: string;
      file_sha256: string;
      mime: string;
      verdict: string;
      primary_source: string | null;
      created_at: string;
    }>`
      select id, file_name, file_sha256, mime, verdict, primary_source, created_at
      from tracefield_scan_history
      where user_id = ${context.userId}
      order by created_at desc
      limit 50
    `;
    return rows.map((row): HistoryItem => ({
      id: row.id,
      fileName: row.file_name,
      fileSha256: row.file_sha256,
      mime: row.mime,
      verdict: row.verdict,
      primarySource: row.primary_source,
      createdAt: row.created_at,
    }));
  });

async function sha256Text(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const createVerifiedReport = createServerFn({ method: "POST" })
  .validator(validateSummary)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const entitlement = await requirePaid(context.userId);
    const plan = entitlement.plan as Exclude<Plan, "free">;
    await enforceMonthlyLimit(context.userId, plan, "receipts");
    const sql = await getSql();
    const id = crypto.randomUUID();
    const canonical = JSON.stringify({
      id,
      fileName: data.fileName,
      fileSha256: data.fileSha256,
      mime: data.mime,
      verdict: data.verdict,
      primarySource: data.primarySource,
      evidence: data.evidence,
    });
    const integritySha256 = await sha256Text(canonical);
    await sql`
      insert into tracefield_verified_reports
        (id, user_id, file_name, file_sha256, mime, verdict, primary_source, evidence_json, integrity_sha256)
      values
        (${id}, ${context.userId}, ${data.fileName}, ${data.fileSha256}, ${data.mime}, ${data.verdict}, ${data.primarySource}, ${JSON.stringify(data.evidence)}, ${integritySha256})
    `;
    return { id, integritySha256 };
  });

export const getVerifiedReport = createServerFn({ method: "GET" })
  .validator((id: string) => cleanText(id, 80))
  .handler(async ({ data: id }) => {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      file_name: string;
      file_sha256: string;
      mime: string;
      verdict: string;
      primary_source: string | null;
      evidence_json: string;
      integrity_sha256: string;
      created_at: string;
    }>`
      select id, file_name, file_sha256, mime, verdict, primary_source, evidence_json, integrity_sha256, created_at
      from tracefield_verified_reports
      where id = ${id}
      limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    let evidence: ScanSummaryInput["evidence"] = [];
    try {
      evidence = JSON.parse(row.evidence_json) as ScanSummaryInput["evidence"];
    } catch {
      evidence = [];
    }
    const report: VerifiedReport = {
      id: row.id,
      fileName: row.file_name,
      fileSha256: row.file_sha256,
      mime: row.mime,
      verdict: row.verdict,
      primarySource: row.primary_source,
      evidence,
      integritySha256: row.integrity_sha256,
      createdAt: row.created_at,
    };
    return report;
  });
