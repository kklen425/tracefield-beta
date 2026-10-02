# TRACEFIELD — Codex handoff

## 1. What TRACEFIELD is

TRACEFIELD is a local-first forensic workspace for answering three practical questions:

1. **Images:** Which AI/provider/workflow most likely created or touched this image, and what evidence supports that conclusion?
2. **Text/PDF:** Does this text show statistical/linguistic patterns consistent with AI-generated writing, with uncertainty clearly shown?
3. **Clean / Export:** What ordinary metadata/privacy information can be removed before sharing, and what provenance evidence remains afterward?

Core product line:

> **Identify what made it. See the evidence. Clean what you share.**

The product is intended to be extremely cheap for consumers and cheap to operate.

---

## 2. The UI must look like the original TRACEFIELD

The user explicitly rejected generic AI-SaaS redesigns. Do not add a giant hero, gradient pricing cards, decorative chat-like panels, oversized rounded cards, or a marketing-first landing layout.

Use the supplied reference under `reference/original-built.png` and the original public build under `reference/original-public-build.zip` as the visual and information-architecture reference.

Keep the original workflow and density:

- dark forensic/lab visual language
- compact top header
- left: selected asset preview + file facts
- right: `01 Identify`
- evidence cards with evidence strength/confidence
- `02 Frequency field`
- `03 Clear` / Clean workspace
- filename, dimensions where available, file size, SHA-256
- evidence-first presentation rather than a single unexplained percentage

The new Text and PDF modes should feel like additional TRACEFIELD instruments, not separate products.

Suggested top-level mode switch:

- IMAGE
- TEXT
- PDF

Do not disturb the original image layout when adding modes.

---

## 3. Pricing and growth model

### Free — HK$0

- 5 analyses per month per account
- basic image source attribution
- basic paragraph/text AI analysis
- basic PDF text extraction / selected paragraph analysis
- C2PA / metadata evidence where available
- frequency field for raster images
- image preview
- basic Clean / Export

The goal is acquisition, not monetizing the first interaction.

### Plus — HK$10/month

Target: very low-friction consumer price.

Plus should feel obviously worth more than HK$10:

- 200–300 analyses/month initially
- full image attribution evidence
- text AI analysis with sentence/segment highlighting
- PDF full-document and selected-text analysis
- PDF producer/creator/XMP/provenance metadata
- scan history
- saved reports
- before/after Clean comparison
- JSON export
- batch processing (small batch is enough for v1)
- larger file limits

Optional annual price: **HK$100/year** if implementation is simple and does not complicate launch.

### Do not use the old pricing as the main product

The source still contains legacy:

- Creator HK$39/month
- Studio HK$99/month
- plan values `creator` / `studio`

Migrate the commercial UI and server logic to **Free + Plus**. If backwards compatibility is needed, map legacy active paid plans to Plus until manually migrated. There are no known real production paid users yet, so favor a clean schema migration over carrying unnecessary plan complexity.

---

## 4. Image mode requirements

### Supported inputs

At minimum:

- JPEG
- PNG
- WebP

Nice-to-have after core works:

- AVIF
- HEIC/HEIF where browser support/library support permits
- TIFF

### Show selected image

This has been a repeated user complaint. Once an image is selected, the actual local image must visibly render in the main left preview area. Never show only a filename/results while hiding the selected asset.

### File facts

Show:

- filename
- MIME
- size
- pixel dimensions
- SHA-256
- scan time

### Attribution targets

Use evidence-led provider/workflow attribution for at least:

- OpenAI / ChatGPT / DALL·E / GPT Image
- Google Gemini / Imagen
- Midjourney
- Adobe Firefly
- Black Forest Labs / FLUX
- Stability AI / Stable Diffusion / SDXL
- ByteDance / Seedream / Seedance
- MiniMax / Hailuo
- ComfyUI
- AUTOMATIC1111
- Canva
- Microsoft Designer / Copilot / Bing Image Creator

### Evidence types

Structure evidence rather than raw regex dumping:

- C2PA / Content Credentials claim
- EXIF / XMP / PNG textual chunks
- software / creator / producer tags
- known generator/workflow strings
- container signatures
- raster/frequency observations
- pixel-level heuristics

Every evidence card should have:

- source/type
- human-readable detail
- strength/confidence
- whether it is direct provenance vs heuristic

### C2PA

Prefer official/standards-based validation using the Coalition for Content Provenance and Authenticity tooling if practical in-browser. Preserve local-first behavior.

Do not equate missing C2PA with human origin.

### SynthID

Do not label generic FFT/frequency anomalies as SynthID detection. SynthID is proprietary. If only marker text is found, say marker text was found. If no official/validated method exists, say TRACEFIELD cannot reliably verify SynthID.

---

## 5. Text mode requirements

The user wants to paste even a paragraph and scan it.

### Input

- paste/type text
- clear button
- word count
- character count

### Results

Return:

- `Likely AI`, `Mixed / uncertain`, or `Likely human-written`
- a numeric likelihood only if calibrated enough to be meaningful
- confidence separate from likelihood
- short explanation of evidence
- sentence/segment highlighting if possible

### Short-text handling

Small samples are intrinsically unreliable. Do not fake precision.

Suggested behavior:

- under 50 words: run if technically possible, but show **Very low confidence** warning
- 50–99 words: **Low confidence**
- 100+ words: normal analysis

Example copy:

> Short passages are harder to classify reliably. Treat this result as a weak signal, not proof.

### Detection approach

Do not burn money on a paid LLM call per scan for v1. Prioritize cheap/local or open methods and architecture that can be upgraded later.

A defensible v1 may combine:

- lexical/statistical features
- repetition/burstiness proxies
- sentence-length variance
- punctuation/style patterns
- model/classifier only if it can run affordably and has measurable validation

If a robust local/open classifier is not achievable, ship a clearly labeled **experimental** detector rather than pretending certainty.

Include a benchmark/test harness with human + known AI corpora so claims can be measured.

---

## 6. PDF mode requirements

### v1 scope

Support PDFs with a selectable text layer.

Use browser-side PDF parsing (for example PDF.js) to:

- extract text locally
- display pages/text
- allow full-document analysis
- allow a user to select/copy a paragraph and analyze only that selection
- show word counts and page scope

### PDF provenance

Also inspect:

- Creator
- Producer
- creation/modification metadata
- XMP
- embedded provenance/container clues where available

Separate **document provenance metadata** from **AI-writing likelihood** in the UI.

### Scanned-image PDF

Do not block launch on OCR. Make OCR a phase-2 feature. If implemented later, prefer on-device/browser OCR or otherwise clearly disclose upload/processing.

---

## 7. Clean / Export requirements

Keep the original `Clear` concept but make the product wording understandable, for example `Clean / Export` while preserving the original TRACEFIELD visual language.

Allowed useful functionality:

- strip ordinary EXIF
- strip XMP
- strip comments
- strip software/creator tags when they are ordinary metadata
- remove embedded thumbnail metadata where practical
- raster decode + re-encode to JPEG/PNG/WebP
- format conversion
- before/after metadata comparison
- before/after file size/hash
- re-scan the exported copy and show what evidence remains

Do **not** claim:

- guaranteed SynthID removal
- guaranteed hidden AI-watermark removal
- guaranteed C2PA/provenance defeat
- “undetectable AI”

Use truthful copy such as:

> Ordinary metadata was cleaned. Hidden provenance signals may still remain. TRACEFIELD re-scans the exported copy and shows what it can still observe.

---

## 8. Privacy architecture

Default promise:

> **Your file stays on your device during the normal scan.**

Normal image/text/PDF scanning should execute in the browser wherever practical.

Server may receive/store:

- account identity
- plan/subscription state
- quota counters
- scan summary/history for Plus if the user saves a scan
- file hash
- provider result/confidence/evidence summary

Do not silently upload raw files.

A future “cloud verification” mode may upload, but only after explicit consent and with clear retention behavior.

Update Privacy/Terms to match actual behavior exactly.

---

## 9. Authentication and quota

Use the existing Better Auth integration unless there is a strong engineering reason to replace it.

### Free quota

- 5 completed analyses per calendar/billing month
- server-side account quota
- not `localStorage`
- clearing cookies/browser storage must not reset it
- use an atomic database operation so concurrent requests cannot exceed the limit

A completed analysis should consume one job. Navigating result tabs or exporting once from that same result should not consume another job.

### Plus quota

Start at 300 analyses/month unless implementation already supports another reasonable number. Keep the limit in one server-side configuration object so it is easy to change.

---

## 10. Database

A Neon Postgres project already exists and previously had these tables migrated successfully:

- `user`
- `session`
- `account`
- `verification`
- `tracefield_subscriptions`
- `tracefield_scan_history`
- `tracefield_verified_reports`
- `tracefield_monthly_usage`

Known Neon project identifier:

- project: `solitary-block-23171424`
- production branch previously used: `br-shy-scene-b4347m7j`
- database: `neondb`
- region: `us-east-2`

Do not hardcode credentials. Use `DATABASE_URL`.

### Schema migration target

The current schema uses `free|creator|studio`. Move toward `free|plus` cleanly. If retaining legacy plan values temporarily, normalize them server-side and clearly document the compatibility path.

`tracefield_verified_reports` is a legacy table name. It may remain if changing it would create unnecessary risk; the UI should call the feature a **scan report/receipt**, not independent forensic certification.

---

## 11. Stripe

Existing source includes Stripe Checkout and webhook handling. It also contains sandbox Creator/Studio IDs/links from the previous iteration.

Replace commercial plan configuration with:

- Plus monthly: HK$10/month
- optional Plus annual: HK$100/year

Environment variables should be renamed/cleaned up, e.g.:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PLUS_MONTHLY_PRICE_ID`
- optional `STRIPE_PLUS_ANNUAL_PRICE_ID`
- `TRACEFIELD_APP_URL`

Stripe webhook remains the authoritative paid-entitlement source.

Do not expose secret keys to the browser.

Do not enable live charging until test/sandbox checkout, webhook, cancellation and entitlement downgrade all pass.

---

## 12. Cheapest deployment target

Primary goal: public beta at the lowest possible ongoing cost.

Preferred architecture:

- frontend/full-stack host: cheapest reliable free/low-cost option available to the account
- Neon Postgres free/serverless tier
- Stripe pay-as-you-go
- browser-local analysis
- no paid AI API in the critical path

Render is already connected in the ChatGPT environment and a Render workspace exists. Vercel access was unreliable in the prior session. Prefer Render for beta if the full TanStack Start app can be hosted correctly there at no/low cost. If Render static hosting cannot support server auth/webhooks, deploy the full-stack service appropriately rather than splitting architecture incorrectly.

Do not use a Neon Function as the public frontend; that experiment proved unreliable.

Use a real public domain later. Do not block beta launch on buying a custom domain.

---

## 13. Existing source status

Current source already includes:

- TanStack Start / Vite / Nitro
- React 19
- Better Auth email/password
- Postgres/Neon support
- Stripe Checkout helper
- Stripe webhook route
- server entitlement code
- monthly usage counters
- image/container scan modules
- C2PA-related scan logic
- metadata parsing
- PNG/JPEG parsing
- frequency/FFT scan modules
- original TRACEFIELD UI components
- Privacy + Terms routes

Important current files:

- `src/components/trace/field-app.tsx`
- `src/lib/scan/*`
- `src/lib/account/entitlements.ts`
- `src/lib/billing/checkout.ts`
- `src/routes/api/stripe/webhook.ts`
- `src/lib/auth/*`
- `migrations/*`

Legacy pricing/UI remains in `field-app.tsx` and billing files and must be migrated.

A previous syntax/import pass found no obvious TypeScript syntax issues, but a full dependency install/build was blocked in the old environment by npm registry DNS. Codex must perform a real fresh install/build now rather than trusting that old check.

---

## 14. Implementation phases

### Phase A — stabilize current source

1. install dependencies
2. run tests/typecheck/build
3. remove Grok-specific dead scaffolding only if safe
4. confirm original image mode renders and functions
5. browser QA desktop + mobile

### Phase B — restore original UI faithfully

1. compare against `reference/original-built.png`
2. correct spacing, type scale, cards, preview dimensions and workflow
3. ensure selected image is always visible
4. do not replace original layout with a new design system

### Phase C — pricing/auth/quota migration

1. migrate plans to Free + Plus
2. implement 5/month free quota server-side
3. Plus HK$10/month sandbox checkout
4. webhook updates entitlement
5. cancellation/downgrade test

### Phase D — Text

1. add TEXT mode to original interface
2. paragraph paste/input
3. word-count confidence handling
4. experimental detector with documented limitations
5. segment highlighting
6. benchmark harness

### Phase E — PDF

1. browser PDF text extraction
2. whole-document + selection analysis
3. PDF metadata/provenance panel
4. preserve local-first default

### Phase F — Clean / Export

1. ordinary metadata clean
2. format export/re-encode
3. before/after view
4. re-scan clean copy
5. clear disclaimer on hidden provenance

### Phase G — paid value

1. Plus history
2. scan reports
3. small batch workflow
4. JSON export

### Phase H — deploy and verify

1. deploy public beta
2. public URL must load unauthenticated Free flow
3. verify auth
4. verify Stripe sandbox
5. verify webhook
6. verify quota
7. verify image/text/PDF paths
8. verify Clean export
9. mobile QA
10. no uncaught console errors

---

## 15. Acceptance tests

### Image

- select JPG -> preview appears immediately
- select PNG -> preview appears immediately
- filename/MIME/size/dimensions/hash are correct
- known OpenAI/ChatGPT image shows direct OpenAI/C2PA clues when actually present
- a screenshot/re-encoded image with no direct source data does not get a fabricated high-confidence provider attribution
- frequency view renders without claiming SynthID

### Text

- paste 30 words -> result runs or clearly explains low reliability
- paste 100+ words -> result + evidence + confidence
- sentence/segment highlighting does not break editing
- no claim of certainty

### PDF

- selectable-text PDF loads locally
- extracted text visible
- whole document analysis works
- selected paragraph analysis works
- creator/producer metadata shown separately
- PDF raw bytes are not uploaded by default

### Clean

- export downloads a valid image
- ordinary metadata is reduced/removed as intended
- before/after hash differs after re-encode
- re-scan result is shown
- UI does not promise hidden watermark removal

### Quota

- new free user starts at 5 monthly jobs
- completing a job decrements once
- tab changes do not decrement
- sixth job is blocked server-side
- localStorage/cookie edits do not grant more server quota
- Plus account receives Plus quota

### Billing

- sandbox monthly checkout succeeds
- webhook writes active Plus subscription
- server entitlement changes to Plus
- cancelled subscription downgrades according to period-end behavior
- UI alone cannot spoof Plus

### General

- desktop 1440px good
- laptop 1280px good
- mobile 390px no horizontal overflow
- production build renders, not only dev
- no uncaught browser errors
- Privacy and Terms reflect current behavior

---

## 16. What not to do

- Do not redesign TRACEFIELD into a generic AI-generated SaaS page.
- Do not hide the selected image.
- Do not create fake precision or “100% AI detected” language.
- Do not call FFT anomalies SynthID.
- Do not use browser-only paid entitlement.
- Do not use localStorage as the authoritative free quota.
- Do not silently upload user files.
- Do not put a paid external AI API in every scan unless unavoidable.
- Do not deploy the frontend from Neon Functions.
- Do not claim hidden AI watermark/provenance removal.
- Do not launch live Stripe charging before sandbox QA.

---

## 17. Definition of done

The job is complete only when:

1. original TRACEFIELD interface is recognizably preserved
2. image mode works end-to-end
3. text paragraph mode works with uncertainty handling
4. PDF text + metadata mode works for text-layer PDFs
5. Clean / Export works for ordinary metadata/privacy cleaning
6. Free 5/month is server-enforced
7. Plus HK$10/month sandbox subscription is server-enforced
8. full build/typecheck/tests pass
9. desktop + mobile browser QA pass
10. public beta URL loads and has been tested directly
11. documentation explains local-first privacy and detector limitations

When tradeoffs are necessary, prioritize reliability, truthfulness, original UI fidelity and low operating cost over adding more features.
