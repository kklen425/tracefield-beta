import type { Hit, LabId } from "./types";

export interface Needle {
  re: RegExp;
  lab: LabId;
  family: string;
  title: string;
  confidence: Hit["confidence"];
  layer: Hit["layer"];
  removal: Hit["removal"];
  detail: string;
}

export const NEEDLES: Needle[] = [
  {
    re: /\b(synthid|synth-id|synth_id)\b/i,
    lab: "unknown",
    family: "SynthID",
    title: "SynthID provenance signal named",
    confidence: "high",
    layer: "metadata",
    removal: "none",
    detail: "Editable metadata names SynthID. This is marker text only, not detection or verification of a hidden watermark. Provider attribution requires neighbouring evidence; official verification remains provider-specific.",
  },
  {
    re: /\b(nano\s*banana|imagen(?:\s*\d+)?|gemini(?:[- ](?:image|flash|pro))?|whisk|google\s*deepmind|vertex\s*ai|lyria|veo\s*[23])\b/i,
    lab: "google",
    family: "Generator tag",
    title: "Google / Gemini generator tag",
    confidence: "high",
    layer: "metadata",
    removal: "none",
    detail: "Software or a signed claim names a Google image model. Original Gemini downloads can also carry SynthID in the media signal.",
  },
  {
    re: /\b(dall-?e(?:\s*[23])?|dall·e|gpt-?image|sora(?:\s*[21])?|openai|chatgpt(?:\s*image)?)\b/i,
    lab: "openai",
    family: "Generator tag",
    title: "OpenAI generator tag",
    confidence: "high",
    layer: "metadata",
    removal: "none",
    detail: "EXIF, XMP, or C2PA names OpenAI / DALL·E / GPT Image / Sora. Newer supported OpenAI images can also carry SynthID in addition to C2PA.",
  },
  {
    re: /\b(midjourney|mj[_-]?jobid)\b/i,
    lab: "midjourney",
    family: "Generator tag",
    title: "Midjourney tag",
    confidence: "high",
    layer: "metadata",
    removal: "none",
    detail: "A Midjourney software or job identifier is embedded.",
  },
  {
    re: /\b(stable\s*diffusion|sdxl|stability\s*ai|stable-diffusion)\b/i,
    lab: "stability",
    family: "Generator tag",
    title: "Stable Diffusion / Stability tag",
    confidence: "high",
    layer: "metadata",
    removal: "none",
    detail: "Prompt or software fields name Stable Diffusion, SDXL, or Stability AI.",
  },
  {
    re: /\b(flux(?:[\s._-]?(dev|schnell|pro|kontext))?|black\s*forest\s*labs|bfl)\b/i,
    lab: "blackforest",
    family: "Generator tag",
    title: "Black Forest Labs / FLUX tag",
    confidence: "high",
    layer: "metadata",
    removal: "none",
    detail: "Metadata or workflow fields name FLUX or Black Forest Labs.",
  },
  {
    re: /\b(adobe\s*firefly|firefly(?:\s*image)?|generative\s*fill)\b/i,
    lab: "adobe",
    family: "Generator tag",
    title: "Adobe Firefly / Generative Fill",
    confidence: "high",
    layer: "metadata",
    removal: "none",
    detail: "Adobe generative tooling is recorded in XMP history or C2PA actions.",
  },
  {
    re: /\b(ideogram)\b/i,
    lab: "ideogram",
    family: "Generator tag",
    title: "Ideogram tag",
    confidence: "high",
    layer: "metadata",
    removal: "none",
    detail: "Ideogram is named as the generating software.",
  },
  {
    re: /\b(leonardo[\s._-]?ai)\b/i,
    lab: "leonardo",
    family: "Generator tag",
    title: "Leonardo.Ai tag",
    confidence: "high",
    layer: "metadata",
    removal: "none",
    detail: "Leonardo is named in metadata.",
  },
  {
    re: /\b(runway(?:ml)?|gen-[34])\b/i,
    lab: "runway",
    family: "Generator tag",
    title: "Runway tag",
    confidence: "medium",
    layer: "metadata",
    removal: "none",
    detail: "Runway appears as software or claim generator.",
  },
  {
    re: /\b(grok\s*imagine|\bxai\b|x\.ai)\b/i,
    lab: "xai",
    family: "Generator tag",
    title: "xAI / Grok Imagine tag",
    confidence: "high",
    layer: "metadata",
    removal: "none",
    detail: "xAI or Grok Imagine is named in the file.",
  },
  {
    re: /\b(microsoft\s*designer|bing\s*image\s*creator|copilot\s*(designer|image))\b/i,
    lab: "microsoft",
    family: "Generator tag",
    title: "Microsoft Designer / Copilot",
    confidence: "high",
    layer: "metadata",
    removal: "none",
    detail: "Microsoft image tooling is recorded in metadata.",
  },
  {
    re: /\b(image\s*playground|apple\s*intelligence)\b/i,
    lab: "apple",
    family: "Generator tag",
    title: "Apple Image Playground",
    confidence: "high",
    layer: "metadata",
    removal: "none",
    detail: "Apple Intelligence generation is recorded.",
  },
  {
    re: /\b(meta\s*ai|imagine\s*by\s*meta|llama\s*image)\b/i,
    lab: "meta",
    family: "Generator tag",
    title: "Meta Imagine tag",
    confidence: "medium",
    layer: "metadata",
    removal: "none",
    detail: "Meta AI image tooling is named.",
  },
  {
    re: /\b(comfyui|comfy\s*ui)\b/i,
    lab: "comfyui",
    family: "Workflow",
    title: "ComfyUI workflow embed",
    confidence: "high",
    layer: "container",
    removal: "none",
    detail: "A ComfyUI graph is stored in PNG text. This identifies the local toolchain, not a cloud lab.",
  },
  {
    re: /\b(negative prompt|steps:\s*\d+|sampler:\s*\w+|cfg scale:)/i,
    lab: "a1111",
    family: "PNG parameters",
    title: "Automatic1111 parameters chunk",
    confidence: "high",
    layer: "container",
    removal: "none",
    detail: "Classic A1111 PNG tEXt ‘parameters’ block with sampler / CFG / steps.",
  },
  {
    re: /\b(novelai|nai\s*diffusion)\b/i,
    lab: "novelai",
    family: "Generator tag",
    title: "NovelAI tag",
    confidence: "high",
    layer: "metadata",
    removal: "none",
    detail: "NovelAI is named in a comment or PNG chunk.",
  },
  {
    re: /\b(doubao|jimeng|seedream|seedance)\b/i,
    lab: "bytedance",
    family: "Generator tag",
    title: "ByteDance generator tag",
    confidence: "high",
    layer: "metadata",
    removal: "none",
    detail: "Doubao / Jimeng / Seedream is named. Mainland exports often add AIGC labels too.",
  },
  {
    re: /\b(tongyi|wanxiang|qwen[- ]?image)\b/i,
    lab: "alibaba",
    family: "Generator tag",
    title: "Qwen / Tongyi tag",
    confidence: "high",
    layer: "metadata",
    removal: "none",
    detail: "Alibaba Qwen Image or Tongyi Wanxiang is named.",
  },
  {
    re: /\b(kling\s*ai|kuaishou)\b/i,
    lab: "kuaishou",
    family: "Generator tag",
    title: "Kling / Kuaishou tag",
    confidence: "high",
    layer: "metadata",
    removal: "none",
    detail: "Kling or Kuaishou is named in metadata.",
  },
  {
    re: /\b(hailuo(?:\s*ai)?|minimax)\b/i,
    lab: "minimax",
    family: "Generator tag",
    title: "MiniMax / Hailuo tag",
    confidence: "high",
    layer: "metadata",
    removal: "none",
    detail: "MiniMax or Hailuo is named in metadata.",
  },
  {
    re: /\b(recraft(?:\s*ai)?|recraft\s*v[23])\b/i,
    lab: "recraft",
    family: "Generator tag",
    title: "Recraft tag",
    confidence: "high",
    layer: "metadata",
    removal: "none",
    detail: "Recraft is named in metadata or a workflow field.",
  },
  {
    re: /\b(canva\s*(magic\s*media|dream\s*lab)|magic\s*media)\b/i,
    lab: "canva",
    family: "Generator tag",
    title: "Canva AI tag",
    confidence: "medium",
    layer: "metadata",
    removal: "none",
    detail: "Canva Magic Media or Dream Lab is named in metadata.",
  },
  {
    re: /\b(trainedalgorithmicmedia|compositewithtrainedalgorithmicmedia|algorithmicallyenhanced)\b/i,
    lab: "unknown",
    family: "C2PA / IPTC source type",
    title: "Declared algorithmic media",
    confidence: "high",
    layer: "metadata",
    removal: "none",
    detail:
      "digitalSourceType is set to trained or composite algorithmic media. This is an explicit AI-origin declaration.",
  },
  {
    re: /\b(contentpropagator|produceid|reservedcode1|aigclabel|aigc[:\s])/i,
    lab: "china-aigc",
    family: "TC260 AIGC",
    title: "China AIGC labeling fields",
    confidence: "high",
    layer: "metadata",
    removal: "none",
    detail: "GB/TC260 generative-content labels (AIGC, ProduceID, ContentPropagator) are present.",
  },
  {
    re: /\b(c2pa\.created|c2pa\.placed|com\.openai\.generated|claim_generator)\b/i,
    lab: "c2pa",
    family: "C2PA",
    title: "C2PA action / claim generator",
    confidence: "high",
    layer: "container",
    removal: "none",
    detail: "A C2PA assertion or claim_generator string is inside the file.",
  },
];

export function matchNeedles(haystack: string): Omit<Hit, "id">[] {
  const hits: Omit<Hit, "id">[] = [];
  const seen = new Set<string>();
  for (const n of NEEDLES) {
    const m = haystack.match(n.re);
    if (!m) continue;
    const key = `${n.lab}:${n.family}:${n.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({
      lab: n.lab,
      family: n.family,
      title: n.title,
      detail: n.detail,
      evidence: clipEvidence(haystack, m.index ?? 0, m[0]),
      confidence: n.confidence,
      layer: n.layer,
      removal: n.removal,
    });
  }
  return hits;
}

export function clipEvidence(haystack: string, index: number, match: string): string {
  const start = Math.max(0, index - 42);
  const end = Math.min(haystack.length, index + match.length + 42);
  const slice = haystack.slice(start, end).replace(/\s+/g, " ").trim();
  return (start > 0 ? "…" : "") + slice + (end < haystack.length ? "…" : "");
}

export function harvestAscii(bytes: Uint8Array, min = 4): string {
  const parts: string[] = [];
  let buf = "";
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i];
    const ok = (c >= 32 && c <= 126) || c === 9 || c === 10 || c === 13;
    if (ok) {
      buf += String.fromCharCode(c);
    } else {
      if (buf.length >= min) parts.push(buf);
      buf = "";
    }
  }
  if (buf.length >= min) parts.push(buf);
  return parts.join("\n");
}
