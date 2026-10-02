/** In-place radix-2 Cooley–Tukey FFT. n must be a power of two. */
export function fft(re: Float32Array, im: Float32Array, inverse = false): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      swap(re, i, j);
      swap(im, i, j);
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((inverse ? 2 : -2) * Math.PI) / len;
    const wlenRe = Math.cos(ang);
    const wlenIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wRe = 1;
      let wIm = 0;
      const h = len >> 1;
      for (let j = 0; j < h; j++) {
        const uRe = re[i + j];
        const uIm = im[i + j];
        const vRe = re[i + j + h] * wRe - im[i + j + h] * wIm;
        const vIm = re[i + j + h] * wIm + im[i + j + h] * wRe;
        re[i + j] = uRe + vRe;
        im[i + j] = uIm + vIm;
        re[i + j + h] = uRe - vRe;
        im[i + j + h] = uIm - vIm;
        const nWRe = wRe * wlenRe - wIm * wlenIm;
        wIm = wRe * wlenIm + wIm * wlenRe;
        wRe = nWRe;
      }
    }
  }
  if (inverse) {
    for (let i = 0; i < n; i++) {
      re[i] /= n;
      im[i] /= n;
    }
  }
}

export function fft2d(re: Float32Array, im: Float32Array, n: number, inverse = false): void {
  const rowRe = new Float32Array(n);
  const rowIm = new Float32Array(n);
  for (let y = 0; y < n; y++) {
    const off = y * n;
    rowRe.set(re.subarray(off, off + n));
    rowIm.set(im.subarray(off, off + n));
    fft(rowRe, rowIm, inverse);
    re.set(rowRe, off);
    im.set(rowIm, off);
  }
  const colRe = new Float32Array(n);
  const colIm = new Float32Array(n);
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      const i = y * n + x;
      colRe[y] = re[i];
      colIm[y] = im[i];
    }
    fft(colRe, colIm, inverse);
    for (let y = 0; y < n; y++) {
      const i = y * n + x;
      re[i] = colRe[y];
      im[i] = colIm[y];
    }
  }
}

export function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function swap(a: Float32Array, i: number, j: number) {
  const t = a[i];
  a[i] = a[j];
  a[j] = t;
}
