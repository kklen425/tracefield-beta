# TRACEFIELD current state before Codex pass

- Full source is present in this folder.
- Original visual reference is under `reference/`.
- Existing code still contains legacy Creator/Studio pricing and plan names.
- Existing image scanner already has modules for attribution, metadata, PNG/JPEG parsing, FFT/frequency analysis and C2PA-related evidence.
- Existing server code includes Better Auth, Stripe Checkout/webhook, Neon/Postgres and server-side entitlements/usage counters.
- Neon schema was previously migrated successfully in project `solitary-block-23171424` / database `neondb`.
- Prior public hosting attempts were unreliable because a Neon Function was incorrectly used as frontend and an old Vercel deployment disappeared.
- Render and GitHub connectors were later connected, but this handoff should let Codex choose the cheapest correct deployment architecture for the full-stack product.
- Current target pricing and features are defined only in `CODEX_HANDOFF.md`.
