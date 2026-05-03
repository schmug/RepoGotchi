import { describe, expect, it } from "vitest";
import { parseGitHubUrl, RepoParseError } from "../src/repo";

describe("parseGitHubUrl", () => {
  it("parses SSH URLs with .git suffix", () => {
    expect(parseGitHubUrl("git@github.com:schmug/RepoGotchi.git")).toEqual({
      host: "github",
      owner: "schmug",
      name: "RepoGotchi",
    });
  });

  it("parses SSH URLs without .git suffix", () => {
    expect(parseGitHubUrl("git@github.com:schmug/RepoGotchi")).toEqual({
      host: "github",
      owner: "schmug",
      name: "RepoGotchi",
    });
  });

  it("parses https URLs", () => {
    expect(
      parseGitHubUrl("https://github.com/schmug/RepoGotchi.git"),
    ).toEqual({
      host: "github",
      owner: "schmug",
      name: "RepoGotchi",
    });
    expect(parseGitHubUrl("https://github.com/schmug/RepoGotchi")).toEqual({
      host: "github",
      owner: "schmug",
      name: "RepoGotchi",
    });
  });

  it("trims surrounding whitespace", () => {
    expect(
      parseGitHubUrl("  https://github.com/schmug/RepoGotchi.git\n"),
    ).toEqual({
      host: "github",
      owner: "schmug",
      name: "RepoGotchi",
    });
  });

  it("rejects non-GitHub URLs", () => {
    expect(() =>
      parseGitHubUrl("git@gitlab.com:schmug/RepoGotchi.git"),
    ).toThrow(RepoParseError);
  });

  it("rejects malformed URLs", () => {
    expect(() => parseGitHubUrl("not-a-url")).toThrow(RepoParseError);
  });
});
