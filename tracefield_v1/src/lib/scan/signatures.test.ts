import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { harvestAscii, matchNeedles } from "./signatures.ts";

describe("matchNeedles", () => {
  it("attributes Gemini + SynthID to Google", () => {
    const hits = matchNeedles("Software: Gemini Image SynthID trainedAlgorithmicMedia");
    const labs = new Set(hits.map((h) => h.lab));
    assert.ok(labs.has("google"));
    assert.ok(hits.some((h) => h.family === "SynthID" || /algorithmic/i.test(h.family)));
  });

  it("attributes DALL-E to OpenAI", () => {
    const hits = matchNeedles("claim_generator OpenAI DALL-E 3 c2pa.created");
    assert.ok(hits.some((h) => h.lab === "openai"));
    assert.ok(hits.some((h) => h.lab === "c2pa"));
  });

  it("does not treat Adobe Photoshop alone as Firefly", () => {
    const hits = matchNeedles("Software: Adobe Photoshop 2024");
    assert.equal(
      hits.filter((h) => h.lab === "adobe").length,
      0,
    );
  });

  it("catches A1111 parameters", () => {
    const hits = matchNeedles("Negative prompt: fog\nSteps: 28 Sampler: Euler a CFG scale: 7");
    assert.ok(hits.some((h) => h.lab === "a1111"));
  });
});

describe("harvestAscii", () => {
  it("pulls printable runs", () => {
    const bytes = Uint8Array.from([...Buffer.from("xx\0\0Gemini Image\0\0yy", "utf8")]);
    const s = harvestAscii(bytes, 4);
    assert.match(s, /Gemini Image/);
  });
});
