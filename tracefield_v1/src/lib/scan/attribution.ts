import type { AttributionCandidate, AttributionRole, Confidence, Hit, LabId } from "./types";

const GENERIC = new Set<LabId>(["unknown", "c2pa", "china-aigc"]);
const weight: Record<Confidence, number> = { high: 55, medium: 28, low: 9 };

const WORKFLOWS = new Set<LabId>(["comfyui", "a1111"]);
const PLATFORMS = new Set<LabId>(["canva", "microsoft"]);

export function attributionRole(lab: LabId): AttributionRole {
  if (WORKFLOWS.has(lab)) return "workflow";
  if (PLATFORMS.has(lab)) return "platform";
  return "model-provider";
}

export function rankAttribution(hits: Hit[]): AttributionCandidate[] {
  const byLab = new Map<LabId, { score: number; families: Set<string>; count: number }>();
  for (const hit of hits) {
    if (GENERIC.has(hit.lab)) continue;
    const row = byLab.get(hit.lab) ?? { score: 0, families: new Set<string>(), count: 0 };
    row.score += weight[hit.confidence];
    row.families.add(hit.family);
    row.count += 1;
    byLab.set(hit.lab, row);
  }
  return [...byLab.entries()]
    .map(([lab, row]) => {
      const diversityBonus = Math.max(0, row.families.size - 1) * 10;
      const evidenceScore = Math.min(100, row.score + diversityBonus);
      const confidence: Confidence = evidenceScore >= 70 ? "high" : evidenceScore >= 35 ? "medium" : "low";
      return {
        lab,
        role: attributionRole(lab),
        evidenceScore,
        confidence,
        evidenceCount: row.count,
        families: [...row.families],
      };
    })
    .sort((a, b) => b.evidenceScore - a.evidenceScore);
}
