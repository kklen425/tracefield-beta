import { rankAttribution } from "./attribution";
import { sha256Hex } from "./hash";
import { isJpeg, jpegComments, jpegHasC2pa, parseJpegSegments } from "./jpeg";
import { LABS } from "./labs";
import { readMetadata } from "./metadata";
import { isPng, parsePngChunks, pngHasC2pa, pngTextChunks } from "./png";
import { harvestAscii, matchNeedles } from "./signatures";
import { analyzeSpectrum, spectrumSuspicion } from "./spectrum";
import type { FileFacts, Hit, LabId, ScanProgress, ScanReport } from "./types";
import { findVisibleMarks } from "./visible";

export async function scanImage(
  file: File,
  onProgress?: (p: ScanProgress) => void,
): Promise<ScanReport> {
  const tick = (step: string, pct: number) => onProgress?.({ step, pct });
  tick("Reading file", 4);

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const hash = await sha256Hex(buffer);
  const kind = sniff(file.type, bytes);

  tick("Opening pixels", 12);
  const bitmap = await createImageBitmap(file);
  const origW = bitmap.width;
  const origH = bitmap.height;
  const maxEdge = 1600;
  const scale = Math.min(1, maxEdge / Math.max(origW, origH));
  const cw = Math.max(1, Math.round(origW * scale));
  const ch = Math.max(1, Math.round(origH * scale));
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is unavailable.");
  ctx.drawImage(bitmap, 0, 0, cw, ch);
  const image = ctx.getImageData(0, 0, cw, ch);
  bitmap.close();

  const facts: FileFacts = {
    name: file.name,
    size: file.size,
    mime: file.type || mimeFor(kind),
    kind,
    width: origW,
    height: origH,
    sha256: hash,
  };

  const hits: Hit[] = [];
  let n = 0;
  const add = (h: Omit<Hit, "id">) => {
    hits.push({ ...h, id: `h${n++}` });
  };

  tick("Container — C2PA / JUMBF", 28);
  let c2paPresent = false;
  if (kind === "png") {
    const chunks = parsePngChunks(bytes);
    if (pngHasC2pa(chunks)) {
      c2paPresent = true;
      add({
        lab: "c2pa",
        family: "C2PA",
        title: "PNG Content Credentials (caBX)",
        detail:
          "A PNG ancillary chunk resembles a C2PA JUMBF container. Signature validation is shown separately; this marker alone does not verify a signed manifest.",
        evidence: chunks
          .filter((c) => /caBX|c2pa|C2PA/i.test(c.type))
          .map((c) => `${c.type} ${c.data.length} bytes`)
          .join(", "),
        confidence: "high",
        layer: "container",
        removal: "none",
      });
    }
    const texts = pngTextChunks(chunks);
    for (const t of texts) {
      const hay = `${t.key}: ${t.value}`;
      for (const m of matchNeedles(hay)) add({ ...m, evidence: hay.slice(0, 180) });
      if (/^parameters$/i.test(t.key) && !hits.some((h) => h.lab === "a1111")) {
        add({
          lab: "a1111",
          family: "PNG parameters",
          title: "PNG tEXt parameters",
          detail: "Automatic1111-style generation parameters are stored in a PNG text chunk.",
          evidence: hay.slice(0, 180),
          confidence: "high",
          layer: "container",
          removal: "none",
        });
      }
    }
  } else if (kind === "jpeg") {
    const segs = parseJpegSegments(bytes);
    if (jpegHasC2pa(segs)) {
      c2paPresent = true;
      add({
        lab: "c2pa",
        family: "C2PA",
        title: "JPEG Content Credentials (APP11 / JUMBF)",
        detail:
          "JPEG APP11 carries a JUMBF C2PA manifest. Original DALL·E 3, Firefly, and some Gemini downloads use this.",
        evidence: segs
          .filter((s) => s.marker === 0xeb)
          .map((s) => `${s.name} ${s.length}b`)
          .join(", ") || "JUMBF string in APP segment",
        confidence: "high",
        layer: "container",
        removal: "none",
      });
    }
    for (const c of jpegComments(segs)) {
      for (const m of matchNeedles(c)) add(m);
    }
  }

  tick("Harvesting embedded strings", 42);
  const ascii = harvestAscii(bytes);
  if (/jumb|urn:c2pa|c2pa\./i.test(ascii) && !c2paPresent) {
    c2paPresent = true;
    add({
      lab: "c2pa",
      family: "C2PA",
      title: "C2PA strings inside the bitstream",
      detail: "JUMBF / urn:c2pa tokens were found even without a clean container parse.",
      evidence: clip(ascii, /jumb|urn:c2pa|c2pa\./i),
      confidence: "high",
      layer: "container",
      removal: "none",
    });
  }
  for (const m of matchNeedles(ascii)) add(m);

  tick("EXIF / XMP / IPTC", 58);
  const meta = await readMetadata(file);
  const metadataPresent = meta.present;
  if (meta.present) {
    for (const m of matchNeedles(meta.rawText)) add(m);
    if (meta.software.length) {
      add({
        lab: "unknown",
        family: "EXIF",
        title: "Software tag",
        detail:
          "The file records the tool that last wrote it. Camera bodies, editors, and generators all use this field.",
        evidence: meta.software.slice(0, 4).join(" · "),
        confidence: "low",
        layer: "metadata",
        removal: "none",
      });
    }
  }

  tick("Visible corner marks", 70);
  const visible = findVisibleMarks(image);
  for (const v of visible) {
    add({
      lab: "unknown",
      family: "Visible",
      title: `Corner mark · ${v.corner.toUpperCase()}`,
      detail: `${v.reason} Some export labels and visible provenance marks are placed near image corners; this detector does not identify a provider from shape alone.`,
      evidence: `score ${v.score.toFixed(1)} at ${v.corner}`,
      confidence: v.score > 40 ? "medium" : "low",
      layer: "visible",
      removal: "none",
    });
  }

  tick("Frequency field", 84);
  const spectrum = analyzeSpectrum(image);
  const sus = spectrumSuspicion(spectrum);
  if (sus >= 0.34) {
    add({
      lab: "unknown",
      family: "Frequency heuristic",
      title: "Structured frequency anomaly",
      detail:
        "Local FFT heuristics found repeated spectral structure. This is supporting forensic evidence only; it is not an official SynthID or provider watermark detector.",
      evidence: spectrum.notes.join(" "),
      confidence: sus >= 0.55 ? "medium" : "low",
      layer: "pixel",
      removal: "none",
    });
  }

  tick("Attributing labs", 94);
  const deduped = dedupeHits(hits);
  refineLabs(deduped);
  const labs = uniqueLabs(deduped);
  const pixel = deduped.some((h) => h.layer === "pixel" || h.layer === "visible");
  const metaHit = deduped.some((h) => h.layer === "metadata" || h.layer === "container");
  const strong = deduped.filter((h) => h.confidence !== "low");
  let verdict: ScanReport["verdict"] = "clean";
  if (strong.length === 0 && sus < 0.34 && !c2paPresent) {
    verdict = "clean";
  } else if (pixel && metaHit) verdict = "mixed";
  else if (pixel) verdict = "pixel";
  else if (metaHit) verdict = "metadata";

  const named = labs.filter((id) => id !== "unknown" && id !== "c2pa");
  const summary = buildSummary(verdict, named, deduped, sus);
  const attribution = rankAttribution(deduped);

  tick("Done", 100);
  return {
    facts,
    hits: deduped,
    labs,
    verdict,
    summary,
    strings: notableStrings(ascii),
    spectrum,
    visible,
    c2paPresent,
    c2pa: null,
    attribution,
    metadataPresent,
    scannedAt: Date.now(),
  };
}

function sniff(mime: string, bytes: Uint8Array): FileFacts["kind"] {
  if (isJpeg(bytes) || mime === "image/jpeg") return "jpeg";
  if (isPng(bytes) || mime === "image/png") return "png";
  if (mime === "image/webp" || (bytes[0] === 0x52 && bytes[8] === 0x57)) return "webp";
  if (mime === "image/gif" || (bytes[0] === 0x47 && bytes[1] === 0x49)) return "gif";
  if (mime === "image/avif") return "avif";
  return "unknown";
}

function mimeFor(kind: FileFacts["kind"]): string {
  if (kind === "jpeg") return "image/jpeg";
  if (kind === "png") return "image/png";
  if (kind === "webp") return "image/webp";
  if (kind === "gif") return "image/gif";
  if (kind === "avif") return "image/avif";
  return "application/octet-stream";
}

function clip(hay: string, re: RegExp): string {
  const m = hay.match(re);
  if (!m || m.index == null) return re.source;
  const i = m.index;
  return hay.slice(Math.max(0, i - 24), i + m[0].length + 24).replace(/\s+/g, " ");
}

function dedupeHits(hits: Hit[]): Hit[] {
  const seen = new Set<string>();
  const out: Hit[] = [];
  for (const h of hits) {
    const key = `${h.lab}|${h.family}|${h.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(h);
  }
  const rank = { high: 0, medium: 1, low: 2 };
  return out.sort((a, b) => rank[a.confidence] - rank[b.confidence]);
}

function uniqueLabs(hits: Hit[]): LabId[] {
  const ids: LabId[] = [];
  for (const h of hits) {
    if (!ids.includes(h.lab)) ids.push(h.lab);
  }
  return ids;
}

function refineLabs(hits: Hit[]): void {
  const named = hits.find((h) => h.lab !== "unknown" && h.lab !== "c2pa" && h.lab !== "china-aigc");
  if (!named) return;
  for (const h of hits) {
    if (h.lab === "unknown" && h.family === "C2PA / IPTC source type") {
      h.lab = named.lab;
      h.detail = `Algorithmic-media declaration, attributed to ${LABS[named.lab].name} from neighbouring tags.`;
    }
    if (h.lab === "c2pa" && named.lab !== "c2pa") {
      h.detail += ` Neighbouring tags point at ${LABS[named.lab].name}.`;
    }
  }
}

function buildSummary(
  verdict: ScanReport["verdict"],
  named: LabId[],
  hits: Hit[],
  sus: number,
): string {
  const labs = named.map((id) => LABS[id].name);
  const pixel = hits.filter((h) => h.layer === "pixel");
  if (verdict === "clean") {
    return "No direct provenance or generator tag was found. That does not prove human origin — re-encoding, screenshots, legacy generators, or unsupported watermark systems can remove or hide evidence.";
  }
  if (labs.length) {
    const who = labs.slice(0, 3).join(", ");
    if (pixel.length) {
      return `Source evidence points to ${who}. A separate local frequency anomaly was also flagged; treat that pixel signal as heuristic, not a provider-specific watermark result.`;
    }
    return `Source evidence points to ${who}. The attribution comes from container, C2PA, EXIF/XMP, workflow, or other file-level signals that TRACEFIELD can show individually.`;
  }
  if (pixel.length) {
    return `A structured pixel anomaly was found, but no provider could be named. The local frequency score (${Math.round(sus * 100)}/100) is forensic supporting evidence only.`;
  }
  return "Provenance or AI-origin metadata is present, but the current evidence does not name a specific provider with enough confidence.";
}

function notableStrings(ascii: string): string[] {
  const lines = ascii.split("\n").map((s) => s.trim());
  const interesting = lines.filter((s) =>
    /c2pa|synth|gemini|dall|openai|midjourney|firefly|stable|prompt|aigc|imagen|flux|software/i.test(s),
  );
  return [...new Set(interesting)].slice(0, 12);
}
