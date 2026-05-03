import type { Signals } from "@repogotchi/core";
import type { Env } from "./env";

export interface GitHubRepo {
  name: string;
  owner: { login: string };
  language: string | null;
  stargazers_count: number;
  open_issues_count: number;
  pushed_at: string;
  created_at: string;
  archived: boolean;
  default_branch: string;
}

export class GitHubError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

const USER_AGENT = "RepoGotchi-Worker/0.1 (+https://github.com/schmug/RepoGotchi)";

export async function fetchRepo(
  owner: string,
  repo: string,
  env: Env,
  fetcher: typeof fetch = fetch,
): Promise<GitHubRepo | null> {
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  }

  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const res = await fetcher(url, { headers });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new GitHubError(
      `GitHub API ${res.status} for ${owner}/${repo}`,
      res.status,
    );
  }
  return (await res.json()) as GitHubRepo;
}

/**
 * Convert a GitHub repo response into the canonical Signals shape.
 * Note: GitHub's open_issues_count includes both issues and PRs; we report
 * it under openIssues for v0 since the Worker only uses the basic endpoint.
 */
export function repoToSignals(
  repo: GitHubRepo,
  now: Date = new Date(),
): Signals {
  const lastCommit = new Date(repo.pushed_at).getTime();
  const days = Math.max(
    0,
    Math.round((now.getTime() - lastCommit) / (1000 * 60 * 60 * 24)),
  );

  return {
    lastCommitDaysAgo: days,
    openIssues: repo.open_issues_count,
    stars: repo.stargazers_count,
    isArchived: repo.archived,
  };
}
