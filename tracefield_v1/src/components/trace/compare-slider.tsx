import { useId } from "react";

export function CompareSlider({
  before,
  after,
  value,
  onChange,
}: {
  before: string;
  after: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const id = useId();
  const pct = Math.round(value * 100);

  return (
    <div className="relative overflow-hidden rounded-lg bg-bg-subtle shadow-[var(--shadow-border)]">
      <img src={before} alt="Original" className="photo block w-full" />
      <img
        src={after}
        alt="Cleaned"
        className="photo pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 w-px bg-primary"
        style={{ left: `${pct}%` }}
      />
      <label className="sr-only" htmlFor={id}>
        Compare original and cleaned
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={pct}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="absolute inset-0 cursor-ew-resize opacity-0"
      />
      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-between font-mono text-xs uppercase tracking-wider text-fg">
        <span className="rounded-sm bg-bg/80 px-2 py-1">Cleaned</span>
        <span className="rounded-sm bg-bg/80 px-2 py-1">Original</span>
      </div>
    </div>
  );
}
