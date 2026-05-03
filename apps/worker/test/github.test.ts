import { describe, expect, it, vi } from "vitest";
import { fetchRepo, GitHubError, repoToSignals } from "../src/github";

const SAMPLE_REPO = {
  name: "RepoGotchi",
  owner: { login: "schmug" },
  language: "TypeScript",
  stargazers_count: 42,
  open_issues_count: 3,
  pushed_at: "2026-04-25T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
  archived: false,
  default_branch: "main",
};

describe("fetchRepo", () => {
  it("hits the documented API URL with required headers", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify(SAMPLE_REPO)));
    await fetchRepo("schmug", "RepoGotchi", {}, fetcher);

    const [url, init] = fetcher.mock.calls[0]!;
    expect(url).toBe("https://api.github.com/repos/schmug/RepoGotchi");
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers["User-Agent"]).toMatch(/RepoGotchi-Worker/);
    expect(headers.Accept).toBe("application/vnd.github+json");
    expect(headers.Authorization).toBeUndefined();
  });

  it("includes a Bearer auth header when GITHUB_TOKEN is present", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify(SAMPLE_REPO)));
    await fetchRepo("schmug", "RepoGotchi", { GITHUB_TOKEN: "ghp_xxx" }, fetcher);
    const headers = (fetcher.mock.calls[0]![1] as RequestInit)
      .headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer ghp_xxx");
  });

  it("returns null on 404", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("nope", { status: 404 }));
    const out = await fetchRepo("nope", "nope", {}, fetcher);
    expect(out).toBeNull();
  });

  it("throws GitHubError with status on other error responses", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("rate limited", { status: 403 }));
    await expect(
      fetchRepo("a", "b", {}, fetcher),
    ).rejects.toBeInstanceOf(GitHubError);
    try {
      await fetchRepo("a", "b", {}, fetcher);
    } catch (e) {
      expect((e as GitHubError).status).toBe(403);
    }
  });

  it("encodes path components", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify(SAMPLE_REPO)));
    await fetchRepo("space owner", "weird/name", {}, fetcher);
    expect(fetcher.mock.calls[0]![0]).toBe(
      "https://api.github.com/repos/space%20owner/weird%2Fname",
    );
  });
});

describe("repoToSignals", () => {
  it("computes lastCommitDaysAgo from pushed_at", () => {
    const now = new Date("2026-05-02T00:00:00Z");
    const sig = repoToSignals(SAMPLE_REPO, now);
    expect(sig.lastCommitDaysAgo).toBe(7);
    expect(sig.openIssues).toBe(3);
    expect(sig.stars).toBe(42);
    expect(sig.isArchived).toBe(false);
  });

  it("clamps negative days to zero (clock skew safety)", () => {
    const future = {
      ...SAMPLE_REPO,
      pushed_at: "2099-01-01T00:00:00Z",
    };
    const sig = repoToSignals(future, new Date("2026-05-02T00:00:00Z"));
    expect(sig.lastCommitDaysAgo).toBe(0);
  });
});
