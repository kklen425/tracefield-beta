export function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

export interface JpegSegment {
  marker: number;
  name: string;
  offset: number;
  length: number;
  data: Uint8Array;
}

const MARKER_NAME: Record<number, string> = {
  0xe0: "APP0",
  0xe1: "APP1",
  0xe2: "APP2",
  0xeb: "APP11",
  0xed: "APP13",
  0xee: "APP14",
  0xfe: "COM",
  0xdb: "DQT",
  0xc0: "SOF0",
  0xc2: "SOF2",
  0xc4: "DHT",
  0xda: "SOS",
  0xd9: "EOI",
};

export function parseJpegSegments(bytes: Uint8Array): JpegSegment[] {
  if (!isJpeg(bytes)) return [];
  const segs: JpegSegment[] = [];
  let i = 2;
  while (i + 1 < bytes.length) {
    if (bytes[i] !== 0xff) {
      i++;
      continue;
    }
    while (i < bytes.length && bytes[i] === 0xff) i++;
    if (i >= bytes.length) break;
    const marker = bytes[i];
    i++;
    if (marker === 0xd8) continue;
    if (marker === 0xd9) {
      segs.push({ marker, name: "EOI", offset: i - 2, length: 0, data: new Uint8Array(0) });
      break;
    }
    if (marker === 0xda) {
      segs.push({
        marker,
        name: "SOS",
        offset: i - 2,
        length: bytes.length - (i - 2),
        data: bytes.subarray(i - 2),
      });
      break;
    }
    if (i + 1 >= bytes.length) break;
    const len = (bytes[i] << 8) | bytes[i + 1];
    const data = bytes.subarray(i + 2, Math.min(bytes.length, i + len));
    segs.push({
      marker,
      name: MARKER_NAME[marker] ?? `MK${marker.toString(16)}`,
      offset: i - 2,
      length: len,
      data,
    });
    i += len;
  }
  return segs;
}

export function jpegHasC2pa(segs: JpegSegment[]): boolean {
  return segs.some((s) => {
    if (s.marker === 0xeb) return true;
    const ascii = latin1(s.data.subarray(0, Math.min(s.data.length, 256)));
    return /jumb|c2pa|urn:c2pa/i.test(ascii);
  });
}

export function jpegComments(segs: JpegSegment[]): string[] {
  return segs.filter((s) => s.marker === 0xfe).map((s) => latin1(s.data));
}

export function stripJpegMetadata(bytes: Uint8Array): Uint8Array | null {
  if (!isJpeg(bytes)) return null;
  const segs = parseJpegSegments(bytes);
  const parts: Uint8Array[] = [new Uint8Array([0xff, 0xd8])];
  for (const s of segs) {
    if (s.marker === 0xda) {
      parts.push(bytes.subarray(s.offset));
      break;
    }
    if (s.marker === 0xd9) {
      parts.push(new Uint8Array([0xff, 0xd9]));
      break;
    }
    if (s.marker === 0xe0) {
      parts.push(encodeSeg(s));
      continue;
    }
    if (s.marker >= 0xe0 && s.marker <= 0xef) continue;
    if (s.marker === 0xfe) continue;
    parts.push(encodeSeg(s));
  }
  return concat(parts);
}

function encodeSeg(s: JpegSegment): Uint8Array {
  const out = new Uint8Array(2 + s.length);
  out[0] = 0xff;
  out[1] = s.marker;
  out[2] = (s.length >> 8) & 0xff;
  out[3] = s.length & 0xff;
  out.set(s.data.subarray(0, Math.max(0, s.length - 2)), 4);
  return out;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const n = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function latin1(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return s;
}
