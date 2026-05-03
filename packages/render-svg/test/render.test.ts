import { describe, expect, it } from "vitest";
import { pickAccessories, renderPet } from "../src/index";
import { PET, makeState } from "./fixtures";

describe("renderPet", () => {
  it("returns a well-formed SVG with the pet's name and palette", () => {
    const { svg, width, height } = renderPet(PET, makeState());

    expect(svg.startsWith("<?xml")).toBe(true);
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain(PET.palette.primary);
    expect(svg).toContain(PET.palette.outline);
    expect(svg).toContain(`<title>${PET.name}</title>`);
    expect(width).toBe(400);
    expect(height).toBe(400);
  });

  it("respects a custom size", () => {
    const { svg, width, height } = renderPet(PET, makeState(), { size: 96 });
    expect(svg).toContain('width="96"');
    expect(svg).toContain('height="96"');
    expect(width).toBe(96);
    expect(height).toBe(96);
    // viewBox stays canonical so the geometry is identical at every size.
    expect(svg).toContain('viewBox="0 0 400 400"');
  });

  it("uses a stable gradient id derived from the pet id", () => {
    const a = renderPet(PET, makeState());
    const b = renderPet(PET, makeState());
    expect(a.svg).toBe(b.svg);
    expect(a.svg).toContain(`id="body-${PET.id}"`);
  });

  it("escapes XML-unsafe characters in the pet name and headline", () => {
    const { svg } = renderPet(
      { ...PET, name: "<Sneaky&Pet>" },
      makeState({ statusHeadline: 'CI is "broken"' }),
    );
    expect(svg).toContain("&lt;Sneaky&amp;Pet&gt;");
    expect(svg).toContain("&quot;broken&quot;");
    expect(svg).not.toContain("<Sneaky");
  });

  it("dims the body when the pet is archived (ghost)", () => {
    const { svg } = renderPet(
      PET,
      makeState({ mood: "ghost", signals: { isArchived: true } }),
    );
    expect(svg).toMatch(/opacity="0\.55"/);
  });

  it("includes a crown when stars >= 100", () => {
    const { svg } = renderPet(
      PET,
      makeState({ signals: { stars: 250 } }),
    );
    expect(svg).toContain('aria-label="crown"');
  });

  it("includes glasses when contributors >= 5", () => {
    const { svg } = renderPet(
      PET,
      makeState({ signals: { contributors: 6 } }),
    );
    expect(svg).toContain('aria-label="glasses"');
  });
});

describe("pickAccessories", () => {
  it("activates accessories from signals", () => {
    const flags = pickAccessories(
      PET,
      makeState({
        signals: { stars: 200, contributors: 10, lastCommitDaysAgo: 2 },
      }),
    );
    expect(flags).toEqual({
      crown: true,
      glasses: true,
      sparkles: true,
      zzz: false,
    });
  });

  it("activates accessories from traits when signals are missing", () => {
    const flags = pickAccessories(
      { ...PET, traits: ["popular", "scholarly", "active"] },
      makeState({ signals: {} }),
    );
    expect(flags.crown).toBe(true);
    expect(flags.glasses).toBe(true);
    expect(flags.sparkles).toBe(true);
  });

  it("shows zzz when stale or sleepy", () => {
    expect(
      pickAccessories(PET, makeState({ mood: "sleepy" })).zzz,
    ).toBe(true);
    expect(
      pickAccessories(
        PET,
        makeState({ signals: { lastCommitDaysAgo: 90 } }),
      ).zzz,
    ).toBe(true);
  });
});

describe("snapshots", () => {
  for (const mood of [
    "happy",
    "sad",
    "sick",
    "angry",
    "sleepy",
    "excited",
    "ghost",
  ] as const) {
    it(`renders the ${mood} mood`, () => {
      const { svg } = renderPet(PET, makeState({ mood }));
      expect(svg).toMatchSnapshot();
    });
  }
});
