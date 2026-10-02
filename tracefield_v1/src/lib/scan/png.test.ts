import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPngWithText, isPng, parsePngChunks, pngTextChunks, stripPngAncillary } from "./png.ts";

function makeTinyPng(): Uint8Array {
  const canvasLike = Uint8Array.from(
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    ),
  );
  return canvasLike;
}

describe("png chunks", () => {
  it("parses a 1x1 png", () => {
    const bytes = makeTinyPng();
    assert.equal(isPng(bytes), true);
    const chunks = parsePngChunks(bytes);
    assert.ok(chunks.some((c) => c.type === "IHDR"));
    assert.ok(chunks.some((c) => c.type === "IDAT"));
    assert.ok(chunks.some((c) => c.type === "IEND"));
  });

  it("injects and reads tEXt, then strips it", () => {
    const tagged = buildPngWithText(makeTinyPng(), [
      { key: "Software", value: "Gemini Image · Google DeepMind" },
    ]);
    const texts = pngTextChunks(parsePngChunks(tagged));
    assert.equal(texts[0]?.key, "Software");
    assert.match(texts[0]?.value ?? "", /Gemini/);
    const stripped = stripPngAncillary(tagged);
    assert.ok(stripped);
    const after = pngTextChunks(parsePngChunks(stripped));
    assert.equal(after.length, 0);
  });
});
