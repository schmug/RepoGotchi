import { describe, expect, it, vi } from "vitest";
import { handle } from "../src/handler";

const REPO = {
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

function ok(body: unknown, init: ResponseInit = { status: 200 }): Response {
  return new Response(JSON.stringify(body), init);
}

const NOW = () => new Date("2026-05-02T00:00:00Z");

describe("handle", () => {
  it("returns an SVG for a valid repo", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(ok(REPO));
    const res = await handle(
      new Request("https://r/pet/schmug/RepoGotchi.svg"),
      {},
      { fetcher, now: NOW },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(
      "image/svg+xml; charset=utf-8",
    );
    expect(res.headers.get("cache-control")).toContain("max-age=3600");
    const body = await res.text();
    expect(body).toContain("<svg");
    expect(body).toContain("</svg>");
    expect(body).toContain("#3178C6"); // TypeScript primary color
  });

  it("returns a 404 SVG when the repo is missing", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("nope", { status: 404 }));
    const res = await handle(
      new Request("https://r/pet/nope/nope.svg"),
      {},
      { fetcher, now: NOW },
    );
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toContain("image/svg+xml");
    const body = await res.text();
    expect(body).toContain("not found");
  });

  it("returns a 429 SVG when GitHub rate-limits", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("limit", { status: 403 }));
    const res = await handle(
      new Request("https://r/pet/a/b.svg"),
      {},
      { fetcher, now: NOW },
    );
    expect(res.status).toBe(429);
    const body = await res.text();
    expect(body.toLowerCase()).toContain("rate limited");
  });

  it("rejects non-GET methods", async () => {
    const res = await handle(
      new Request("https://r/pet/a/b.svg", { method: "POST" }),
      {},
    );
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("GET, HEAD");
  });

  it("404s on unknown paths", async () => {
    const res = await handle(new Request("https://r/foo"), {});
    expect(res.status).toBe(404);
  });

  it("ignores trailing slashes and other shapes", async () => {
    const res = await handle(new Request("https://r/pet/schmug/RepoGotchi"), {});
    expect(res.status).toBe(404);
  });

  it("hatches a deterministic pet across calls", async () => {
    // Fresh Response per call — Response bodies are single-use streams.
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => ok(REPO));
    const a = await (
      await handle(
        new Request("https://r/pet/schmug/RepoGotchi.svg"),
        {},
        { fetcher, now: NOW },
      )
    ).text();
    const b = await (
      await handle(
        new Request("https://r/pet/schmug/RepoGotchi.svg"),
        {},
        { fetcher, now: NOW },
      )
    ).text();
    expect(a).toBe(b);
  });
});
