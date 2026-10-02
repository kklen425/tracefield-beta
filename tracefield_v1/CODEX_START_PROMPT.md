# Paste this into Codex

Read `AGENTS.md` and `CODEX_HANDOFF.md` completely before changing code.

Take ownership of TRACEFIELD end-to-end. Do not redesign the product. Preserve the original TRACEFIELD forensic/lab UI and information hierarchy shown in `reference/original-built.png` and `reference/original-public-build.zip`.

Implement the current product target described in the handoff:

- Free: 5 analyses/month, server-enforced
- Plus: HK$10/month
- local-first image attribution and provenance evidence
- paragraph/text AI analysis with honest confidence handling
- PDF text extraction + selected-text analysis + PDF metadata/provenance
- Clean / Export for ordinary metadata/privacy cleaning, before/after and re-scan
- Better Auth + Neon + Stripe server-side entitlement
- history/reports/batch for Plus where specified
- cheapest reliable beta deployment

Work autonomously: inspect the current source, install dependencies, migrate legacy Creator/Studio code, implement, run tests/typecheck/build, drive browser QA on desktop and mobile, fix failures, deploy a public beta, and verify the public deployment yourself.

Do not stop after a plan or a partial UI. Continue until the Definition of Done in `CODEX_HANDOFF.md` is satisfied as far as the available credentials/tools permit. If a credential is truly missing, complete and test every independent part first and leave one precise blocker with exact required action.
