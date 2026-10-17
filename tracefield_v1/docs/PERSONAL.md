# Personal edition

Open https://tracefield-beta.onrender.com/personal for all currently implemented tools without sign-in, billing or monthly analysis quotas. The route is public and is not an owner authentication mechanism.

Image provenance/C2PA, frequency views, image batches (up to five per batch), text, selectable-text PDF, metadata Clean/re-scan and JSON exports use the same local processing engines as the commercial edition. Existing file-size and memory-safety limits still apply.

History and reports are stored only in this browser under the versioned `tracefield.personal.records.v1` localStorage key. The interface exposes saved evidence and JSON exports, including a whole-history backup. Clearing browser site data removes this history. Reports can be shared as files; the personal edition does not publish server receipt URLs or synchronize across devices. Public account APIs still require authentication and paid entitlements.

No paid API or extra Render service is needed. Existing detector limitations apply: text analysis remains experimental, OCR/PDF signature verification is not implemented, and Clean does not guarantee hidden watermark removal.
