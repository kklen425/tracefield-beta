# TRACEFIELD secure commercial beta — release notes

## Added

- Server-side Better Auth account layer with standalone email/password sign-up/sign-in.
- Server-authoritative Stripe subscription entitlement flow.
- Stripe webhook signature validation and subscription synchronization.
- Persistent Postgres schema for subscriptions, private history and public scan receipts.
- Server-enforced Creator/Studio monthly usage limits.
- Local-first multi-format intake for raster images, PDF, common video/audio containers, SVG/TIFF/HEIC container evidence.
- Open C2PA / Content Credentials validation through the official CAI web SDK loaded in-browser.
- Evidence-ranked AI source attribution with separate model/provider versus workflow/platform lanes.
- Corrected attribution taxonomy for FLUX/Black Forest Labs and Hailuo/MiniMax.
- Privacy and Terms pages.

## Changed

- Product positioning is now AI source attribution + provenance, not a generic opaque AI percentage.
- Generic FFT/frequency results are explicitly forensic heuristics, never presented as an official SynthID detector.
- Public report language is now “scan receipt”; it does not claim independent server forensic verification of a client-side scan.

## Removed

- Old DeSynth / reverse-SynthID / provenance-removal code from the commercial source tree.
- Any commercial UI promising to strip or defeat hidden provenance watermarks.

## Next product work

- Local batch queue with server-backed batch history.
- C2PA action/ingredient timeline.
- Original-vs-repost comparison to show which provenance signals survived normal platform processing.
- Explicit opt-in provider verification bridge where official APIs are available.
- Studio API keys, cloud projects and team workspaces.
- Exportable PDF/JSON evidence reports with a server-verified cloud-scan option for customers who explicitly consent to upload.
