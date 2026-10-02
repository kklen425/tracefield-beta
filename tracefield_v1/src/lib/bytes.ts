/** Copy into a standalone ArrayBuffer so Blob/File constructors type-check. */
export function asBlobPart(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(bytes.byteLength);
  out.set(bytes);
  return out;
}
