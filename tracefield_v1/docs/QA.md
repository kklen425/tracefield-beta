# QA record — October 2, 2026

Production build and TypeScript check pass. Product test runner passes 50 tests: auth gate/sign-out, migration planning, atomic writes, FFT, PNG metadata, provider signatures, short-text uncertainty and input limits. Legacy platform-template tests are not part of the product runner; they assume the removed Grok deployment/PWA environment.

Browser verification uses the actual production Node build with the existing Neon database and a disposable QA account. Sign-up and persistent session succeeded. A three-page selectable PDF extracted locally, retained its metadata and SHA-256, allowed page selection and analyzed the selected passage with explicit low-confidence warning. Its completed analysis incremented server usage. The official contentauth C2PA signed JPEG fixture returned `valid`, including its generator and test signing certificate. Provider attribution remained unknown when insufficient provider-specific evidence existed.

Local browser checks also verified visible synthetic PNG sample preview, metadata-based Google attribution, ordinary Clean/re-scan with a changed hash and removal of editable tags, and short text returning Mixed / uncertain. Clean/re-scan did not consume another analysis job. Synthetic provider tags are workflow demos, not provider accuracy benchmarks.

Database quota test verifies five completed jobs, idempotent job retry and sixth-job rejection. Further responsive, download, format/error cases and payment checks must be recorded as they complete; do not interpret this initial record as all requested QA passing.

Text analysis is an experimental English style heuristic. No model or representative labelled corpus was selected, and no accuracy claim is made. The external JSONL benchmark harness accepts provenance-labelled human, AI, edited, mixed and non-native examples; smoke fixtures are not a scientific benchmark.

Pending before claiming full readiness: public deployment reachability; responsive widths; exported download validation; comprehensive format/error matrix; Stripe test checkout, signature delivery, activation, cancellation and failed-payment integration. OCR is deliberately Phase 2.
