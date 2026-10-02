const PNG_SIG = [137, 80, 78, 71, 13, 10, 26, 10];

export interface PngChunk {
  type: string;
  data: Uint8Array;
  offset: number;
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function isPng(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false;
  return PNG_SIG.every((b, i) => bytes[i] === b);
}

export function parsePngChunks(bytes: Uint8Array): PngChunk[] {
  if (!isPng(bytes)) return [];
  const chunks: PngChunk[] = [];
  let i = 8;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  while (i + 12 <= bytes.length) {
    const len = view.getUint32(i);
    if (i + 12 + len > bytes.length) break;
    const type = String.fromCharCode(bytes[i + 4], bytes[i + 5], bytes[i + 6], bytes[i + 7]);
    chunks.push({ type, data: bytes.subarray(i + 8, i + 8 + len), offset: i });
    i += 12 + len;
    if (type === "IEND") break;
  }
  return chunks;
}

export function pngHasC2pa(chunks: PngChunk[]): boolean {
  return chunks.some((c) => {
    const t = c.type;
    if (t === "caBX" || t === "c2pa" || t === "C2PA" || t === "C2CI" || t === "C2CS") return true;
    return false;
  });
}

export function pngTextChunks(chunks: PngChunk[]): { key: string; value: string }[] {
  const out: { key: string; value: string }[] = [];
  for (const c of chunks) {
    if (c.type === "tEXt") {
      const n = c.data.indexOf(0);
      if (n < 0) continue;
      out.push({
        key: latin1(c.data.subarray(0, n)),
        value: latin1(c.data.subarray(n + 1)),
      });
    } else if (c.type === "iTXt") {
      const n = c.data.indexOf(0);
      if (n < 0) continue;
      const key = latin1(c.data.subarray(0, n));
      let p = n + 1;
      const compressed = c.data[p];
      p += 2;
      const n2 = indexOfFrom(c.data, 0, p);
      p = n2 + 1;
      const n3 = indexOfFrom(c.data, 0, p);
      p = n3 + 1;
      const rest = c.data.subarray(p);
      out.push({ key, value: compressed ? `[compressed ${rest.length}b]` : utf8(rest) });
    } else if (c.type === "zTXt") {
      const n = c.data.indexOf(0);
      if (n < 0) continue;
      out.push({ key: latin1(c.data.subarray(0, n)), value: `[zlib ${c.data.length - n - 2}b]` });
    }
  }
  return out;
}

export function buildPngWithText(
  idatPng: Uint8Array,
  texts: { key: string; value: string }[],
): Uint8Array {
  const chunks = parsePngChunks(idatPng);
  if (!chunks.length) return idatPng;
  const kept = chunks.filter((c) => c.type !== "IEND" && c.type !== "tEXt");
  const parts: Uint8Array[] = [idatPng.subarray(0, 8)];
  for (const c of kept) parts.push(encodeChunk(c.type, c.data));
  for (const t of texts) {
    const payload = concatBytes(ascii(t.key), new Uint8Array([0]), ascii(t.value));
    parts.push(encodeChunk("tEXt", payload));
  }
  parts.push(encodeChunk("IEND", new Uint8Array(0)));
  return concatBytes(...parts);
}

export function stripPngAncillary(bytes: Uint8Array): Uint8Array | null {
  const chunks = parsePngChunks(bytes);
  if (!chunks.length) return null;
  const keep = new Set(["IHDR", "PLTE", "IDAT", "IEND", "tRNS"]);
  const parts: Uint8Array[] = [bytes.subarray(0, 8)];
  for (const c of chunks) {
    if (keep.has(c.type)) parts.push(encodeChunk(c.type, c.data));
  }
  return concatBytes(...parts);
}

function encodeChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out[4] = type.charCodeAt(0);
  out[5] = type.charCodeAt(1);
  out[6] = type.charCodeAt(2);
  out[7] = type.charCodeAt(3);
  out.set(data, 8);
  const crcBuf = new Uint8Array(4 + data.length);
  crcBuf.set(out.subarray(4, 8), 0);
  crcBuf.set(data, 4);
  view.setUint32(8 + data.length, crc32(crcBuf));
  return out;
}

function latin1(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return s;
}

function utf8(b: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(b);
  } catch {
    return latin1(b);
  }
}

function ascii(s: string): Uint8Array {
  const b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0xff;
  return b;
}

function indexOfFrom(b: Uint8Array, v: number, start: number): number {
  for (let i = start; i < b.length; i++) if (b[i] === v) return i;
  return b.length;
}

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const n = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}
