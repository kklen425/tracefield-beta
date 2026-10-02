# TRACEFIELD

Public beta: https://tracefield-beta.onrender.com · Source: https://github.com/kklen425/tracefield-beta/tree/codex/tracefield-beta

Identify what made it. See the evidence. Clean what you share.

Dark, local-first image, text and PDF evidence workspace. React 19 / TanStack Start / Nitro Node server, Better Auth email/password, existing Neon Postgres, Stripe **test mode only**. No paid AI API is required.

## Run

Node 24 is recommended. `npm ci`, then `npm run dev` (http://localhost:8080). Without DATABASE_URL the development database is in-memory PGLite and resets when the server restarts. Create a disposable local account at /login. Never deploy that fallback: production startup requires persistent DATABASE_URL, BETTER_AUTH_SECRET and BETTER_AUTH_URL.

Set server secrets in a private environment file or hosting dashboard, using `.env.example` as a template. `node --env-file=.env.local scripts/migrate.mjs` applies idempotent, tracked migrations to Neon. Do not expose server secrets with a VITE_ prefix.

`npm run typecheck`, `npm test`, `npm run test:quota`, `npm run benchmark:text`, `npm run build`. `npm start` serves the built Node application on HOST / PORT. Database migration is a separate deployment step, not an implicit side effect of building frontend assets.

## Product

- IMAGE: visible local preview, full SHA-256, dimensions/MIME/size, provider/workflow evidence, EXIF/XMP/IPTC, official C2PA WASM reader and separate validation state, heuristic frequency field.
- TEXT: local worker, paragraph/article input, word count, experimental English style evidence and segment matches. **No calibrated AI probability or validated ML detector is currently shipped.**
- PDF: lazy-loaded PDF.js worker, selectable text extraction, pages/scope and editable selected-passage input, creator/producer/info/XMP separately. Scanned PDFs clearly explain that OCR is not implemented.
- Clean / Export: raster re-encoding to PNG/JPEG/WebP, before/after hash, size, ordinary metadata, local re-scan, cleaned download and JSON reports. Re-encoding can change colour profiles/transparency and does not guarantee removal of hidden provenance.
- Account: server-verified Better Auth sessions, Free 5 / Plus 300 completed jobs per UTC calendar month. Atomic Postgres function serializes per-account usage and job UUID retries do not double-charge. Page views/export/clean re-scan do not consume a new job.
- Plus: server-protected saved summaries/history and shareable scan receipts; small image batches (up to 5). No browser flag authorizes protected server endpoints.
- Billing: HK$10/month test Checkout (inline recurring price if no configured price ID), signed webhook, event deduplication, current subscription refresh and Billing Portal cancellation. No legacy sandbox payment-link fallback and no live keys accepted.

All computation is distributed to the browser. Raw local files/text are never posted to TRACEFIELD during normal scans. The server receives random job IDs for quota, identity/subscription state and only summaries explicitly saved. Shared report links expose the saved report to anyone who has its URL; these are client-generated receipts, not independent forensic certification. Metadata and text style can be forged. Users who modify frontend source can run open local algorithms independently; server access and account quota remain enforced.

## Deployment

`render.yaml` configures a **free Node web service** in the approved Ka kin's workspace. It reuses Neon; do not create a Render Postgres service. Build: `npm ci && npm run build && npm run db:migrate`. Start: `npm start`. Use a dedicated TRACEFIELD GitHub repository; do not overwrite unrelated projects. Render must have permission to read it.

Required runtime env: DATABASE_URL, BETTER_AUTH_SECRET (random 32+ bytes), BETTER_AUTH_URL and TRACEFIELD_APP_URL (exact public HTTPS origin). Stripe is optional for Free beta, but paid testing requires sk_test_ STRIPE_SECRET_KEY, whsec_ STRIPE_WEBHOOK_SECRET, optional STRIPE_PLUS_MONTHLY_PRICE_ID. Register /api/stripe/webhook for checkout.session.completed and customer.subscription.created/updated/deleted. Enable subscription cancellation in the test Billing Portal.

See docs/QA.md for measured results, docs/OPEN_SOURCE_REVIEW.md for licensing and selection, docs/DEPLOYMENT.md for outstanding access steps. A build passing is not evidence of a publicly verified deployment.
