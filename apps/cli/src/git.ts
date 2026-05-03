import { execFileSync } from "node:child_process";
import type { Signals, RepoRef } from "@repogotchi/core";
import { parseGitHubUrl } from "./repo";

export interface GitContext {
  cwd: string;
}

export class GitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GitError";
  }
}

function git(ctx: GitContext, args: string[]): string {
  try {
    return execFileSync("git", args, {
      cwd: ctx.cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (e) {
    const err = e as NodeJS.ErrnoException & { stderr?: string };
    const detail = err.stderr?.trim() ?? err.message;
    throw new GitError(`git ${args.join(" ")} failed: ${detail}`);
  }
}

export function getOrigin(ctx: GitContext): RepoRef {
  const url = git(ctx, ["remote", "get-url", "origin"]);
  return parseGitHubUrl(url);
}

/** First-commit timestamp as the pet's bornAt. Stable across the repo's life. */
export function getCreatedAt(ctx: GitContext): string {
  const ts = git(ctx, [
    "log",
    "--reverse",
    "--format=%cI",
    "--max-count=1",
  ]);
  if (!ts) throw new GitError("repo has no commits — make one before hatching");
  // git may emit multiple lines if reverse is misinterpreted on older versions; take the first.
  return ts.split("\n")[0]!;
}

export function readSignals(ctx: GitContext, now: Date = new Date()): Signals {
  const lastTs = git(ctx, ["log", "-1", "--format=%ct"]);
  const lastCommitDaysAgo = lastTs
    ? Math.max(
        0,
        Math.floor(
          (now.getTime() / 1000 - parseInt(lastTs, 10)) / 86400,
        ),
      )
    : undefined;

  const status = git(ctx, ["status", "--porcelain"]);
  const hasUncommittedChanges = status.length > 0;

  const shortlog = git(ctx, ["shortlog", "-sne", "HEAD"]);
  const contributors = shortlog ? shortlog.split("\n").length : 0;

  return {
    ...(lastCommitDaysAgo !== undefined ? { lastCommitDaysAgo } : {}),
    hasUncommittedChanges,
    contributors,
  };
}
