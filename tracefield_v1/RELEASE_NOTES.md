# TRACEFIELD beta release — October 2026

- Preserved the original dark preview/evidence workspace with IMAGE, TEXT and PDF modes.
- Added local official C2PA parsing, metadata inspection, full hashes and privacy re-encoding.
- Added experimental writing evidence, local PDF extraction/page selection and JSON reports.
- Enforced Free 5 / Plus 300 monthly quotas in Postgres with idempotent completed-job accounting.
- Added private Plus history, stored summary receipts and small image batches.
- Deployed a free Render web service with existing Neon authentication and Stripe sandbox billing.
- Verified hosted test checkout, signed webhook replay, payment failure and cancellation. Billing recovery remains available after access revocation.
- Production build, TypeScript and 52 product tests pass. Browser coverage and explicit limitations are documented in docs/QA.md.

Text classification accuracy is unestablished. OCR, PDF signature verification and proprietary watermark removal are not included. Download verification remains open due to connected browser download timeouts.
