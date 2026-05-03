import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { petPaths, petsDir, rootDir } from "../src/paths";

describe("paths", () => {
  it("anchors on ~/.repogotchi", () => {
    expect(rootDir("/home/u")).toBe("/home/u/.repogotchi");
    expect(petsDir("/home/u")).toBe("/home/u/.repogotchi/pets");
  });

  it("places per-pet files under <root>/pets/<id>/", () => {
    const p = petPaths("a3f5b8c2d1e0", "/home/u");
    expect(p.base).toBe("/home/u/.repogotchi/pets/a3f5b8c2d1e0");
    expect(p.pet).toBe(join(p.base, "pet.json"));
    expect(p.state).toBe(join(p.base, "state.json"));
    expect(p.svg).toBe(join(p.base, "pet.svg"));
  });
});
