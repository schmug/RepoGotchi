import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  getCreatedAt,
  getOrigin,
  GitError,
  readSignals,
} from "../src/git";
import { makeTempRepo, type TempRepo } from "./helpers/tempRepo";

describe("git", () => {
  let repo: TempRepo;

  beforeAll(() => {
    repo = makeTempRepo({
      contributors: [
        { name: "Alice", email: "alice@example.com" },
        { name: "Bob", email: "bob@example.com" },
        { name: "Cara", email: "cara@example.com" },
      ],
    });
  });

  afterAll(() => repo.cleanup());

  it("getOrigin parses the origin URL into a RepoRef", () => {
    expect(getOrigin({ cwd: repo.path })).toEqual({
      host: "github",
      owner: "schmug",
      name: "RepoGotchi",
    });
  });

  it("getCreatedAt returns the first commit's ISO timestamp", () => {
    const ts = getCreatedAt({ cwd: repo.path });
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("readSignals reports contributors and clean tree", () => {
    const sig = readSignals({ cwd: repo.path });
    expect(sig.contributors).toBe(3);
    expect(sig.hasUncommittedChanges).toBe(false);
    expect(sig.lastCommitDaysAgo).toBe(0);
  });

  it("readSignals flags uncommitted changes", async () => {
    const { writeFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    writeFileSync(join(repo.path, "dirty.txt"), "x");
    try {
      const sig = readSignals({ cwd: repo.path });
      expect(sig.hasUncommittedChanges).toBe(true);
    } finally {
      const { rmSync } = await import("node:fs");
      rmSync(join(repo.path, "dirty.txt"));
    }
  });

  it("throws GitError when run outside a repo", () => {
    expect(() => getOrigin({ cwd: "/" })).toThrow(GitError);
  });
});
