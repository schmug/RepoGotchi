import { describe, expect, it } from "vitest";
import {
  derivePetVariation,
  type PetVariation,
} from "../src/variation";
import type { Pet } from "@repogotchi/contract";

const BASE_PET: Pet = {
  schemaVersion: 1,
  id: "000000000000",
  repo: { host: "github", owner: "o", name: "r" },
  name: "Stacky",
  species: "blob",
  palette: {
    primary: "#3178C6",
    secondary: "#1E4E8E",
    accent: "#FFD700",
    outline: "#1A1A1A",
  },
  personality: "",
  traits: [],
  bornAt: "2026-01-01T00:00:00Z",
  visualPrompt: null,
};

function withId(id: string): Pet {
  return { ...BASE_PET, id };
}

describe("derivePetVariation", () => {
  it("is fully deterministic for a given pet.id", () => {
    const a = derivePetVariation(withId("a3f5b8c2d1e0"));
    const b = derivePetVariation(withId("a3f5b8c2d1e0"));
    expect(a).toEqual(b);
  });

  it("reads silhouette from byte 2 mod 4", () => {
    expect(derivePetVariation(withId("000000000000")).silhouette).toBe("round");
    expect(derivePetVariation(withId("000001000000")).silhouette).toBe("teardrop");
    expect(derivePetVariation(withId("000002000000")).silhouette).toBe("oval-wide");
    expect(derivePetVariation(withId("000003000000")).silhouette).toBe("lumpy");
    // byte = 0xFF (255) → 255 % 4 = 3 → lumpy
    expect(derivePetVariation(withId("0000ff000000")).silhouette).toBe("lumpy");
  });

  it("reads earKind from byte 3 mod 6", () => {
    expect(derivePetVariation(withId("000000000000")).earKind).toBe("pointed-2");
    expect(derivePetVariation(withId("000000010000")).earKind).toBe("round-2");
    expect(derivePetVariation(withId("000000020000")).earKind).toBe("floppy-2");
    expect(derivePetVariation(withId("000000030000")).earKind).toBe("tuft-3");
    expect(derivePetVariation(withId("000000040000")).earKind).toBe("none");
    expect(derivePetVariation(withId("000000050000")).earKind).toBe("horn-2");
  });

  it("reads eyeKind from byte 4 mod 4", () => {
    expect(derivePetVariation(withId("000000000000")).eyeKind).toBe("round");
    expect(derivePetVariation(withId("000000000100")).eyeKind).toBe("almond");
    expect(derivePetVariation(withId("000000000200")).eyeKind).toBe("bead");
    expect(derivePetVariation(withId("000000000300")).eyeKind).toBe("wide");
  });

  it("reads cheekKind from byte 5 high nibble mod 3", () => {
    expect(derivePetVariation(withId("000000000000")).cheekKind).toBe("blush-pink");
    expect(derivePetVariation(withId("000000000010")).cheekKind).toBe("freckles");
    expect(derivePetVariation(withId("000000000020")).cheekKind).toBe("none");
    expect(derivePetVariation(withId("000000000030")).cheekKind).toBe("blush-pink");
  });

  it("reads trinket from byte 5 low nibble mod 6", () => {
    expect(derivePetVariation(withId("000000000000")).trinket).toBe("collar");
    expect(derivePetVariation(withId("000000000001")).trinket).toBe("bowtie");
    expect(derivePetVariation(withId("000000000002")).trinket).toBe("belly-patch");
    expect(derivePetVariation(withId("000000000003")).trinket).toBe("tail-tuft");
    expect(derivePetVariation(withId("000000000004")).trinket).toBe("whisker-3");
    expect(derivePetVariation(withId("000000000005")).trinket).toBe("none");
  });

  it("returns the canonical PetVariation shape", () => {
    const v: PetVariation = derivePetVariation(withId("a3f5b8c2d1e0"));
    expect(Object.keys(v).sort()).toEqual([
      "cheekKind",
      "earKind",
      "eyeKind",
      "silhouette",
      "trinket",
    ]);
  });

  it("falls back to byte=0 if pet.id is malformed (defensive)", () => {
    // Schema enforces 12 hex, but the renderer should not crash on bad input.
    const v = derivePetVariation(withId("zzzz"));
    expect(v.silhouette).toBe("round");
    expect(v.earKind).toBe("pointed-2");
    expect(v.eyeKind).toBe("round");
    expect(v.cheekKind).toBe("blush-pink");
    expect(v.trinket).toBe("collar");
  });
});
