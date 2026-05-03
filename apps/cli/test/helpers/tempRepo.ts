import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface TempRepo {
  path: string;
  cleanup: () => void;
}

export function makeTempRepo(opts: {
  origin?: string;
  contributors?: Array<{ name: string; email: string }>;
} = {}): TempRepo {
  const path = mkdtempSync(join(tmpdir(), "repogotchi-test-"));
  const env = { ...process.env, GIT_TERMINAL_PROMPT: "0" };

  const git = (...args: string[]) => {
    execFileSync("git", args, {
      cwd: path,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
  };

  git("init", "--quiet", "--initial-branch=main");
  git("config", "user.name", "Test");
  git("config", "user.email", "test@example.com");
  git("config", "commit.gpgsign", "false");
  git(
    "remote",
    "add",
    "origin",
    opts.origin ?? "https://github.com/schmug/RepoGotchi.git",
  );

  const contributors = opts.contributors ?? [
    { name: "Test", email: "test@example.com" },
  ];
  for (let i = 0; i < contributors.length; i++) {
    const c = contributors[i]!;
    git("config", "user.name", c.name);
    git("config", "user.email", c.email);
    writeFileSync(join(path, `commit-${i}.txt`), `commit ${i}\n`);
    git("add", ".");
    git("commit", "--quiet", "-m", `commit ${i}`);
  }

  return {
    path,
    cleanup: () => rmSync(path, { recursive: true, force: true }),
  };
}

export function makeTempHome(): { home: string; cleanup: () => void } {
  const home = mkdtempSync(join(tmpdir(), "repogotchi-home-"));
  return {
    home,
    cleanup: () => rmSync(home, { recursive: true, force: true }),
  };
}
