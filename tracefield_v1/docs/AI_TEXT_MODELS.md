# AI text scores and Turnitin report import — 2026-11-03

Open the personal edition and select TEXT, WORD or PDF. Paste text, open a modern Word `.docx`, or extract a selectable-text PDF. Choose **Analyze AI percentage** for the local classifier or **Quick style analysis** for the original lightweight heuristic. Legacy binary `.doc` needs conversion to `.docx`; scanned PDF OCR remains deferred.

## Repository/model decision

- [Fakespot ApolloDFT](https://github.com/fakespot-ai/apollodft): Apache-2.0 research and supervised RoBERTa classifier. This is the supervised component, not the full proprietary Apollo ensemble.
- [Official model](https://huggingface.co/fakespot-ai/roberta-base-ai-text-detection-v1): English model, labels Human=0 / AI=1. Its model card explicitly distinguishes likelihood from the proportion of AI-written text.
- [Browser int8 conversion](https://huggingface.co/hbhanushali/fakespot-ai-detector-onnx): Apache-2.0, pinned revision `e2fddfefe101446f4626061424e156c9058092e0`, approximately 125 MB. Third-party conversion, not an official Fakespot browser release.
- [Transformers.js](https://github.com/huggingface/transformers.js): Apache-2.0 runtime; one-thread WASM in a dedicated worker. Model and runtime are lazy-loaded. Hugging Face model requests reveal ordinary request metadata, not the input text.
- [Mammoth.js](https://github.com/mwilliamson/mammoth.js): BSD-2-Clause Word raw-text extraction in a worker. No generated HTML is inserted into the page. Word inputs are limited to 10 MB and extraction has a 30-second timeout; extracted text limit is 500,000 characters.
- Alternatives reviewed: [LLMSniff](https://github.com/Thanos3G/LLMSniff), MIT, desktop Python and up to 1.9 GB model downloads; [TinyDetect](https://github.com/ritabratamaiti/tinydetect), custom compressed/tuned inference and tokenizer. Neither is copied into the app. Larger models/full Apollo ensemble were rejected for this browser/free-host architecture.

## Score interpretation and diagnostic result

The model is **experimental and uncalibrated**. No measured AI-authorship percentage or Turnitin prediction is claimed. All selected text is split into token-bounded windows (at most 500 tokens), and the displayed AI model score is the word-weighted mean classifier output. The separate flagged-word share counts words inside windows scoring at least 80%; it is a threshold statistic, not verified authorship. Minimum 50 words; maximum 50,000 characters. Unsupported-language and over-limit inputs produce an error rather than silent truncation. Under 300 words remains very low confidence.

Before release, `node --experimental-strip-types scripts/model-benchmark.mjs` ran five diagnostic fixtures on the pinned model. Two 240-word public-domain human excerpts (Austen and Darwin) scored approximately 84% and 90% AI: **both false positives** at the 80% threshold. The 215-word assistant-generated fixture scored approximately 99.99%, a mixed fixture approximately 99.83%, and a lightly edited AI fixture approximately 99.90%. The mixed result does not recover the known 50/50 composition. These cases expose limitations; they do not establish accuracy on essays, current generators, translated/non-native writing or adversarial editing. This finding is disclosed in every model result. Source/provenance and actual timings are written to ignored `qa-output/model-benchmark.json`; no corpus is silently used for training.

## Turnitin

The user selected open-source detection plus imported reports rather than licensed integration. [Turnitin's official API limitation](https://helpcenter.turnitin.com/hc/en-us/articles/49302416618637-How-do-I-display-and-access-the-AI-Writing-score-in-a-custom-API-integration) states that AI scores cannot be pulled directly via the API, even with an AI Writing licence; authorised users access them through the document viewer.

The panel imports an existing AI Writing Report PDF or pasted report header, extracts a clearly labelled overall AI score, preserves an asterisk as suppressed/unknown, rejects ambiguous scores and never substitutes a Similarity percentage. It does not run Turnitin, authenticate a report, prove that it belongs to the current document, or upload a submission. Imported results have a separate export with the source PDF hash where available. A synthetic local QA fixture exercises parsing and is explicitly labelled unauthentic.

Existing detector limitations and protections remain. No paid AI API, new service, public subscription bypass or uploaded original document is required. Personal history stays local; commercial summaries remain opt-in and server-protected.
