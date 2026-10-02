import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MethodsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-bg/70" aria-label="Close methods" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="methods-title" className="relative z-10 flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-bg-elevated shadow-[var(--shadow-border)]">
        <div className="flex items-start justify-between gap-4 px-6 py-5 sm:px-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-subtle">Evidence before conclusions</p>
            <h2 id="methods-title" className="mt-1 font-display text-3xl text-fg">Methods</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close"><X /> Close</Button>
        </div>

        <div className="space-y-6 overflow-y-auto px-6 pb-8 text-sm leading-relaxed text-muted sm:px-8">
          <section>
            <h3 className="mb-1 font-medium text-fg">1 · Signed/open provenance first</h3>
            <p>
              TRACEFIELD inspects C2PA Content Credentials, JUMBF/container markers, EXIF/XMP/IPTC, PNG workflow text,
              PDF creator/producer fields and other file-level provenance. When the standards-based C2PA validator is
              available, its validation state is shown separately from heuristic clues.
            </p>
          </section>
          <section>
            <h3 className="mb-1 font-medium text-fg">2 · Provider attribution is evidence-ranked</h3>
            <p>
              Direct model, generator, workflow or issuer strings can point to OpenAI, Google, Adobe, Midjourney,
              Black Forest Labs/FLUX, ComfyUI and other toolchains. TRACEFIELD ranks those observed signals and shows
              the evidence. The evidence score is not a probability and a missing signal is not proof of human origin.
            </p>
          </section>
          <section>
            <h3 className="mb-1 font-medium text-fg">3 · Pixel analysis stays clearly heuristic</h3>
            <p>
              Raster images also get a local frequency-field pass. Repeated spectral structure can be useful forensic
              context, but TRACEFIELD does not label that signal as SynthID or another proprietary watermark unless a
              direct provider signal supports the attribution. Official watermark verification remains provider-specific.
            </p>
          </section>
          <section>
            <h3 className="mb-1 font-medium text-fg">4 · Multi-format support</h3>
            <p>
              Deep image analysis currently targets JPEG, PNG, WebP, GIF and AVIF. PDF plus several video/audio
              containers can be checked for file-level provenance and Content Credentials. Media-specific signal
              analysis is being added incrementally rather than pretending every format uses the same detector.
            </p>
          </section>
          <section>
            <h3 className="mb-1 font-medium text-fg">5 · Privacy and paid workspace</h3>
            <p>
              The raw file stays in the browser during the free scan. Paid history and report endpoints run on the
              server and verify the signed-in subscription before writing data. Only the hash and scan summary you
              explicitly save are stored; changing browser UI code does not grant those server services.
            </p>
          </section>
          <section>
            <h3 className="mb-1 font-medium text-fg">Limits</h3>
            <p>
              Provenance can be absent, damaged, stripped by ordinary re-encoding, or use a watermark that TRACEFIELD
              cannot officially verify. Treat results as documented evidence, not a blanket authenticity verdict.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
