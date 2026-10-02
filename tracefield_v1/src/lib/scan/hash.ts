export async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  const view = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < view.length; i++) s += view[i].toString(16).padStart(2, "0");
  return s;
}
