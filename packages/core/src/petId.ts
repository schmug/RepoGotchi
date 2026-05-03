import type { Pet } from "@repogotchi/contract";

export type RepoRef = Pet["repo"];

/**
 * Deterministic pet identifier. Uses Web Crypto so it works in Node 20+,
 * browsers, and Cloudflare Workers without a polyfill.
 *
 * Format: first 12 hex chars of sha256("<host>:<owner>/<name>").
 */
export async function petIdFor(repo: RepoRef): Promise<string> {
  const text = `${repo.host}:${repo.owner}/${repo.name}`;
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash).slice(0, 6))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
