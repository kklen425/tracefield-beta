# TRACEFIELD — Codex project instructions

Read `CODEX_HANDOFF.md` before making changes. It is the product and implementation source of truth.

## Mission
Ship TRACEFIELD as a cheap, trustworthy, local-first forensic utility for images, text and PDFs. The product should be useful enough to attract a large number of users while keeping infrastructure cost close to zero at early scale.

## Non-negotiables

1. **Preserve the original TRACEFIELD interface language and workflow.** Do not redesign it into a generic AI SaaS landing page. Use the supplied reference screenshot/build under `reference/`.
2. **Local-first by default.** Raw user files should stay in the browser for normal scanning unless a feature explicitly requires upload and obtains clear consent.
3. **Truthful evidence, not overclaiming.** Show evidence and confidence. Missing signals do not prove human origin. Frequency anomalies are not proof of SynthID. AI-text detection is probabilistic and must disclose uncertainty.
4. **No fake paywall.** Paid entitlements and usage limits must be enforced server-side against the database. Browser state alone never grants paid access.
5. **Cheapest viable infrastructure.** Prefer browser compute, free/low-cost hosting, Neon free/serverless Postgres, and Stripe pay-as-you-go. Avoid paid AI APIs unless a feature genuinely needs them.
6. **Current commercial plan:** Free + Plus. Legacy Creator/Studio code is not the target product model.
7. **Plus pricing:** HK$10/month. Add HK$100/year only if Stripe annual billing is straightforward. Do not create a lifetime plan unless the user later asks.
8. **Free allowance:** 5 analyses per month per account. Define one analysis as one completed file/text job, not each tab click or re-render. A job may include preview, evidence views and one local clean/export without consuming additional quota.
9. **No deceptive watermark claims.** `Clean / Export` may remove ordinary EXIF/XMP/comments/software tags, embedded thumbnails and re-encode files, then re-scan the result. Do not claim guaranteed removal of SynthID, C2PA or hidden provenance watermarks and do not optimize specifically to defeat them.
10. **No user QA handoff.** Build, run, test and browser-verify the product yourself before claiming it works.

## Engineering expectations

- Work in small coherent commits.
- Keep security-sensitive logic server-side.
- Never commit secrets.
- Run typecheck, tests and production build.
- Run browser QA at desktop and mobile widths.
- Fix console errors and failed asset loads before finishing.
- Preserve `privacy` and `terms` routes and update them when product behavior changes.

## Priority order

1. Restore original TRACEFIELD UI faithfully.
2. Make image scan + preview + evidence robust.
3. Add paragraph/text AI analysis.
4. Add PDF text extraction + selected-text analysis + PDF metadata/provenance.
5. Implement Free 5/month + Plus HK$10/month server-side entitlement.
6. Implement history/reporting for Plus.
7. Implement Clean / Export + before/after re-scan.
8. Deploy to the cheapest reliable public host and verify the public URL.

