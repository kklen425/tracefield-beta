# LEGACY deployment notes — read CODEX_HANDOFF.md first

> This file documents the previous Creator/Studio iteration and contains stale pricing. The current product target is Free + Plus HK$10/month. `CODEX_HANDOFF.md` is authoritative.

# TRACEFIELD commercial deployment

This release is designed as a local-first scanner with server-enforced paid workspace features.

## Architecture

- **Browser/local:** raw-file scanning, SHA-256, open C2PA reading/validation, generator/workflow evidence extraction, raster frequency heuristics.
- **Server:** authentication, Stripe subscription entitlement, private saved history, scan receipts, plan usage limits.
- **Database:** Postgres/Neon. Do not use the in-memory PGLite fallback for production because serverless instances are ephemeral.
- **Payments:** Stripe Checkout. The checked-in fallback links are sandbox-only; production must provide live Stripe environment variables.

The default scan does **not** upload the raw file. A future cloud-verification feature must ask for explicit consent before any asset upload.

## Required production environment variables

Set these in the hosting provider; do not commit them to source control.

- `DATABASE_URL` — persistent Postgres connection string (Neon recommended).
- `BETTER_AUTH_SECRET` — long random secret for Better Auth.
- `BETTER_AUTH_URL` — exact public origin, for example `https://tracefield.example.com`.
- `TRACEFIELD_APP_URL` — same public origin; used for Stripe return URLs.
- `STRIPE_SECRET_KEY` — live Stripe secret key when accepting real money.
- `STRIPE_WEBHOOK_SECRET` — signing secret for the webhook endpoint below.
- `STRIPE_CREATOR_PRICE_ID` — live recurring HKD monthly price for Creator.
- `STRIPE_STUDIO_PRICE_ID` — live recurring HKD monthly price for Studio.

Optional:

- `VITE_AUTH_ENABLED=true` — explicit auth-on flag. Auth is already on when the shipped `VITE_AUTH_ENABLED=false` override is absent.

## Stripe setup

Create two recurring live prices:

- Creator — HK$39/month
- Studio — HK$99/month

Configure a Stripe webhook to:

`https://YOUR_DOMAIN/api/stripe/webhook`

Subscribe at minimum to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

The webhook writes the authoritative subscription state to `tracefield_subscriptions`. Protected server functions re-check this state; browser UI state alone never grants paid access.

## Database

The build/migration scripts apply the SQL files in `migrations/`.

Important tables include:

- Better Auth users/sessions/accounts
- `tracefield_subscriptions`
- `tracefield_scan_history`
- `tracefield_verified_reports` (scan receipts)

Production must use a persistent `DATABASE_URL`.

## Plan enforcement

Current server-enforced monthly limits:

- Creator: 500 saved scans + 100 scan receipts
- Studio: 5,000 saved scans + 1,000 scan receipts

The local free scanner remains useful without an account. This is intentional: the paid moat is persistent server value, account workflow, usage limits and later API/cloud verification, not a cosmetic browser-only toggle.

## Build

Normal build command:

`npm run build`

The script builds the TanStack Start/Nitro app and runs DB migrations.

## Production QA checklist

1. Create a fresh account with email/password.
2. Confirm a free account receives `free` entitlement and cannot write history/receipts.
3. Complete a Stripe test subscription and confirm webhook changes entitlement to Creator/Studio.
4. Cancel/update the subscription and confirm entitlement changes server-side.
5. Upload a JPEG/PNG with known C2PA and check manifest evidence.
6. Upload a PDF with known producer metadata and check container evidence.
7. Verify a saved scan receipt can be opened by URL and clearly states that it is a client-generated local scan receipt, not an independent server forensic certification.
8. Confirm raw file bytes never appear in server requests during the default local scan.
9. Check mobile layout, login, pricing, Privacy and Terms.

## Known release blocker in the current ChatGPT work session

The container could not reach `registry.npmjs.org` (`EAI_AGAIN`), so a full dependency install / production build could not be executed locally in this session. A TypeScript syntax/transpile pass across the source completed with zero syntax errors, and internal source imports were checked. Run the full build in connected CI/Vercel before production promotion.
