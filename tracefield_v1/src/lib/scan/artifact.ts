import { rankAttribution } from "./attribution";
import { validateC2pa } from "./c2pa";
import { scanImage } from "./detect";
import { sha256Hex } from "./hash";
import { LABS } from "./labs";
import { harvestAscii, matchNeedles } from "./signatures";
import type { FileFacts, Hit, LabId, ScanProgress, ScanReport } from "./types";

const MAX_LOCAL_SCAN_BYTES = 160 * 1024 * 1024;
const TEXT_SAMPLE_BYTES = 10 * 1024 * 1024;

export async function scanArtifact(
  file: File,
  onProgress?: (p: ScanProgress) => void,
): Promise<ScanReport> {
  if (file.size > MAX_LOCAL_SCAN_BYTES) {
    throw new Error("This beta scans files up to 160 MB locally. Large video support is coming next.");
  }
  if (isRasterImage(file)) {
    const base = await scanImage(file, (p) => onProgress?.({ ...p, pct: Math.min(88, p.pct * 0.88) }));
    onProgress?.({ step: "Validating Content Credentials", pct: 91 });
    const c2pa = await validateC2pa(file);
    onProgress?.({ step: "Ranking source evidence", pct: 97 });
    const out = mergeC2pa(base, c2pa);
    onProgress?.({ step: "Done", pct: 100 });
    return out;
  }

  return scanContainerArtifact(file, onProgress);
}

function isRasterImage(file: File): boolean {
  return ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(file.type);
}

async function scanContainerArtifact(
  file: File,
  onProgress?: (p: ScanProgress) => void,
): Promise<ScanReport> {
  const tick = (step: string, pct: number) => onProgress?.({ step, pct });
  tick("Reading container", 6);
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const kind = sniffKind(file, bytes);
  const hash = await sha256Hex(buffer);
  const facts: FileFacts = {
    name: file.name,
    size: file.size,
    mime: file.type || mimeFor(kind),
    kind,
    width: 0,
    height: 0,
    sha256: hash,
  };

  tick("Inspecting metadata strings", 30);
  const textBytes = sampleBytes(bytes);
  const ascii = harvestAscii(textBytes);
  const metadataText = extractContainerMetadata(kind, ascii);
  const hits: Hit[] = [];
  let id = 0;
  for (const match of matchNeedles(`${ascii}\n${metadataText}`)) hits.push({ ...match, id: `g${id++}` });

  if (metadataText) {
    hits.push({
      id: `g${id++}`,
      lab: "unknown",
      family: kind === "pdf" ? "PDF metadata" : "Container metadata",
      title: kind === "pdf" ? "PDF producer / creator metadata" : "Container creator metadata",
      detail: "The file exposes creator or producer fields. These can be useful attribution clues but are not proof by themselves.",
      evidence: metadataText.slice(0, 700),
      confidence: "low",
      layer: "metadata",
      removal: "none",
    });
  }

  tick("Validating Content Credentials", 68);
  const c2pa = await validateC2pa(file);
  if (c2pa.present) {
    hits.push({
      id: `g${id++}`,
      lab: "c2pa",
      family: "C2PA",
      title: "Content Credentials manifest detected",
      detail: c2pa.validatorAvailable
        ? `The official CAI validator found a manifest. Validation state: ${c2pa.validationState}.`
        : "C2PA-like data was detected, but the local CAI validator could not be loaded.",
      evidence: [c2pa.activeManifest, c2pa.claimGenerator, c2pa.issuer].filter(Boolean).join(" · ") || "C2PA manifest",
      confidence: c2pa.validationState === "invalid" ? "medium" : "high",
      layer: "container",
      removal: "none",
    });
    for (const match of matchNeedles(c2pa.rawText)) hits.push({ ...match, id: `g${id++}` });
  }

  tick("Ranking source evidence", 90);
  const deduped = dedupeHits(hits);
  refineGenericAttribution(deduped);
  const labs = uniqueLabs(deduped);
  const attribution = rankAttribution(deduped);
  const named = attribution[0];
  const hasEvidence = deduped.some((hit) => hit.confidence !== "low") || c2pa.present;
  const verdict: ScanReport["verdict"] = hasEvidence ? "metadata" : "clean";
  const summary = named
    ? `Source evidence points most strongly to ${LABS[named.lab].name} (${named.confidence} confidence, evidence score ${named.evidenceScore}/100). This score ranks observed file evidence; it is not a probability.`
    : c2pa.present
      ? `Content Credentials are present, but the current manifest evidence does not name a supported AI provider with enough confidence.`
      : `No supported provenance signal or named generator tag was found in this ${kind.toUpperCase()} container. That does not prove human origin.`;

  tick("Done", 100);
  return {
    facts,
    hits: deduped,
    labs,
    verdict,
    summary,
    strings: notableStrings(ascii),
    spectrum: null,
    visible: [],
    c2paPresent: c2pa.present,
    c2pa,
    attribution,
    metadataPresent: Boolean(metadataText) || deduped.length > 0,
    scannedAt: Date.now(),
  };
}

function mergeC2pa(base: ScanReport, c2pa: Awaited<ReturnType<typeof validateC2pa>>): ScanReport {
  const hits = [...base.hits];
  let id = hits.length;
  if (c2pa.present) {
    hits.push({
      id: `c${id++}`,
      lab: "c2pa",
      family: "C2PA",
      title: "Content Credentials read locally",
      detail: `CAI C2PA validation state: ${c2pa.validationState}.`,
      evidence: [c2pa.activeManifest, c2pa.claimGenerator, c2pa.issuer].filter(Boolean).join(" · ") || "C2PA manifest",
      confidence: c2pa.validationState === "invalid" ? "medium" : "high",
      layer: "container",
      removal: "none",
    });
    for (const match of matchNeedles(c2pa.rawText)) hits.push({ ...match, id: `c${id++}` });
  }
  const deduped = dedupeHits(hits);
  refineGenericAttribution(deduped);
  const labs = uniqueLabs(deduped);
  const attribution = rankAttribution(deduped);
  const top = attribution[0];
  let summary = base.summary;
  if (top) {
    summary = `Source evidence points most strongly to ${LABS[top.lab].name} (${top.confidence} confidence, evidence score ${top.evidenceScore}/100). ${c2pa.present ? `A C2PA manifest was also found (${c2pa.validationState}).` : ""} Evidence score is a ranking of observed signals, not a probability.`;
  } else if (c2pa.present) {
    summary = `Content Credentials are present (${c2pa.validationState}), but TRACEFIELD does not have enough provider-specific evidence to name the generating service.`;
  }
  return {
    ...base,
    hits: deduped,
    labs,
    attribution,
    c2paPresent: base.c2paPresent || c2pa.present,
    c2pa,
    summary,
  };
}

function sniffKind(file: File, bytes: Uint8Array): FileFacts["kind"] {
  const mime = file.type.toLowerCase();
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  if (mime === "application/pdf" || starts(bytes, "%PDF-")) return "pdf";
  if (mime === "video/mp4" || ext === "mp4") return "mp4";
  if (mime === "video/quicktime" || ext === "mov") return "mov";
  if (mime === "video/webm" || ext === "webm") return "webm";
  if (mime === "audio/mpeg" || ext === "mp3") return "mp3";
  if (mime === "audio/wav" || ext === "wav") return "wav";
  if (mime === "audio/mp4" || ext === "m4a") return "m4a";
  if (mime === "image/svg+xml" || ext === "svg") return "svg";
  if (mime === "image/tiff" || ext === "tif" || ext === "tiff") return "tiff";
  if (mime === "image/heic" || mime === "image/heif" || ext === "heic" || ext === "heif") return "heic";
  return "unknown";
}

function mimeFor(kind: FileFacts["kind"]): string {
  const map: Partial<Record<FileFacts["kind"], string>> = {
    pdf: "application/pdf", mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm",
    mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/mp4", svg: "image/svg+xml", tiff: "image/tiff", heic: "image/heic",
  };
  return map[kind] ?? "application/octet-stream";
}

function starts(bytes: Uint8Array, text: string): boolean {
  if (bytes.length < text.length) return false;
  for (let i = 0; i < text.length; i++) if (bytes[i] !== text.charCodeAt(i)) return false;
  return true;
}

function sampleBytes(bytes: Uint8Array): Uint8Array {
  if (bytes.length <= TEXT_SAMPLE_BYTES) return bytes;
  const half = Math.floor(TEXT_SAMPLE_BYTES / 2);
  const out = new Uint8Array(TEXT_SAMPLE_BYTES);
  out.set(bytes.subarray(0, half), 0);
  out.set(bytes.subarray(bytes.length - half), half);
  return out;
}

function extractContainerMetadata(kind: FileFacts["kind"], ascii: string): string {
  const found: string[] = [];
  const patterns = kind === "pdf"
    ? [
        /\/Producer\s*\(([^)]{1,500})\)/gi,
        /\/Creator\s*\(([^)]{1,500})\)/gi,
        /<pdf:Producer>([^<]{1,500})<\/pdf:Producer>/gi,
        /<xmp:CreatorTool>([^<]{1,500})<\/xmp:CreatorTool>/gi,
      ]
    : [
        /(?:encoder|writing application|software|handler_name|com\.apple\.quicktime\.software)[:=\s]+([^\n\r]{1,500})/gi,
      ];
  for (const pattern of patterns) {
    for (const match of ascii.matchAll(pattern)) {
      const value = match[1]?.replace(/\\([()\\])/g, "$1").trim();
      if (value) found.push(value);
      if (found.length >= 10) break;
    }
  }
  return [...new Set(found)].join(" · ");
}

function dedupeHits(hits: Hit[]): Hit[] {
  const seen = new Set<string>();
  const rank = { high: 0, medium: 1, low: 2 } as const;
  return hits
    .filter((hit) => {
      const key = `${hit.lab}|${hit.family}|${hit.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => rank[a.confidence] - rank[b.confidence]);
}

function uniqueLabs(hits: Hit[]): LabId[] {
  return [...new Set(hits.map((hit) => hit.lab))];
}

function refineGenericAttribution(hits: Hit[]): void {
  const named = hits.find((hit) => !["unknown", "c2pa", "china-aigc"].includes(hit.lab));
  if (!named) return;
  for (const hit of hits) {
    if (hit.lab === "unknown" && hit.family === "C2PA / IPTC source type") hit.lab = named.lab;
  }
}

function notableStrings(ascii: string): string[] {
  return [...new Set(ascii.split(/\r?\n/).map((line) => line.trim()).filter((line) =>
    /c2pa|synthid|openai|chatgpt|gemini|imagen|midjourney|firefly|stable|flux|comfyui|aigc|producer|creator/i.test(line),
  ))].slice(0, 12);
}
