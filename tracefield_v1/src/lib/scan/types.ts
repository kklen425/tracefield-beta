export type Confidence = "high" | "medium" | "low";

export type MarkLayer = "container" | "metadata" | "pixel" | "visible";

export type RemovalPath = "none";

export type LabId =
  | "google"
  | "openai"
  | "midjourney"
  | "stability"
  | "adobe"
  | "meta"
  | "xai"
  | "ideogram"
  | "leonardo"
  | "runway"
  | "microsoft"
  | "apple"
  | "bytedance"
  | "alibaba"
  | "kuaishou"
  | "comfyui"
  | "a1111"
  | "novelai"
  | "china-aigc"
  | "blackforest"
  | "minimax"
  | "recraft"
  | "canva"
  | "c2pa"
  | "unknown";

export interface LabProfile {
  id: LabId;
  name: string;
  org: string;
  marks: string[];
  notes: string;
}

export interface Hit {
  id: string;
  lab: LabId;
  family: string;
  title: string;
  detail: string;
  evidence: string;
  confidence: Confidence;
  layer: MarkLayer;
  removal: RemovalPath;
}

export interface FileFacts {
  name: string;
  size: number;
  mime: string;
  kind:
    | "jpeg"
    | "png"
    | "webp"
    | "gif"
    | "avif"
    | "pdf"
    | "mp4"
    | "mov"
    | "webm"
    | "mp3"
    | "wav"
    | "m4a"
    | "svg"
    | "tiff"
    | "heic"
    | "unknown";
  width: number;
  height: number;
  sha256: string;
}

export interface SpectrumFeatures {
  size: number;
  grid8: number;
  peakiness: number;
  midHighRatio: number;
  greenBias: number;
  phaseCoherence: number;
  residualEnergy: number;
  heatmap: Uint8ClampedArray;
  heatmapSize: number;
  notes: string[];
}

export interface VisibleMark {
  corner: "tl" | "tr" | "bl" | "br";
  score: number;
  reason: string;
}


export type AttributionRole = "model-provider" | "platform" | "workflow";

export interface AttributionCandidate {
  lab: LabId;
  role: AttributionRole;
  evidenceScore: number;
  confidence: Confidence;
  evidenceCount: number;
  families: string[];
}

export interface C2paValidation {
  checked: boolean;
  validatorAvailable: boolean;
  present: boolean;
  validationState: "trusted" | "valid" | "invalid" | "not-present" | "unknown";
  activeManifest: string | null;
  claimGenerator: string | null;
  issuer: string | null;
  rawText: string;
}

export interface ScanReport {
  facts: FileFacts;
  hits: Hit[];
  labs: LabId[];
  verdict: "clean" | "metadata" | "pixel" | "mixed";
  summary: string;
  strings: string[];
  spectrum: SpectrumFeatures | null;
  visible: VisibleMark[];
  c2paPresent: boolean;
  c2pa: C2paValidation | null;
  attribution: AttributionCandidate[];
  metadataPresent: boolean;
  scannedAt: number;
}

export interface ScanProgress {
  step: string;
  pct: number;
}

