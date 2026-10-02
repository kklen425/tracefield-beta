import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fft, nextPow2 } from "./fft.ts";

describe("fft", () => {
  it("round-trips a cosine", () => {
    const n = 32;
    const re = new Float32Array(n);
    const im = new Float32Array(n);
    for (let i = 0; i < n; i++) re[i] = Math.cos((2 * Math.PI * 3 * i) / n);
    const orig = Float32Array.from(re);
    fft(re, im, false);
    fft(re, im, true);
    let err = 0;
    for (let i = 0; i < n; i++) err += Math.abs(re[i] - orig[i]);
    assert.ok(err < 1e-4, `err=${err}`);
  });

  it("nextPow2", () => {
    assert.equal(nextPow2(1), 1);
    assert.equal(nextPow2(2), 2);
    assert.equal(nextPow2(3), 4);
    assert.equal(nextPow2(256), 256);
    assert.equal(nextPow2(257), 512);
  });
});
