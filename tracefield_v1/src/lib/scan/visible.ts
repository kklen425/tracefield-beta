import type { VisibleMark } from "./types";

type Corner = VisibleMark["corner"];

export function findVisibleMarks(image: ImageData): VisibleMark[] {
  const { width: w, height: h, data } = image;
  const side = Math.max(48, Math.min(w, h) * 0.14) | 0;
  const global = stats(data, w, h, 0, 0, w, h);
  const corners: { id: Corner; x: number; y: number }[] = [
    { id: "tl", x: 0, y: 0 },
    { id: "tr", x: w - side, y: 0 },
    { id: "bl", x: 0, y: h - side },
    { id: "br", x: w - side, y: h - side },
  ];
  const out: VisibleMark[] = [];
  for (const c of corners) {
    const s = stats(data, w, h, c.x, c.y, side, side);
    const chromaLift = s.chroma - global.chroma;
    const contrastLift = s.contrast - global.contrast * 0.6;
    const score = chromaLift * 1.4 + Math.max(0, contrastLift) * 0.8 + s.inkBlob * 0.6;
    if (score > 28) {
      const reason =
        s.inkBlob > 18
          ? "Compact high-contrast glyph in the corner (vendor sparkle / wordmark)."
          : "Corner chroma is far above the rest of the frame.";
      out.push({ corner: c.id, score, reason });
    }
  }
  return out.sort((a, b) => b.score - a.score);
}

function stats(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  x0: number,
  y0: number,
  bw: number,
  bh: number,
) {
  let chroma = 0;
  let contrast = 0;
  let n = 0;
  let ink = 0;
  const x1 = Math.min(w, x0 + bw);
  const y1 = Math.min(h, y0 + bh);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      chroma += max - min;
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      contrast += Math.abs(lum - 128);
      if (max > 200 && max - min > 40) ink++;
      n++;
    }
  }
  n = Math.max(1, n);
  return {
    chroma: chroma / n,
    contrast: contrast / n,
    inkBlob: (ink / n) * 100,
  };
}
