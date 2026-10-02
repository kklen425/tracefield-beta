import { fft2d } from "./fft";
import type { SpectrumFeatures } from "./types";

const N = 256;

export function analyzeSpectrum(image: ImageData): SpectrumFeatures {
  const src = toSquareGray(image, N);
  const re = new Float32Array(N * N);
  const im = new Float32Array(N * N);
  const green = toSquareChannel(image, N, 1);

  for (let i = 0; i < src.length; i++) {
    const y = (i / N) | 0;
    const x = i % N;
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * x) / (N - 1))) * 0.5 * (1 - Math.cos((2 * Math.PI * y) / (N - 1)));
    re[i] = (src[i] - 0.5) * w;
  }
  fft2d(re, im, N, false);

  const mag = new Float32Array(N * N);
  let magSum = 0;
  let magSq = 0;
  for (let i = 0; i < mag.length; i++) {
    const m = Math.hypot(re[i], im[i]);
    mag[i] = m;
    magSum += m;
    magSq += m * m;
  }
  const mean = magSum / mag.length;
  const variance = magSq / mag.length - mean * mean;
  const peakiness = mean > 1e-8 ? Math.sqrt(Math.max(variance, 0)) / mean : 0;

  let grid8 = 0;
  let gridCount = 0;
  const f8 = N / 8;
  for (const fx of [f8, N - f8]) {
    for (let y = 0; y < N; y++) {
      grid8 += mag[y * N + (fx | 0)];
      gridCount++;
    }
  }
  for (const fy of [f8, N - f8]) {
    for (let x = 0; x < N; x++) {
      grid8 += mag[(fy | 0) * N + x];
      gridCount++;
    }
  }
  grid8 = mean > 0 ? grid8 / gridCount / mean : 0;

  let mid = 0;
  let high = 0;
  let midN = 0;
  let highN = 0;
  const cx = N / 2;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const sy = y < cx ? y : y - N;
      const sx = x < cx ? x : x - N;
      const r = Math.hypot(sx, sy) / cx;
      const m = mag[y * N + x];
      if (r > 0.08 && r < 0.35) {
        mid += m;
        midN++;
      } else if (r >= 0.35 && r < 0.85) {
        high += m;
        highN++;
      }
    }
  }
  const midHighRatio = highN && midN ? mid / midN / (high / highN + 1e-8) : 1;

  let gEnergy = 0;
  let yEnergy = 0;
  for (let i = 0; i < src.length; i++) {
    const d = i ? src[i] - src[i - 1] : 0;
    const dg = i ? green[i] - green[i - 1] : 0;
    yEnergy += d * d;
    gEnergy += dg * dg;
  }
  const greenBias = yEnergy > 1e-8 ? gEnergy / yEnergy : 1;

  let phaseCoherence = 0;
  let pcN = 0;
  for (let y = 1; y < 24; y++) {
    for (let x = 1; x < 24; x++) {
      const a = Math.atan2(im[y * N + x], re[y * N + x]);
      const b = Math.atan2(im[x * N + y], re[x * N + y]);
      phaseCoherence += Math.abs(Math.cos(a - b));
      pcN++;
    }
  }
  phaseCoherence = pcN ? phaseCoherence / pcN : 0;

  const residualEnergy = residualAfterBlur(src, N, 2);

  const heatmap = renderHeatmap(mag, N);

  const notes: string[] = [];
  if (grid8 > 1.45) notes.push("8-pixel lattice energy is elevated (common VAE / diffusion grid).");
  if (midHighRatio > 1.35) notes.push("Mid-band energy sits above the high-frequency floor; this can occur after synthesis, filtering, compression, or other processing.");
  if (phaseCoherence > 0.62) notes.push("Low-frequency phase is unusually aligned across axes.");
  if (greenBias > 1.18) notes.push("Green-channel residual is stronger than luminance; treat this as a generic forensic anomaly, not a vendor watermark result.");
  if (peakiness > 2.4) notes.push("Spectrum is peaky rather than natural 1/f falloff.");
  if (!notes.length) notes.push("Radial spectrum looks close to a natural photograph on these heuristics.");

  return {
    size: N,
    grid8,
    peakiness,
    midHighRatio,
    greenBias,
    phaseCoherence,
    residualEnergy,
    heatmap,
    heatmapSize: N,
    notes,
  };
}

export function spectrumSuspicion(f: SpectrumFeatures): number {
  let s = 0;
  if (f.grid8 > 1.45) s += 0.22;
  if (f.grid8 > 1.8) s += 0.1;
  if (f.midHighRatio > 1.35) s += 0.22;
  if (f.midHighRatio > 1.7) s += 0.1;
  if (f.phaseCoherence > 0.62) s += 0.18;
  if (f.greenBias > 1.18) s += 0.12;
  if (f.peakiness > 2.4) s += 0.12;
  if (f.residualEnergy < 0.004) s += 0.08;
  return Math.min(1, s);
}

function toSquareGray(image: ImageData, n: number): Float32Array {
  const out = new Float32Array(n * n);
  const side = Math.min(image.width, image.height);
  const ox = ((image.width - side) / 2) | 0;
  const oy = ((image.height - side) / 2) | 0;
  const { data, width } = image;
  for (let y = 0; y < n; y++) {
    const sy = oy + Math.min(side - 1, ((y * side) / n) | 0);
    for (let x = 0; x < n; x++) {
      const sx = ox + Math.min(side - 1, ((x * side) / n) | 0);
      const i = (sy * width + sx) * 4;
      out[y * n + x] = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    }
  }
  return out;
}

function toSquareChannel(image: ImageData, n: number, ch: number): Float32Array {
  const out = new Float32Array(n * n);
  const side = Math.min(image.width, image.height);
  const ox = ((image.width - side) / 2) | 0;
  const oy = ((image.height - side) / 2) | 0;
  const { data, width } = image;
  for (let y = 0; y < n; y++) {
    const sy = oy + Math.min(side - 1, ((y * side) / n) | 0);
    for (let x = 0; x < n; x++) {
      const sx = ox + Math.min(side - 1, ((x * side) / n) | 0);
      out[y * n + x] = data[(sy * width + sx) * 4 + ch] / 255;
    }
  }
  return out;
}

function residualAfterBlur(src: Float32Array, n: number, sigma: number): number {
  const k = gaussianKernel(sigma);
  const tmp = new Float32Array(n * n);
  const r = (k.length / 2) | 0;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let acc = 0;
      for (let i = -r; i <= r; i++) {
        const xx = Math.min(n - 1, Math.max(0, x + i));
        acc += src[y * n + xx] * k[i + r];
      }
      tmp[y * n + x] = acc;
    }
  }
  let energy = 0;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let acc = 0;
      for (let i = -r; i <= r; i++) {
        const yy = Math.min(n - 1, Math.max(0, y + i));
        acc += tmp[yy * n + x] * k[i + r];
      }
      const d = src[y * n + x] - acc;
      energy += d * d;
    }
  }
  return energy / (n * n);
}

export function gaussianKernel(sigma: number): Float32Array {
  const r = Math.max(1, Math.ceil(sigma * 3));
  const k = new Float32Array(r * 2 + 1);
  let s = 0;
  for (let i = -r; i <= r; i++) {
    const v = Math.exp((-i * i) / (2 * sigma * sigma));
    k[i + r] = v;
    s += v;
  }
  for (let i = 0; i < k.length; i++) k[i] /= s;
  return k;
}

function renderHeatmap(mag: Float32Array, n: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(n * n * 4);
  let max = 0;
  const shifted = new Float32Array(n * n);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const sy = (y + n / 2) % n;
      const sx = (x + n / 2) % n;
      const v = Math.log(1 + mag[sy * n + sx]);
      shifted[y * n + x] = v;
      if (v > max) max = v;
    }
  }
  const inv = max > 0 ? 1 / max : 1;
  for (let i = 0; i < n * n; i++) {
    const t = Math.pow(shifted[i] * inv, 0.72);
    const o = i * 4;
    out[o] = (18 + t * 210) | 0;
    out[o + 1] = (20 + t * 190) | 0;
    out[o + 2] = (16 + t * 140) | 0;
    out[o + 3] = 255;
  }
  return out;
}
