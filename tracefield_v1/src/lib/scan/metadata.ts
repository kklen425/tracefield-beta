import exifr from "exifr";

export interface MetaDump {
  software: string[];
  description: string[];
  make: string | null;
  model: string | null;
  digitalSourceType: string[];
  rawText: string;
  present: boolean;
  gps: { lat: number; lng: number } | null;
}

export async function readMetadata(file: File | ArrayBuffer): Promise<MetaDump> {
  const empty: MetaDump = {
    software: [],
    description: [],
    make: null,
    model: null,
    digitalSourceType: [],
    rawText: "",
    present: false,
    gps: null,
  };
  try {
    const parsed = await exifr.parse(file, {
      tiff: true,
      xmp: true,
      icc: false,
      iptc: true,
      jfif: true,
      ihdr: true,
      mergeOutput: true,
      reviveValues: true,
      translateKeys: true,
      translateValues: true,
    });
    if (!parsed || typeof parsed !== "object") return empty;
    const flat = flatten(parsed);
    const software = pick(flat, [
      "Software",
      "software",
      "CreatorTool",
      "creatorTool",
      "ProcessingSoftware",
      "Artist",
      "Model",
    ]);
    const description = pick(flat, [
      "ImageDescription",
      "Description",
      "Caption",
      "Comment",
      "UserComment",
      "XPComment",
      "parameters",
      "prompt",
      "workflow",
    ]);
    const digitalSourceType = pick(flat, [
      "DigitalSourceType",
      "digitalSourceType",
      "DigitalSourceFileType",
    ]);
    let gps: MetaDump["gps"] = null;
    const lat = Number((parsed as { latitude?: number }).latitude);
    const lng = Number((parsed as { longitude?: number }).longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) gps = { lat, lng };
    const rawText = Object.entries(flat)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    return {
      software,
      description,
      make: first(flat, ["Make", "make"]),
      model: first(flat, ["Model", "model"]),
      digitalSourceType,
      rawText,
      present: rawText.length > 0,
      gps,
    };
  } catch {
    return empty;
  }
}

function flatten(obj: unknown, prefix = "", depth = 0): Record<string, string> {
  const out: Record<string, string> = {};
  if (obj == null || depth > 6) return out;
  if (typeof obj !== "object") {
    if (prefix) out[prefix] = String(obj);
    return out;
  }
  if (Array.isArray(obj)) {
    obj.slice(0, 20).forEach((v, i) => Object.assign(out, flatten(v, `${prefix}[${i}]`, depth + 1)));
    return out;
  }
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") Object.assign(out, flatten(v, key, depth + 1));
    else if (v != null && String(v).length) out[key] = String(v);
  }
  return out;
}

function pick(flat: Record<string, string>, keys: string[]): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(flat)) {
    if (keys.some((key) => k === key || k.endsWith(`.${key}`))) out.push(v);
  }
  return unique(out);
}

function first(flat: Record<string, string>, keys: string[]): string | null {
  const p = pick(flat, keys);
  return p[0] ?? null;
}

function unique(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}
