export type SaveOutcome = "shared" | "downloaded" | "cancelled" | "hold";

export function photoFilename(original: string | undefined, preset: string, mime: string): string {
  const base =
    (original ?? "image")
      .replace(/\.[^.]+$/, "")
      .replace(/[/\\?%*:|"<>]/g, "_")
      .trim()
      .slice(0, 80) || "image";
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  return `${base}_tracefield_${preset}.${ext}`;
}

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod|Android/i.test(ua)) return true;
  // iPadOS 13+ pretends to be a Mac.
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) return true;
  return navigator.maxTouchPoints > 1 && /Mobile/i.test(ua);
}

function isEmbedded(): boolean {
  try {
    return window.top !== window.self;
  } catch {
    return true;
  }
}

export function saveOnShareSheet(): boolean {
  return isMobile();
}

function canShareFile(file: File): boolean {
  try {
    return !!navigator.canShare?.({ files: [file] });
  } catch {
    return false;
  }
}

/** In-DOM anchor. A detached `a.click()` is ignored by iOS and some webviews. */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  window.setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 60_000);
}

/**
 * Save a cleaned still. Phones get the share sheet (the only reliable
 * “Save Image” path). Everywhere else uses a real download.
 * Returns "hold" when the browser may have swallowed the download — caller
 * should show a press-and-hold still.
 */
export async function savePhoto(blob: Blob, filename: string): Promise<SaveOutcome> {
  const type = blob.type || "image/jpeg";
  const file = new File([blob], filename, { type });
  const mobile = isMobile();
  const embedded = isEmbedded();

  if (canShareFile(file) && (mobile || embedded)) {
    try {
      await navigator.share({ files: [file], title: filename });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
    }
  }

  if (!mobile) {
    triggerDownload(blob, filename);
    return embedded ? "hold" : "downloaded";
  }

  triggerDownload(blob, filename);
  return "hold";
}
