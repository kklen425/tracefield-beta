import { useEffect, useRef } from "react";
import type { SpectrumFeatures } from "@/lib/scan/types";

export function SpectrumView({ spectrum }: { spectrum: SpectrumFeatures }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const n = spectrum.heatmapSize;
    canvas.width = n;
    canvas.height = n;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new ImageData(new Uint8ClampedArray(spectrum.heatmap), n, n);
    ctx.putImageData(img, 0, 0);
  }, [spectrum]);

  const stats = [
    { k: "8px lattice", v: spectrum.grid8.toFixed(2) },
    { k: "mid / high", v: spectrum.midHighRatio.toFixed(2) },
    { k: "phase", v: spectrum.phaseCoherence.toFixed(2) },
    { k: "green bias", v: spectrum.greenBias.toFixed(2) },
    { k: "peakiness", v: spectrum.peakiness.toFixed(2) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr]">
      <div className="overflow-hidden rounded-md bg-bg shadow-[var(--shadow-border)]">
        <canvas
          ref={ref}
          className="photo block aspect-square w-full"
          style={{ imageRendering: "pixelated" }}
          aria-label="Log-magnitude FFT heatmap"
        />
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs text-muted sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.k}>
              <dt className="text-subtle">{s.k}</dt>
              <dd className="text-fg tabular-nums">{s.v}</dd>
            </div>
          ))}
        </dl>
        <ul className="space-y-1.5 text-sm text-muted">
          {spectrum.notes.map((n) => (
            <li key={n} className="border-l border-border pl-3">
              {n}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
