import type { C2paValidation } from "./types";

import wasmSrc from '@contentauth/c2pa-web/resources/c2pa.wasm?url';

let modulePromise: Promise<C2paModule> | null = null;
let c2paPromise: Promise<unknown> | null = null;

type ReaderHandle = {
  manifestStore: () => Promise<unknown>;
  activeManifest?: () => Promise<unknown>;
  free: () => void | Promise<void>;
};

type C2paModule = {
  createC2pa: (options: { wasmSrc: string; settings: { verify: { remoteManifestFetch: boolean; ocspFetch:boolean } } }) => unknown | Promise<unknown>;
  Reader: {
    fromBlob: (c2pa: unknown, format: string, blob: Blob) => Promise<ReaderHandle | null>;
  };
};

async function getModule(): Promise<C2paModule> {
  if (!modulePromise) {
    modulePromise = import("@contentauth/c2pa-web") as Promise<C2paModule>;
  }
  return modulePromise;
}

async function getC2pa(mod: C2paModule): Promise<unknown> {
  if (!c2paPromise) c2paPromise = Promise.resolve(mod.createC2pa({ wasmSrc, settings: {verify:{remoteManifestFetch:false,ocspFetch:false}} }));
  return c2paPromise;
}

/**
 * Read and validate open C2PA / Content Credentials locally in the browser.
 * The file bytes are passed to the CAI WebAssembly reader; they are not sent to
 * TRACEFIELD's server. If the SDK CDN is unavailable, the caller can still run
 * the rest of the local evidence scan and this function reports that the
 * validator was unavailable instead of pretending that no manifest exists.
 */
export async function validateC2pa(file: File): Promise<C2paValidation> {
  const unavailable = result(false, false, "unknown");

  try {
    const mod = await getModule();
    const c2pa = await getC2pa(mod);
    const format = file.type || guessMime(file.name);
    const reader = await mod.Reader.fromBlob(c2pa, format, file);

    // The official SDK can return no reader when there is no C2PA manifest.
    // That means the validator worked and the manifest is absent; it is not a
    // validator failure.
    if (!reader) return result(true, false, "not-present");

    try {
      const store = await reader.manifestStore();
      const active = reader.activeManifest ? await safeActiveManifest(reader) : null;
      const rawText = safeStringify(store);
      const activeText = safeStringify(active);
      const combined = `${rawText}\n${activeText}`.slice(0, 600_000);
      const present = hasManifest(store, combined);

      return {
        checked: true,
        validatorAvailable: true,
        present,
        validationState: inferValidationState(store, present),
        activeManifest:
          pickString(store, ["active_manifest", "activeManifest", "active_manifest_label"]) ??
          pickString(active, ["label", "instance_id", "title"]),
        claimGenerator:
          pickString(active, ["claim_generator", "claimGenerator"]) ??
          pickFromText(combined, /(?:claim_generator|claimGenerator)["'\s:=-]+([^"'\n,}]{2,160})/i),
        issuer:
          pickString(active, ["issuer", "organization", "common_name"]) ??
          pickFromText(combined, /(?:issuer|organization|common_name)["'\s:=-]+([^"'\n,}]{2,160})/i),
        rawText: combined,
      };
    } finally {
      await reader.free();
    }
  } catch {
    return unavailable;
  }
}

function result(
  validatorAvailable: boolean,
  present: boolean,
  validationState: C2paValidation["validationState"],
): C2paValidation {
  return {
    checked: true,
    validatorAvailable,
    present,
    validationState,
    activeManifest: null,
    claimGenerator: null,
    issuer: null,
    rawText: "",
  };
}

async function safeActiveManifest(reader: ReaderHandle): Promise<unknown> {
  try {
    return reader.activeManifest ? await reader.activeManifest() : null;
  } catch {
    return null;
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2).slice(0, 600_000);
  } catch {
    return "";
  }
}

function hasManifest(store: unknown, raw: string): boolean {
  if (!store) return false;
  return Boolean((store as {active_manifest?:unknown}).active_manifest);
}

export function inferValidationState(store:unknown,present:boolean):C2paValidation['validationState'] {
 if(!present) return 'not-present';
 if(!store||typeof store!=='object')return 'unknown';
 const value=(store as Record<string,unknown>).validation_state;
 if(value==='Trusted')return 'trusted';
 if(value==='Valid')return 'valid';
 if(value==='Invalid')return 'invalid';
 return 'unknown';
}

function pickString(value: unknown, keys: string[]): string | null {
  if (!value || typeof value !== "object") return null;
  const stack: unknown[] = [value];
  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    for (const [key, child] of Object.entries(current as Record<string, unknown>)) {
      if (keys.includes(key) && typeof child === "string") return child.slice(0, 200);
      if (child && typeof child === "object") stack.push(child);
    }
  }
  return null;
}

function pickFromText(text: string, re: RegExp): string | null {
  return text.match(re)?.[1]?.trim().slice(0, 200) ?? null;
}

function guessMime(name: string): string {
  const ext = name.toLowerCase().split(".").pop();
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    avif: "image/avif",
    heic: "image/heic",
    heif: "image/heif",
    tif: "image/tiff",
    tiff: "image/tiff",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
  };
  return map[ext ?? ""] ?? "application/octet-stream";
}
