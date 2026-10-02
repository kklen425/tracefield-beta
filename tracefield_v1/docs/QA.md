# TRACEFIELD beta QA — started October 2, 2026

Public beta: https://tracefield-beta.onrender.com

Repository: https://github.com/kklen425/tracefield-beta — codex/tracefield-beta. Public source access was owner-approved. Secrets and local fixtures are excluded from Git.

## Automated checks

TypeScript and production build pass. Product runner: **52 tests pass**, covering auth gate/sign-out, migrations, atomic writes, FFT, PNG metadata, provider strings, short-text uncertainty, input limits, official-reader-only C2PA state and Stripe signature tampering/expiry. The separate database suite verifies Free 5/sixth rejection, retry idempotency, month reset, concurrent cap and Plus 300/301st rejection using the same migration/function deployed to Neon. npm audit reported zero vulnerabilities after the compatible transitive fix.

Obsolete Grok host/PWA/template tests assume a removed deployment platform and are excluded; they are not reported as passing.

## Browser checks

The public production build was tested against the existing Neon database with disposable QA accounts. Original dark forensic preview/evidence hierarchy is retained.

| Area | Verified outcome |
|---|---|
| Images | JPEG preview/dimensions/hash/EXIF software and artist; synthetic tagged PNG demo; untagged PNG/WebP and 4000×3000 JPEG in Plus batch; unsupported TXT rejected |
| C2PA | Official contentauth signed C.jpg parsed locally; SDK Valid state, generator, signer, assertions and signature/data-hash successes; untrusted test certificate and skipped OCSP distinguish validity from trust |
| Text | Short sample uncertain; 100-word narrative and 648-word synthetic mixed/style fixture processed in worker; low-confidence results, explanatory highlights, no calibrated probability |
| PDF | Three-page selectable PDF with metadata/page selection/analysis; scanned PDF explains OCR Phase 2; corrupt PDF rejected; 31 MB rejected; no-Info PDF extracted without author/creator claims; keyboard selection reduced input to chosen excerpt |
| Clean | Before/after size/hash/ordinary metadata show software, artist or synthetic tags removed; local re-scan retains heuristic signals; quota unchanged |
| Account | Signup/persistent Neon session, public login/logout, anonymous local preview requiring sign-in; one charge per completed job; public sixth Free job blocked |
| Plus | Three-image batch charges three jobs; private summary persisted; public stored receipt renders file/integrity hashes and limitations |
| Responsive | Actual innerWidth 1440/1280/768/390; documentWidth 1425/1265/753/375 (scrollbar), no horizontal overflow after header fix; saved screenshots qa-output/public-{width}.jpg |
| Console | No critical application errors during normal scan/batch flow; corrupt PDF is a controlled message |

## Real Stripe sandbox integration

HKD1000/month hosted Checkout completed with official test card data. The webhook activated Plus and the public account showed 5/300. Replaying the signed test event twice produced one stored event; forged signature returned 400. An attach-then-decline PaymentMethod and trial-ending renewal produced past_due; the database recorded it and the public site revoked Plus (10/5 after downgrade). Customer portal confirmed period-end cancellation. The disposable subscription was then canceled immediately. No live payment was enabled or charged.

## Explicit limits and outstanding verification

Text fixtures validate behavior, **not detector accuracy**. No model or representative labelled benchmark corpus was selected. Human/AI/edited/mixed/non-native classification accuracy remains unestablished; a JSONL benchmark harness is provided for future provenance-labelled evaluation. OCR and PDF signature validation are not shipped.

Connected in-app browser download APIs timed out although cleaned copies rendered and hashes/metadata changed correctly. Standard local Blob downloads are implemented, with a persistent Clean link and attached report anchors. Actual saved download bytes are not yet independently verified; this case remains open. Exports do not consume quota.

C2PA WASM is about 9 MB uncompressed/3.4 MB gzip and lazy-loaded. Remote credential/revocation retrieval is disabled for privacy. Large raster decoding can consume substantial browser memory. Clean limits 40 megapixels; PDF limits 30 MB/300 pages/500,000 characters. Free Render cold starts and allowances remain beta limitations.
