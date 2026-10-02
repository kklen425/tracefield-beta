# Beta deployment

Dedicated public repository (owner-approved): https://github.com/kklen425/tracefield-beta

Target: Ka kin's workspace, free Render Node web service, Ohio; existing Neon Postgres project. The root render.yaml contains a reproducible configuration. Free Render instances sleep after inactivity; cold starts and free allowances are appropriate for a beta, not an availability guarantee.

Build: `cd tracefield_v1 && npm ci && npm run build && npm run db:migrate`

Start: `cd tracefield_v1 && npm start`

Set NPM_CONFIG_INCLUDE=dev so Render's production environment installs the build tools. A public Git URL without a connected GitHub installation may need manual deployment triggers even when the service reports auto-deploy enabled; confirm the deployed commit in Render after each push.

Set DATABASE_URL, BETTER_AUTH_SECRET (random strong secret), BETTER_AUTH_URL and TRACEFIELD_APP_URL (the assigned HTTPS service origin). Set NODE_ENV=production, HOST=0.0.0.0 and NODE_VERSION=24.14.0. Migrations are idempotent and preserve existing table names. Original files remain local; saved summaries are opt-in.

Billing remains test-only and fails closed without STRIPE_SECRET_KEY beginning sk_test_ and STRIPE_WEBHOOK_SECRET. Register /api/stripe/webhook for checkout.session.completed and customer.subscription.created/updated/deleted. The optional STRIPE_PLUS_MONTHLY_PRICE_ID must be a recurring HKD1000 test price; without it Checkout creates the same inline monthly price. Enable test customer portal subscription cancellation. Never set live keys without explicit owner approval.

Expected fixed infrastructure cost: HK$0/month while within Render and Neon free allowances. No paid inference APIs. Stripe test payments cost nothing; eventual live processing fees and free-tier overages are separate. Review [Render free limits](https://render.com/docs/free) and [Neon pricing](https://neon.com/pricing) before expanding traffic.

Release validation status and unverified cases are recorded in QA.md. Hosted Stripe sandbox checkout, signed webhook replay, payment failure, entitlement revocation and cancellation were exercised successfully. Live billing remains disabled.
