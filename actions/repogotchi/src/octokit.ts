import * as github from "@actions/github";
import type { Signals } from "@repogotchi/core";

export interface RepoFacts {
  language: string | null;
  createdAt: string;
  signals: Signals;
}

export async function fetchRepoFacts(
  token: string,
  now: Date = new Date(),
): Promise<RepoFacts> {
  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;
  const { data } = await octokit.rest.repos.get({ owner, repo });

  const lastCommit = new Date(data.pushed_at).getTime();
  const days = Math.max(
    0,
    Math.round((now.getTime() - lastCommit) / (1000 * 60 * 60 * 24)),
  );

  return {
    language: data.language ?? null,
    createdAt: data.created_at,
    signals: {
      lastCommitDaysAgo: days,
      openIssues: data.open_issues_count,
      stars: data.stargazers_count,
      isArchived: data.archived,
    },
  };
}
