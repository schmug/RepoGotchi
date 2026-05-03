import { describe, expect, it } from "vitest";
import { derivePetVariation } from "@repogotchi/core";
import { pickAccessories, renderPet } from "../src/index";
import { PET, makeState } from "./fixtures";

describe("renderPet", () => {
  it("returns a well-formed SVG with the pet's name and palette", () => {
    const { svg, width, height } = renderPet(PET, makeState());

    expect(svg.startsWith("<?xml")).toBe(true);
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain(PET.palette.primary);
    // Outline is themed via var(--outline); the literal palette outline appears
    // only inside the <style> block, not as a stroke attribute.
    expect(svg).toContain("var(--outline)");
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

describe("variation", () => {
  it("renders different bodies for different silhouette pet ids", () => {
    const round = renderPet({ ...PET, id: "000000000000" }, makeState()).svg;
    const teardrop = renderPet({ ...PET, id: "000001000000" }, makeState()).svg;
    const oval = renderPet({ ...PET, id: "000002000000" }, makeState()).svg;
    const lumpy = renderPet({ ...PET, id: "000003000000" }, makeState()).svg;
    expect(new Set([round, teardrop, oval, lumpy]).size).toBe(4);
  });

  it("ear kind 'none' emits an antenna instead of side ears", () => {
    const id = "000000040000"; // earKind = none
    const v = derivePetVariation({ ...PET, id });
    expect(v.earKind).toBe("none");
    const { svg } = renderPet({ ...PET, id }, makeState());
    expect(svg).not.toMatch(/cx="140"\s+cy="120"/); // no left side ear
    expect(svg).not.toMatch(/cx="260"\s+cy="120"/); // no right side ear
  });

  it("mood-overridden eyes ignore eyeKind", () => {
    // pick an id with eyeKind = wide (byte 4 = 3)
    const id = "000000000300";
    expect(derivePetVariation({ ...PET, id }).eyeKind).toBe("wide");

    const sadSvg = renderPet({ ...PET, id }, makeState({ mood: "sad" })).svg;
    // Wide eyes use white-filled ellipses; mood-sad eyes do not.
    expect(sadSvg).not.toContain('fill="white" stroke="');
    // Tears (sad mood) must still appear.
    expect(sadSvg).toContain("var(--tear)");
  });

  it("cheeks 'none' produces no blush ovals", () => {
    const id = "000000000020"; // cheekKind = none
    expect(derivePetVariation({ ...PET, id }).cheekKind).toBe("none");
    const { svg } = renderPet({ ...PET, id }, makeState());
    expect(svg).not.toContain("var(--blush)");
  });

  it("renders selected trinket aria-labels", () => {
    const trinketIds: Record<string, string> = {
      collar: "000000000000",
      bowtie: "000000000001",
      "belly-patch": "000000000002",
      "tail-tuft": "000000000003",
      "whisker-3": "000000000004",
    };
    for (const [label, id] of Object.entries(trinketIds)) {
      const { svg } = renderPet({ ...PET, id }, makeState());
      expect(svg).toContain(`aria-label="${label}"`);
    }
  });
});

describe("theme", () => {
  it("auto theme emits a prefers-color-scheme media query", () => {
    const { svg } = renderPet(PET, makeState());
    // Lock the structural invariant: the CSS vars must live inside a <style>
    // block, not leak as bare text elsewhere in the SVG.
    expect(svg).toMatch(/<style>[\s\S]*--outline[\s\S]*<\/style>/);
    expect(svg).toContain("--outline: #1A1A1A");
    expect(svg).toContain("@media (prefers-color-scheme: dark)");
    expect(svg).toContain("--outline: #E8E8E8");
  });

  it("light theme emits no media query", () => {
    const { svg } = renderPet(PET, makeState(), { theme: "light" });
    expect(svg).toContain("--outline: #1A1A1A");
    expect(svg).not.toContain("prefers-color-scheme");
  });

  it("dark theme emits the dark palette without media query", () => {
    const { svg } = renderPet(PET, makeState(), { theme: "dark" });
    expect(svg).toContain("--outline: #E8E8E8");
    expect(svg).not.toContain("prefers-color-scheme");
  });

  it("strokes are routed through var(--outline) so theme can swap them", () => {
    const { svg } = renderPet(PET, makeState());
    expect(svg).toContain("var(--outline)");
    // The pet's literal palette outline (#1A1A1A) must NOT appear inline as a
    // stroke attribute — that would defeat theming.
    expect(svg).not.toMatch(/stroke="#1A1A1A"/);
  });
});

describe("detail", () => {
  it("compact mode tightens the viewBox", () => {
    const { svg } = renderPet(PET, makeState(), { detail: "compact" });
    expect(svg).toContain('viewBox="40 40 320 320"');
  });

  it("full mode keeps the canonical viewBox", () => {
    const { svg } = renderPet(PET, makeState(), { detail: "full" });
    expect(svg).toContain('viewBox="0 0 400 400"');
  });

  it("auto resolves to compact when size <= 64", () => {
    const { svg } = renderPet(PET, makeState(), { size: 44 });
    expect(svg).toContain('viewBox="40 40 320 320"');
  });

  it("auto resolves to full when size > 64", () => {
    const { svg } = renderPet(PET, makeState(), { size: 200 });
    expect(svg).toContain('viewBox="0 0 400 400"');
  });

  it("compact drops sparkles, zzz, glasses, cheeks, and trinket", () => {
    const { svg } = renderPet(
      { ...PET, traits: ["popular", "scholarly", "active"] },
      makeState({ mood: "sleepy", signals: { lastCommitDaysAgo: 60 } }),
      { detail: "compact" },
    );
    expect(svg).not.toContain('aria-label="sparkles"');
    expect(svg).not.toContain('aria-label="zzz"');
    expect(svg).not.toContain('aria-label="glasses"');
    expect(svg).not.toContain('aria-label="bowtie"');
    expect(svg).not.toContain('aria-label="collar"');
    expect(svg).not.toContain("var(--blush)"); // no blush ovals
    // Crown remains, simplified.
    expect(svg).toContain('aria-label="crown"');
    expect(svg).not.toContain('fill="#FF6B6B"'); // gem dots dropped
  });

  it("compact preserves ghost opacity for archived pets", () => {
    const { svg } = renderPet(
      PET,
      makeState({ mood: "ghost", signals: { isArchived: true } }),
      { detail: "compact" },
    );
    expect(svg).toContain('opacity="0.55"');
  });

  it("compact forces bead eyes for non-mood-overridden moods", () => {
    // pet.id with eyeKind = wide
    const id = "000000000300";
    const { svg } = renderPet({ ...PET, id }, makeState({ mood: "happy" }), {
      detail: "compact",
    });
    // Wide eyes use white-filled ellipses; bead eyes are tiny solid circles.
    expect(svg).not.toContain('fill="white"');
    expect(svg).toMatch(/<circle cx="150" cy="160" r="4"/);
  });

  it("compact preserves mood-overridden eye expressions", () => {
    const { svg } = renderPet(PET, makeState({ mood: "sad" }), {
      detail: "compact",
    });
    // Tear stroke must still be present (mood overrides win).
    expect(svg).toContain("var(--tear)");
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
