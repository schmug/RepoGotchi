import { describe, expect, it } from "vitest";
import { petIdFor } from "../src/petId";

describe("petIdFor", () => {
  it("returns a 12-char lowercase hex string", async () => {
    const id = await petIdFor({
      host: "github",
      owner: "schmug",
      name: "RepoGotchi",
    });
    expect(id).toMatch(/^[a-f0-9]{12}$/);
  });

  it("is deterministic", async () => {
    const a = await petIdFor({
      host: "github",
      owner: "schmug",
      name: "RepoGotchi",
    });
    const b = await petIdFor({
      host: "github",
      owner: "schmug",
      name: "RepoGotchi",
    });
    expect(a).toBe(b);
  });

  it("differs for different repos", async () => {
    const a = await petIdFor({
      host: "github",
      owner: "schmug",
      name: "RepoGotchi",
    });
    const b = await petIdFor({
      host: "github",
      owner: "schmug",
      name: "contextbuddy",
    });
    expect(a).not.toBe(b);
  });

  it("matches the documented sha256 prefix", async () => {
    // sha256("github:schmug/RepoGotchi") computed with `printf 'github:schmug/RepoGotchi' | shasum -a 256`
    const id = await petIdFor({
      host: "github",
      owner: "schmug",
      name: "RepoGotchi",
    });
    // Snapshotted so any future change to the hashing scheme is loud.
    expect(id).toMatchInlineSnapshot(`"653c0b44fa4d"`);
  });
});
