import type { LabId, LabProfile } from "./types";

export const LABS: Record<LabId, LabProfile> = {
  google: {
    id: "google",
    name: "Google DeepMind",
    org: "Google / Gemini / Imagen / Veo / Whisk / Nano Banana",
    marks: ["SynthID", "C2PA Content Credentials", "IPTC DigitalSourceType"],
    notes:
      "Google AI media can carry SynthID plus C2PA/IPTC provenance. TRACEFIELD can validate open C2PA locally; official SynthID verification remains provider-controlled.",
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    org: "ChatGPT / DALL·E / GPT Image / Sora",
    marks: ["C2PA Content Credentials", "SynthID on supported newer media", "claim_generator / model"],
    notes:
      "OpenAI supports C2PA and, on supported newer image/audio output, SynthID. Official OpenAI provenance checks can identify supported OpenAI-issued signals.",
  },
  midjourney: {
    id: "midjourney",
    name: "Midjourney",
    org: "Midjourney",
    marks: ["PNG/JPEG comment or filename cues", "Job ID in metadata when exported"],
    notes:
      "Discord downloads often have no metadata. The alpha website export can include a job id and Midjourney software tag.",
  },
  stability: {
    id: "stability",
    name: "Stability AI",
    org: "Stable Diffusion / SDXL / Stability AI",
    marks: ["PNG tEXt parameters", "ComfyUI / A1111 workflow", "sd-metadata"],
    notes:
      "Open-source UIs often write prompts and sampler settings into PNG text chunks. Wrapper apps can also add C2PA or other provenance.",
  },
  adobe: {
    id: "adobe",
    name: "Adobe Firefly",
    org: "Adobe Firefly / Photoshop Generative Fill",
    marks: ["C2PA Content Credentials", "TrustMark (pixel, optional)", "XMP history"],
    notes:
      "Firefly and recent Photoshop builds attach Content Credentials. TrustMark is an invisible pixel watermark used by some Adobe pipelines.",
  },
  meta: {
    id: "meta",
    name: "Meta",
    org: "Meta AI / Imagine / Llama image",
    marks: ["C2PA", "EXIF Software"],
    notes: "Meta Imagine and related tools may attach Content Credentials on original downloads.",
  },
  xai: {
    id: "xai",
    name: "xAI",
    org: "Grok Imagine / xAI",
    marks: ["C2PA or generator XMP when present", "Software tag"],
    notes: "Grok Imagine outputs may carry generator metadata on the original file. Re-saves drop it.",
  },
  ideogram: {
    id: "ideogram",
    name: "Ideogram",
    org: "Ideogram",
    marks: ["C2PA", "EXIF Software"],
    notes: "Ideogram original downloads often include a generator software tag.",
  },
  leonardo: {
    id: "leonardo",
    name: "Leonardo",
    org: "Leonardo.Ai",
    marks: ["EXIF/PNG software", "optional C2PA"],
    notes: "Leonardo tags software on many exports.",
  },
  runway: {
    id: "runway",
    name: "Runway",
    org: "Runway ML / Gen-3 / Gen-4 stills",
    marks: ["C2PA", "EXIF Software"],
    notes: "Runway stills and frames can carry Content Credentials on original export.",
  },
  microsoft: {
    id: "microsoft",
    name: "Microsoft",
    org: "Designer / Copilot / Bing Image Creator",
    marks: ["C2PA", "EXIF Software", "DALL·E lineage"],
    notes: "Bing Image Creator historically used DALL·E; Designer attaches Microsoft C2PA on many assets.",
  },
  apple: {
    id: "apple",
    name: "Apple",
    org: "Image Playground / Apple Intelligence",
    marks: ["C2PA", "XMP DigitalSourceType"],
    notes: "Apple Intelligence generated images can carry Content Credentials on original export.",
  },
  bytedance: {
    id: "bytedance",
    name: "ByteDance",
    org: "Doubao / Jimeng / Seedream",
    marks: ["China TC260 AIGC labels", "visible corner marks", "C2PA on some exports"],
    notes: "Mainland generators often write AIGC / ProduceID IPTC fields and a visible vendor label.",
  },
  alibaba: {
    id: "alibaba",
    name: "Alibaba / Qwen",
    org: "Tongyi / Qwen Image / Wanxiang",
    marks: ["AIGC labels", "visible marks"],
    notes: "Qwen Image and Tongyi Wanxiang may stamp AIGC metadata on original files.",
  },
  kuaishou: {
    id: "kuaishou",
    name: "Kuaishou",
    org: "Kling AI / Kuaishou",
    marks: ["AIGC labels", "visible marks"],
    notes: "Kling assets may carry generator or platform labels on original exports.",
  },
  comfyui: {
    id: "comfyui",
    name: "ComfyUI",
    org: "ComfyUI workflow embed",
    marks: ["PNG tEXt/iTXt workflow JSON", "prompt graph"],
    notes: "ComfyUI writes the full workflow into PNG chunks. That is a generator fingerprint, not SynthID.",
  },
  a1111: {
    id: "a1111",
    name: "Automatic1111",
    org: "Stable Diffusion WebUI",
    marks: ["PNG tEXt parameters", "Negative prompt"],
    notes: "A1111 stores sampling parameters in a PNG tEXt chunk named parameters.",
  },
  novelai: {
    id: "novelai",
    name: "NovelAI",
    org: "NovelAI",
    marks: ["PNG stealth / LSB (legacy)", "Comment"],
    notes: "Older NovelAI outputs hid a generation comment in LSB stego; newer ones use PNG text.",
  },
  "china-aigc": {
    id: "china-aigc",
    name: "TC260 AIGC label",
    org: "China generative-AI labeling (GB 45438 / TC260)",
    marks: ["AIGC", "Label", "ProduceID", "ContentPropagator", "ReservedCode1"],
    notes: "Required labeling fields on many Chinese-platform AI images. Metadata, not a pixel watermark.",
  },
  blackforest: {
    id: "blackforest",
    name: "Black Forest Labs",
    org: "FLUX / FLUX Kontext",
    marks: ["Workflow metadata", "generator/model tags", "wrapper-specific provenance"],
    notes: "FLUX is a Black Forest Labs model family. Attribution usually comes from workflow or wrapper metadata rather than a universal model watermark.",
  },
  minimax: {
    id: "minimax",
    name: "MiniMax",
    org: "Hailuo / MiniMax",
    marks: ["Generator metadata", "platform labels"],
    notes: "Hailuo belongs to MiniMax. TRACEFIELD only names it when direct file or workflow evidence is present.",
  },
  recraft: {
    id: "recraft",
    name: "Recraft",
    org: "Recraft",
    marks: ["Generator metadata", "workflow tags"],
    notes: "Recraft is attributed only when the file carries direct generator or workflow evidence.",
  },
  canva: {
    id: "canva",
    name: "Canva",
    org: "Magic Media / Dream Lab",
    marks: ["Generator metadata", "export metadata"],
    notes: "Canva AI tooling is attributed only when export metadata names the generating workflow.",
  },
  c2pa: {
    id: "c2pa",
    name: "C2PA Content Credentials",
    org: "C2PA / Content Authenticity Initiative",
    marks: ["JUMBF / caBX / APP11 manifest"],
    notes:
      "Cryptographically signed provenance. Names the tool that produced the file when the original download is intact. Stripped by most social re-encodes.",
  },
  unknown: {
    id: "unknown",
    name: "Unattributed",
    org: "Unknown generator",
    marks: ["Generic AI metadata or frequency anomaly"],
    notes: "A mark is present but the lab could not be named with confidence.",
  },
};

export function labName(id: LabId): string {
  return LABS[id]?.name ?? id;
}
