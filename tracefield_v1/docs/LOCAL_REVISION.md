# Local translation and English revision — 2026-11-03

The personal edition's TEXT, WORD and PDF workspaces contain **Translate & revise**. There is no OpenAI dependency, API key, paid inference service or original-text upload.

## Workflow

1. Paste a passage or extract it from DOCX/PDF above.
2. Choose **Clearer English** for conservative phrase edits, **Translate to 繁體中文**, or **English → 繁體中文 → English**.
3. Edit the Chinese before translating back, or edit the returned English directly.
4. Review the captured original and quality flags. Choose **Compare AI model scores** to measure the actual before/after values when both texts have at least 50 words.
5. Copy/download the text, export the revision comparison JSON, or choose **Use revised English** to place it in the analyzer. The original source file is not modified. Changes to the analyzer passage cannot be silently overwritten by a stale draft.

Translation and comparison run in a cancellable worker. Browser model caches avoid repeated weight downloads. Initial translation weights total approximately 226 MB (~230 MB shown in the UI), plus tokenizers and runtime. Detector comparison uses the existing ~125 MB model. Long passages can take substantial time on a phone. Input limit is 20,000 characters per pass, with token-bounded chunks and original newline separators; oversize or apparently truncated output fails rather than silently skipping text. Word/PDF page formatting is not recreated.

## Sources and licences

- [Helsinki-NLP OPUS-MT repository](https://github.com/Helsinki-NLP/Opus-MT), MIT code. Original translation weights have their own licences and attribution requirements.
- [Xenova/opus-mt-en-zh](https://huggingface.co/Xenova/opus-mt-en-zh), revision `046f55aec303cdee3e0318604406d4df20f1e8ea`, quantized ONNX conversion of [Helsinki-NLP/opus-mt-en-zh](https://huggingface.co/Helsinki-NLP/opus-mt-en-zh) (upstream card Apache-2.0).
- [Xenova/opus-mt-zh-en](https://huggingface.co/Xenova/opus-mt-zh-en), revision `39d480d52a9ea3065a1f117adfe4dbc55de10e6f`, quantized ONNX conversion of [Helsinki-NLP/opus-mt-zh-en](https://huggingface.co/Helsinki-NLP/opus-mt-zh-en) (CC BY 4.0). Attribution: Helsinki-NLP, University of Helsinki/OPUS-MT contributors; ONNX conversion by Xenova. The selected models are downloaded from the named publisher, not redistributed in this repository. Script conversion and text editing are identified in exports/documentation.
- [OpenCC.js](https://github.com/nk2028/opencc-js) 1.4.2, MIT runtime with separately attributed dictionary data. Converts simplified model output to Hong Kong Traditional Chinese, and normalizes the reverse input for the bilingual model. MIT/dictionary/Apache notices retained in public/licenses.
- Existing [Transformers.js](https://github.com/huggingface/transformers.js), Apache-2.0, provides local ONNX inference. Its Marian tokenizer currently warns that its fast implementation can differ from the original.

## Quality and detector limitations

This is a draft editor, not a guaranteed grammar, fidelity or detector-evasion service. The plain-English option makes limited readable substitutions while preserving content; it does not invent content, insert invisible characters or deliberately introduce typos. Translation can change tense, technical senses, names and clause structure. The UI checks numbers, references/URLs, negation, unusual length changes, repeated words, capitalised terms and some timeline shifts, but those checks cannot establish semantic equivalence or grammatical correctness. Originals remain available for comparison and outputs remain editable.

The actual local diagnostic used a 58-word project report. Fakespot model scores were **98.0811% original**, **80.1094% after conservative plain-English edits**, and **88.8035% after the translation round trip**. This is one test fixture, not a success rate or promise. The round trip shifted a present trial to a past event; the quality checker flagged the timeline. In an earlier shorter fixture, the model changed "team" to "Panel", motivating the capitalised-term check. Numbers, negation and paragraph breaks survived these fixtures. Raw diagnostic outputs are in ignored qa-output/revision-smoke.json.

Scores may decrease, increase or stay unchanged on other text. A lower classifier score does not establish human authorship or predict Turnitin. Existing model false positives remain visible in the analyzer. No automatic repeat-until-low-score loop, hidden edits, or false percentage is used.

Meaning protection is enabled by default: when the returned English triggers quality flags, the English draft uses conservative edits from the original instead of the suspect translation. The raw back-translation and its flags remain inspectable and are included in the comparison export. The protection can be disabled explicitly for a subsequent translation. This guard is limited to the checks listed above; it does not guarantee full semantic equivalence.

