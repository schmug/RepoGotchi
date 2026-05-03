import type { RepoRef } from "@repogotchi/core";

export class RepoParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepoParseError";
  }
}

const SSH = /^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/;
const HTTPS = /^https?:\/\/github\.com\/([^/]+)\/(.+?)(?:\.git)?\/?$/;

export function parseGitHubUrl(url: string): RepoRef {
  const trimmed = url.trim();
  const m = trimmed.match(SSH) ?? trimmed.match(HTTPS);
  if (!m) {
    throw new RepoParseError(`Not a GitHub remote URL: ${url}`);
  }
  return { host: "github", owner: m[1]!, name: m[2]! };
}
