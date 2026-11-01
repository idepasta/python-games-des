const ITERATIONS = 12_000;
const PEPPER = "code-the-world-student-session-v1";

const encoder = new TextEncoder();

function bytesToHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return [...view].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return bytesToHex(digest);
}

export async function hashSecret(secret: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: ITERATIONS },
    key,
    256,
  );
  return { hash: bytesToHex(bits), salt: saltHex ?? bytesToHex(salt) };
}

export async function secretsMatch(secret: string, hash: string, salt: string): Promise<boolean> {
  const next = await hashSecret(secret, salt);
  return timingSafeEqual(next.hash, hash);
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signPayload(payload: string): Promise<string> {
  const signature = await sha256Hex(`${PEPPER}.${payload}`);
  return `${payload}.${signature}`;
}

export async function verifySignedPayload(token: string): Promise<string | null> {
  const cut = token.lastIndexOf(".");
  if (cut <= 0) return null;
  const payload = token.slice(0, cut);
  const signature = token.slice(cut + 1);
  const expected = await sha256Hex(`${PEPPER}.${payload}`);
  return timingSafeEqual(signature, expected) ? payload : null;
}
