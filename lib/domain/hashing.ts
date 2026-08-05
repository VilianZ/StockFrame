import { canonicalSerialize } from "./serialization";

export async function sha256Hex(value: unknown): Promise<string> {
  const encoded = new TextEncoder().encode(canonicalSerialize(value));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
