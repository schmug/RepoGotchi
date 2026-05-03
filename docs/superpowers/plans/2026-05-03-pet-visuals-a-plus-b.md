# Pet visuals A+B — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** [docs/superpowers/specs/2026-05-03-pet-visuals-a-plus-b-design.md](../specs/2026-05-03-pet-visuals-a-plus-b-design.md)

**Companion follow-up:** [#13 multi-species pets](https://github.com/schmug/RepoGotchi/issues/13).

**Goal:** Make every RepoGotchi pet visibly distinct per repo (variation derived from petId hash bytes) and make a single SVG file work cleanly across surfaces from a 22px menubar to a 400px hero embed (prefers-color-scheme + size-aware detail gating).

**Architecture:** Pure variation derivation in `@repogotchi/core`; restructure `@repogotchi/render-svg` parts into per-feature modules; add `theme` and `detail` options to `renderPet`; expose Worker query params for surface-specific overrides. Determinism preserved — every change is a pure function of inputs and snapshot-locked.

**Tech Stack:** TypeScript, vitest (snapshots), Cloudflare Workers, Node 20+. No new runtime dependencies.

---

## File map

**Created:**
- `packages/core/src/variation.ts` — `derivePetVariation(pet)` pure function and `PetVariation` type.
- `packages/core/test/variation.test.ts` — variation unit tests.
- `packages/render-svg/src/xml.ts` — `escapeXmlText` / `escapeXmlAttr` lifted from today's `parts.ts`.
- `packages/render-svg/src/theme.ts` — emits the `<style>` block; resolves `theme` and `detail` options.
- `packages/render-svg/src/parts/body.ts` — silhouette switch.
- `packages/render-svg/src/parts/ears.ts` — ear kind + count switch.
- `packages/render-svg/src/parts/eyes.ts` — moved from `parts.ts`, gains `eyeKind` baseline.
- `packages/render-svg/src/parts/mouth.ts` — moved from `parts.ts`, unchanged behavior.
- `packages/render-svg/src/parts/cheeks.ts` — variation cheekKind.
- `packages/render-svg/src/parts/trinket.ts` — variation trinket.
- `packages/render-svg/src/parts/accessories.ts` — moved from `parts.ts`, unchanged behavior.

**Modified:**
- `packages/core/src/index.ts` — re-export variation API.
- `packages/render-svg/src/index.ts` — orchestrator, new options, theme/detail wiring.
- `packages/render-svg/src/parts.ts` — deleted (its content has moved to per-feature modules); re-export shim if any test imports from it.
- `packages/render-svg/test/render.test.ts` — extended with variation/theme/detail/invariant tests.
- `packages/render-svg/test/__snapshots__/render.test.ts.snap` — re-snapshotted once when variation is wired in, once when theme is wired in, once when detail is wired in.
- `apps/worker/src/handler.ts` — accept `?size=&theme=&detail=` query params, clamp invalid values.
- `apps/worker/test/*` — extended for query param handling.
- `README.md` — small note about theme/detail support.
- `ROADMAP.md` — mark A+B shipped, point to #13 follow-up.

---

## Task 1: derivePetVariation in @repogotchi/core

**Files:**
- Create: `packages/core/src/variation.ts`
- Create: `packages/core/test/variation.test.ts`
- Modify: `packages/core/src/index.ts`

### - [ ] Step 1.1: Write the failing tests

Create `packages/core/test/variation.test.ts`:

```ts
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
```

### - [ ] Step 1.2: Run the failing tests

```bash
pnpm --filter @repogotchi/core test -- variation.test.ts
```

Expected: FAIL — `Cannot find module '../src/variation'`.

### - [ ] Step 1.3: Implement derivePetVariation

Create `packages/core/src/variation.ts`:

```ts
import type { Pet } from "@repogotchi/contract";

/**
 * Identity-derived visual variation. Pure function of pet.id; same pet always
 * produces the same variation. Lives next to hatchPet because variation is
 * part of identity, not state.
 *
 * Byte allocation in pet.id (12 hex chars = 6 bytes):
 *   bytes 0-1 (u16) → name index (existing, in hatch.ts)
 *   byte 2          → silhouette (% 4)
 *   byte 3          → earKind    (% 6)
 *   byte 4          → eyeKind    (% 4)
 *   byte 5 hi nib   → cheekKind  (% 3)
 *   byte 5 lo nib   → trinket    (% 6)
 *
 * Future dimensions: hash pet.id again with a salt prefix and read from that
 * hash. Do NOT silently reuse bit ranges already in this table.
 */
export interface PetVariation {
  silhouette: "round" | "teardrop" | "oval-wide" | "lumpy";
  earKind: "pointed-2" | "round-2" | "floppy-2" | "tuft-3" | "none" | "horn-2";
  eyeKind: "round" | "almond" | "bead" | "wide";
  cheekKind: "blush-pink" | "freckles" | "none";
  trinket: "collar" | "bowtie" | "belly-patch" | "tail-tuft" | "whisker-3" | "none";
}

const SILHOUETTES: PetVariation["silhouette"][] = [
  "round", "teardrop", "oval-wide", "lumpy",
];
const EAR_KINDS: PetVariation["earKind"][] = [
  "pointed-2", "round-2", "floppy-2", "tuft-3", "none", "horn-2",
];
const EYE_KINDS: PetVariation["eyeKind"][] = [
  "round", "almond", "bead", "wide",
];
const CHEEK_KINDS: PetVariation["cheekKind"][] = [
  "blush-pink", "freckles", "none",
];
const TRINKETS: PetVariation["trinket"][] = [
  "collar", "bowtie", "belly-patch", "tail-tuft", "whisker-3", "none",
];

export function derivePetVariation(pet: Pet): PetVariation {
  const b2 = readByte(pet.id, 2);
  const b3 = readByte(pet.id, 3);
  const b4 = readByte(pet.id, 4);
  const b5 = readByte(pet.id, 5);
  const b5hi = (b5 >> 4) & 0x0f;
  const b5lo = b5 & 0x0f;

  return {
    silhouette: SILHOUETTES[b2 % SILHOUETTES.length]!,
    earKind: EAR_KINDS[b3 % EAR_KINDS.length]!,
    eyeKind: EYE_KINDS[b4 % EYE_KINDS.length]!,
    cheekKind: CHEEK_KINDS[b5hi % CHEEK_KINDS.length]!,
    trinket: TRINKETS[b5lo % TRINKETS.length]!,
  };
}

function readByte(hex: string, index: number): number {
  const start = index * 2;
  const slice = hex.slice(start, start + 2);
  const n = parseInt(slice, 16);
  return Number.isFinite(n) ? n : 0;
}
```

### - [ ] Step 1.4: Re-export from core's index

Modify `packages/core/src/index.ts` — add this export below the existing `hatchPet` exports:

```ts
export { derivePetVariation } from "./variation";
export type { PetVariation } from "./variation";
```

### - [ ] Step 1.5: Run tests

```bash
pnpm --filter @repogotchi/core test
```

Expected: all tests pass, including the new variation tests.

### - [ ] Step 1.6: Run typecheck

```bash
pnpm typecheck
```

Expected: no errors.

### - [ ] Step 1.7: Commit

```bash
git add packages/core/src/variation.ts packages/core/src/index.ts packages/core/test/variation.test.ts
git commit -m "feat(core): derivePetVariation — identity-driven visual params from petId

Pure sync function reading bytes 2-5 of pet.id into five enum dimensions
(silhouette, earKind, eyeKind, cheekKind, trinket). 4×6×4×3×6 = 1,728 base
looks. No I/O; identical inputs → identical outputs. Renderer wiring lands
in a follow-up commit.

Spec: docs/superpowers/specs/2026-05-03-pet-visuals-a-plus-b-design.md"
```

---

## Task 2: Restructure render-svg parts (no behavior change)

The renderer's `parts.ts` currently mixes XML escapes, eyes, mouth, accessory selection, and accessory rendering. Split it into focused modules so subsequent variation tasks don't bloat one file. **No behavior changes** — existing snapshot stays byte-identical.

**Files:**
- Create: `packages/render-svg/src/xml.ts`
- Create: `packages/render-svg/src/parts/eyes.ts`
- Create: `packages/render-svg/src/parts/mouth.ts`
- Create: `packages/render-svg/src/parts/accessories.ts`
- Modify: `packages/render-svg/src/index.ts` — update imports.
- Delete: `packages/render-svg/src/parts.ts`

### - [ ] Step 2.1: Move escapes to xml.ts

Create `packages/render-svg/src/xml.ts`:

```ts
export function escapeXmlText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escapeXmlAttr(s: string): string {
  return escapeXmlText(s).replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
```

### - [ ] Step 2.2: Create parts/eyes.ts

Create `packages/render-svg/src/parts/eyes.ts` with the existing `renderEyes` body and the `FACE_CX / EYE_Y / EYE_OFFSET` constants. Copy verbatim from today's `parts.ts`. Do not change behavior:

```ts
import type { State } from "@repogotchi/contract";

export const FACE_CX = 200;
export const EYE_Y = 160;
export const EYE_OFFSET = 50;

export function renderEyes(mood: State["mood"], outline: string): string {
  const lx = FACE_CX - EYE_OFFSET;
  const rx = FACE_CX + EYE_OFFSET;
  const stroke = `stroke="${outline}" stroke-width="3" fill="none"`;
  const fill = `fill="${outline}"`;

  switch (mood) {
    case "happy":
      return `
    <path d="M ${lx - 10} ${EYE_Y} Q ${lx} ${EYE_Y - 10} ${lx + 10} ${EYE_Y}" ${stroke}/>
    <path d="M ${rx - 10} ${EYE_Y} Q ${rx} ${EYE_Y - 10} ${rx + 10} ${EYE_Y}" ${stroke}/>`;

    case "excited":
      return `
    <circle cx="${lx}" cy="${EYE_Y}" r="9" ${fill}/>
    <circle cx="${rx}" cy="${EYE_Y}" r="9" ${fill}/>
    <circle cx="${lx + 2}" cy="${EYE_Y - 3}" r="2" fill="white"/>
    <circle cx="${rx + 2}" cy="${EYE_Y - 3}" r="2" fill="white"/>`;

    case "sad":
      return `
    <path d="M ${lx - 10} ${EYE_Y - 10} Q ${lx} ${EYE_Y} ${lx + 10} ${EYE_Y - 10}" ${stroke}/>
    <path d="M ${rx - 10} ${EYE_Y - 10} Q ${rx} ${EYE_Y} ${rx + 10} ${EYE_Y - 10}" ${stroke}/>
    <path d="M ${lx} ${EYE_Y + 5} L ${lx - 4} ${EYE_Y + 18}" stroke="#5BA8FF" stroke-width="3" fill="none"/>
    <path d="M ${rx} ${EYE_Y + 5} L ${rx + 4} ${EYE_Y + 18}" stroke="#5BA8FF" stroke-width="3" fill="none"/>`;

    case "sick":
      return `
    <path d="M ${lx - 8} ${EYE_Y - 8} L ${lx + 8} ${EYE_Y + 8} M ${lx + 8} ${EYE_Y - 8} L ${lx - 8} ${EYE_Y + 8}" stroke="${outline}" stroke-width="3"/>
    <path d="M ${rx - 8} ${EYE_Y - 8} L ${rx + 8} ${EYE_Y + 8} M ${rx + 8} ${EYE_Y - 8} L ${rx - 8} ${EYE_Y + 8}" stroke="${outline}" stroke-width="3"/>`;

    case "angry":
      return `
    <path d="M ${lx - 12} ${EYE_Y - 8} L ${lx + 12} ${EYE_Y + 4}" stroke="${outline}" stroke-width="4" stroke-linecap="round"/>
    <path d="M ${rx + 12} ${EYE_Y - 8} L ${rx - 12} ${EYE_Y + 4}" stroke="${outline}" stroke-width="4" stroke-linecap="round"/>`;

    case "sleepy":
      return `
    <path d="M ${lx - 10} ${EYE_Y} Q ${lx} ${EYE_Y + 6} ${lx + 10} ${EYE_Y}" ${stroke}/>
    <path d="M ${rx - 10} ${EYE_Y} Q ${rx} ${EYE_Y + 6} ${rx + 10} ${EYE_Y}" ${stroke}/>`;

    case "ghost":
      return `
    <circle cx="${lx}" cy="${EYE_Y}" r="10" fill="none" stroke="${outline}" stroke-width="2"/>
    <circle cx="${rx}" cy="${EYE_Y}" r="10" fill="none" stroke="${outline}" stroke-width="2"/>`;
  }
}
```

### - [ ] Step 2.3: Create parts/mouth.ts

Create `packages/render-svg/src/parts/mouth.ts` (verbatim from today's `parts.ts`):

```ts
import type { State } from "@repogotchi/contract";
import { FACE_CX } from "./eyes";

const MOUTH_Y = 220;

export function renderMouth(
  mood: State["mood"],
  happiness: number,
  outline: string,
): string {
  const stroke = `stroke="${outline}" stroke-width="3" fill="none"`;

  switch (mood) {
    case "happy": {
      const lift = Math.min(20, 8 + happiness / 8);
      return `<path d="M ${FACE_CX - 40} ${MOUTH_Y} Q ${FACE_CX} ${MOUTH_Y + lift} ${FACE_CX + 40} ${MOUTH_Y}" ${stroke}/>`;
    }
    case "excited":
      return `<ellipse cx="${FACE_CX}" cy="${MOUTH_Y + 8}" rx="22" ry="14" fill="${outline}"/>
    <ellipse cx="${FACE_CX}" cy="${MOUTH_Y + 4}" rx="14" ry="6" fill="#ff6b81"/>`;
    case "sad":
      return `<path d="M ${FACE_CX - 40} ${MOUTH_Y + 10} Q ${FACE_CX} ${MOUTH_Y - 10} ${FACE_CX + 40} ${MOUTH_Y + 10}" ${stroke}/>`;
    case "sick":
      return `<path d="M ${FACE_CX - 40} ${MOUTH_Y} q 10 -8 20 0 t 20 0 t 20 0" ${stroke}/>`;
    case "angry":
      return `<path d="M ${FACE_CX - 30} ${MOUTH_Y + 8} l 12 -10 l 12 10 l 12 -10 l 12 10" ${stroke} stroke-linejoin="miter"/>`;
    case "sleepy":
      return `<line x1="${FACE_CX - 12}" y1="${MOUTH_Y}" x2="${FACE_CX + 12}" y2="${MOUTH_Y}" stroke="${outline}" stroke-width="3" stroke-linecap="round"/>`;
    case "ghost":
      return `<circle cx="${FACE_CX}" cy="${MOUTH_Y + 4}" r="6" fill="${outline}"/>`;
  }
}
```

### - [ ] Step 2.4: Create parts/accessories.ts

Create `packages/render-svg/src/parts/accessories.ts` (verbatim from today's `parts.ts`):

```ts
import type { Pet, State } from "@repogotchi/contract";
import { EYE_OFFSET, EYE_Y, FACE_CX } from "./eyes";

interface AccessoryFlags {
  crown: boolean;
  glasses: boolean;
  sparkles: boolean;
  zzz: boolean;
}

export function pickAccessories(pet: Pet, state: State): AccessoryFlags {
  const traits = new Set(pet.traits);
  const stars = state.signals.stars ?? 0;
  const contributors = state.signals.contributors ?? 0;
  const lastCommit = state.signals.lastCommitDaysAgo ?? Number.POSITIVE_INFINITY;

  return {
    crown: stars >= 100 || traits.has("popular"),
    glasses: contributors >= 5 || traits.has("scholarly"),
    sparkles: lastCommit <= 7 || traits.has("active"),
    zzz: state.mood === "sleepy" || lastCommit > 30,
  };
}

export function renderAccessories(pet: Pet, state: State): string {
  const flags = pickAccessories(pet, state);
  const accent = pet.palette.accent;
  const outline = pet.palette.outline;
  const parts: string[] = [];

  if (flags.crown) {
    parts.push(`
    <g aria-label="crown">
      <path d="M 150 80 L 160 100 L 170 85 L 180 100 L 190 85 L 200 100 L 210 85 L 220 100 L 230 85 L 240 100 L 250 80 L 150 80 Z"
            fill="${accent}" stroke="${outline}" stroke-width="2"/>
      <circle cx="165" cy="85" r="4" fill="#FF6B6B"/>
      <circle cx="200" cy="80" r="4" fill="#FF6B6B"/>
      <circle cx="235" cy="85" r="4" fill="#FF6B6B"/>
    </g>`);
  }

  if (flags.glasses) {
    parts.push(`
    <g aria-label="glasses" opacity="0.85">
      <circle cx="${FACE_CX - EYE_OFFSET}" cy="${EYE_Y}" r="20" fill="none" stroke="${outline}" stroke-width="2"/>
      <circle cx="${FACE_CX + EYE_OFFSET}" cy="${EYE_Y}" r="20" fill="none" stroke="${outline}" stroke-width="2"/>
      <line x1="${FACE_CX - EYE_OFFSET + 20}" y1="${EYE_Y}" x2="${FACE_CX + EYE_OFFSET - 20}" y2="${EYE_Y}" stroke="${outline}" stroke-width="2"/>
    </g>`);
  }

  if (flags.sparkles) {
    parts.push(`
    <g aria-label="sparkles">
      <path d="M 320 120 L 325 130 L 330 120 L 325 110 Z" fill="${accent}"/>
      <path d="M 70 120 L 75 130 L 80 120 L 75 110 Z" fill="${accent}"/>
      <path d="M 200 50 L 205 60 L 210 50 L 205 40 Z" fill="${accent}"/>
    </g>`);
  }

  if (flags.zzz) {
    parts.push(`
    <g aria-label="zzz" font-family="monospace" font-weight="bold" fill="${outline}">
      <text x="290" y="100" font-size="22">Z</text>
      <text x="310" y="80" font-size="16">z</text>
      <text x="325" y="65" font-size="12">z</text>
    </g>`);
  }

  return parts.join("");
}
```

### - [ ] Step 2.5: Update index.ts imports

Modify `packages/render-svg/src/index.ts` — change the import block at the top:

```ts
import type { Pet, State } from "@repogotchi/contract";
import { escapeXmlAttr, escapeXmlText } from "./xml";
import { renderEyes } from "./parts/eyes";
import { renderMouth } from "./parts/mouth";
import { pickAccessories, renderAccessories } from "./parts/accessories";
```

…and update the bottom export to re-export `pickAccessories` from its new home:

```ts
export { pickAccessories } from "./parts/accessories";
```

### - [ ] Step 2.6: Delete the old parts.ts

```bash
git rm packages/render-svg/src/parts.ts
```

### - [ ] Step 2.7: Run tests — snapshot must stay byte-identical

```bash
pnpm --filter @repogotchi/render-svg test
```

Expected: all tests pass, snapshot unchanged. If snapshot diffs, you broke behavior — fix the move before continuing.

### - [ ] Step 2.8: Run typecheck

```bash
pnpm typecheck
```

Expected: no errors.

### - [ ] Step 2.9: Commit

```bash
git add packages/render-svg/src/xml.ts packages/render-svg/src/parts/ packages/render-svg/src/index.ts
git commit -m "refactor(render-svg): split parts.ts into focused modules

No behavior change: snapshot stays byte-identical. Splits XML escapes,
eyes, mouth, and accessories into separate files so the upcoming variation
work can land in narrow diffs.

Spec: docs/superpowers/specs/2026-05-03-pet-visuals-a-plus-b-design.md"
```

---

## Task 3: Wire variation into the renderer

Add `body.ts`, `ears.ts`, `cheeks.ts`, `trinket.ts`. Update `eyes.ts` to vary the neutral/happy/excited baseline by `eyeKind`. Update `index.ts` to derive variation and dispatch. The existing snapshot will update once because the canonical `PET` fixture (`id: a3f5b8c2d1e0`) now reads variation bytes.

**Files:**
- Create: `packages/render-svg/src/parts/body.ts`
- Create: `packages/render-svg/src/parts/ears.ts`
- Create: `packages/render-svg/src/parts/cheeks.ts`
- Create: `packages/render-svg/src/parts/trinket.ts`
- Modify: `packages/render-svg/src/parts/eyes.ts`
- Modify: `packages/render-svg/src/index.ts`
- Modify: `packages/render-svg/test/render.test.ts`
- Modify: `packages/render-svg/test/__snapshots__/render.test.ts.snap` (re-snapshot once)

### - [ ] Step 3.1: Body silhouettes

Create `packages/render-svg/src/parts/body.ts`:

```ts
import type { PetVariation } from "@repogotchi/core";

export const BODY_CX = 200;
export const BODY_CY = 180;

/**
 * Renders the body silhouette. Radius is the existing `health → 80..120`
 * scale; each silhouette interprets it consistently so health affects size
 * the same way across variants.
 */
export function renderBody(
  silhouette: PetVariation["silhouette"],
  radius: number,
  fillUrl: string,
  outline: string,
): string {
  const r = num(radius);
  const ry = num(radius * 1.1);

  switch (silhouette) {
    case "round":
      return `<ellipse cx="${BODY_CX}" cy="${BODY_CY}" rx="${r}" ry="${ry}" fill="${fillUrl}" stroke="${outline}" stroke-width="3"/>`;

    case "teardrop": {
      // Narrower top, wider bottom. Path traced clockwise from top.
      const top = num(BODY_CY - radius * 1.15);
      const left = num(BODY_CX - radius * 1.05);
      const right = num(BODY_CX + radius * 1.05);
      const bottom = num(BODY_CY + radius * 1.15);
      const topCtrl = num(radius * 0.55);
      return `<path d="M ${BODY_CX} ${top}
        C ${num(BODY_CX - parseFloat(topCtrl))} ${top}
          ${left} ${num(BODY_CY - radius * 0.3)}
          ${left} ${num(BODY_CY + radius * 0.2)}
        C ${left} ${bottom}
          ${right} ${bottom}
          ${right} ${num(BODY_CY + radius * 0.2)}
        C ${right} ${num(BODY_CY - radius * 0.3)}
          ${num(BODY_CX + parseFloat(topCtrl))} ${top}
          ${BODY_CX} ${top} Z"
        fill="${fillUrl}" stroke="${outline}" stroke-width="3"/>`;
    }

    case "oval-wide":
      // Squashed and wider; rx grows, ry shrinks proportionally.
      return `<ellipse cx="${BODY_CX}" cy="${BODY_CY}" rx="${num(radius * 1.25)}" ry="${num(radius * 0.85)}" fill="${fillUrl}" stroke="${outline}" stroke-width="3"/>`;

    case "lumpy": {
      // Round body with two soft side bumps.
      const left = num(BODY_CX - radius);
      const right = num(BODY_CX + radius);
      const top = num(BODY_CY - radius * 1.05);
      const bottom = num(BODY_CY + radius * 1.05);
      const bumpOut = num(radius * 0.25);
      return `<path d="M ${BODY_CX} ${top}
        C ${num(BODY_CX - radius * 0.6)} ${top}
          ${num(parseFloat(left) - parseFloat(bumpOut))} ${num(BODY_CY - radius * 0.3)}
          ${left} ${BODY_CY}
        C ${num(parseFloat(left) - parseFloat(bumpOut))} ${num(BODY_CY + radius * 0.5)}
          ${num(BODY_CX - radius * 0.6)} ${bottom}
          ${BODY_CX} ${bottom}
        C ${num(BODY_CX + radius * 0.6)} ${bottom}
          ${num(parseFloat(right) + parseFloat(bumpOut))} ${num(BODY_CY + radius * 0.5)}
          ${right} ${BODY_CY}
        C ${num(parseFloat(right) + parseFloat(bumpOut))} ${num(BODY_CY - radius * 0.3)}
          ${num(BODY_CX + radius * 0.6)} ${top}
          ${BODY_CX} ${top} Z"
        fill="${fillUrl}" stroke="${outline}" stroke-width="3"/>`;
    }
  }
}

function num(x: number): string {
  return Number(x.toFixed(2)).toString();
}
```

### - [ ] Step 3.2: Ears

Create `packages/render-svg/src/parts/ears.ts`:

```ts
import type { Pet } from "@repogotchi/contract";
import type { PetVariation } from "@repogotchi/core";
import { BODY_CX } from "./body";

const EAR_LX = BODY_CX - 60;
const EAR_RX = BODY_CX + 60;
const EAR_TOP_Y = 120;

export function renderEars(
  earKind: PetVariation["earKind"],
  pet: Pet,
): string {
  const fill = pet.palette.primary;
  const accent = pet.palette.accent;
  const outline = pet.palette.outline;

  switch (earKind) {
    case "pointed-2":
      return `
    <ellipse cx="${EAR_LX}" cy="${EAR_TOP_Y}" rx="25" ry="35" fill="${fill}" stroke="${outline}" stroke-width="2"/>
    <ellipse cx="${EAR_RX}" cy="${EAR_TOP_Y}" rx="25" ry="35" fill="${fill}" stroke="${outline}" stroke-width="2"/>`;

    case "round-2":
      return `
    <circle cx="${EAR_LX}" cy="${EAR_TOP_Y}" r="28" fill="${fill}" stroke="${outline}" stroke-width="2"/>
    <circle cx="${EAR_RX}" cy="${EAR_TOP_Y}" r="28" fill="${fill}" stroke="${outline}" stroke-width="2"/>`;

    case "floppy-2":
      return `
    <path d="M ${EAR_LX - 18} ${EAR_TOP_Y - 10} Q ${EAR_LX - 28} ${EAR_TOP_Y + 30} ${EAR_LX} ${EAR_TOP_Y + 38} Q ${EAR_LX + 14} ${EAR_TOP_Y + 10} ${EAR_LX - 18} ${EAR_TOP_Y - 10} Z" fill="${fill}" stroke="${outline}" stroke-width="2"/>
    <path d="M ${EAR_RX + 18} ${EAR_TOP_Y - 10} Q ${EAR_RX + 28} ${EAR_TOP_Y + 30} ${EAR_RX} ${EAR_TOP_Y + 38} Q ${EAR_RX - 14} ${EAR_TOP_Y + 10} ${EAR_RX + 18} ${EAR_TOP_Y - 10} Z" fill="${fill}" stroke="${outline}" stroke-width="2"/>`;

    case "tuft-3":
      return `
    <path d="M ${BODY_CX - 30} 90 L ${BODY_CX - 18} 70 L ${BODY_CX - 6} 90 Z" fill="${fill}" stroke="${outline}" stroke-width="2"/>
    <path d="M ${BODY_CX - 8} 85 L ${BODY_CX} 60 L ${BODY_CX + 8} 85 Z" fill="${fill}" stroke="${outline}" stroke-width="2"/>
    <path d="M ${BODY_CX + 6} 90 L ${BODY_CX + 18} 70 L ${BODY_CX + 30} 90 Z" fill="${fill}" stroke="${outline}" stroke-width="2"/>`;

    case "none":
      return `
    <circle cx="${BODY_CX}" cy="80" r="3" fill="${outline}"/>
    <line x1="${BODY_CX}" y1="80" x2="${BODY_CX}" y2="95" stroke="${outline}" stroke-width="2"/>`;

    case "horn-2":
      return `
    <path d="M ${EAR_LX - 8} ${EAR_TOP_Y - 5} L ${EAR_LX} ${EAR_TOP_Y - 38} L ${EAR_LX + 8} ${EAR_TOP_Y - 5} Z" fill="${accent}" stroke="${outline}" stroke-width="2"/>
    <path d="M ${EAR_RX - 8} ${EAR_TOP_Y - 5} L ${EAR_RX} ${EAR_TOP_Y - 38} L ${EAR_RX + 8} ${EAR_TOP_Y - 5} Z" fill="${accent}" stroke="${outline}" stroke-width="2"/>`;
  }
}
```

### - [ ] Step 3.3: Cheeks

Create `packages/render-svg/src/parts/cheeks.ts`:

```ts
import type { Pet } from "@repogotchi/contract";
import type { PetVariation } from "@repogotchi/core";
import { BODY_CX, BODY_CY } from "./body";

const CHEEK_Y = BODY_CY + 10;
const CHEEK_OFFSET = 80;

export function renderCheeks(
  cheekKind: PetVariation["cheekKind"],
  pet: Pet,
): string {
  switch (cheekKind) {
    case "blush-pink":
      return `
    <ellipse cx="${BODY_CX - CHEEK_OFFSET}" cy="${CHEEK_Y}" rx="14" ry="9" fill="#FFB6C1" opacity="0.55"/>
    <ellipse cx="${BODY_CX + CHEEK_OFFSET}" cy="${CHEEK_Y}" rx="14" ry="9" fill="#FFB6C1" opacity="0.55"/>`;

    case "freckles": {
      const accent = pet.palette.accent;
      return `
    <g opacity="0.7" fill="${accent}">
      <circle cx="${BODY_CX - CHEEK_OFFSET - 6}" cy="${CHEEK_Y - 4}" r="2"/>
      <circle cx="${BODY_CX - CHEEK_OFFSET + 2}" cy="${CHEEK_Y + 2}" r="2"/>
      <circle cx="${BODY_CX - CHEEK_OFFSET + 8}" cy="${CHEEK_Y - 2}" r="2"/>
      <circle cx="${BODY_CX + CHEEK_OFFSET - 8}" cy="${CHEEK_Y - 2}" r="2"/>
      <circle cx="${BODY_CX + CHEEK_OFFSET - 2}" cy="${CHEEK_Y + 2}" r="2"/>
      <circle cx="${BODY_CX + CHEEK_OFFSET + 6}" cy="${CHEEK_Y - 4}" r="2"/>
    </g>`;
    }

    case "none":
      return "";
  }
}
```

### - [ ] Step 3.4: Trinket

Create `packages/render-svg/src/parts/trinket.ts`:

```ts
import type { Pet } from "@repogotchi/contract";
import type { PetVariation } from "@repogotchi/core";
import { BODY_CX, BODY_CY } from "./body";

export function renderTrinket(
  trinket: PetVariation["trinket"],
  pet: Pet,
): string {
  const accent = pet.palette.accent;
  const outline = pet.palette.outline;

  switch (trinket) {
    case "collar":
      return `
    <g aria-label="collar">
      <path d="M ${BODY_CX - 70} ${BODY_CY + 60} Q ${BODY_CX} ${BODY_CY + 78} ${BODY_CX + 70} ${BODY_CY + 60}" stroke="${accent}" stroke-width="6" fill="none" stroke-linecap="round"/>
      <circle cx="${BODY_CX}" cy="${BODY_CY + 78}" r="5" fill="${accent}" stroke="${outline}" stroke-width="1.5"/>
    </g>`;

    case "bowtie":
      return `
    <g aria-label="bowtie">
      <path d="M ${BODY_CX - 22} ${BODY_CY + 70} L ${BODY_CX - 6} ${BODY_CY + 64} L ${BODY_CX - 6} ${BODY_CY + 80} Z" fill="${accent}" stroke="${outline}" stroke-width="1.5"/>
      <path d="M ${BODY_CX + 22} ${BODY_CY + 70} L ${BODY_CX + 6} ${BODY_CY + 64} L ${BODY_CX + 6} ${BODY_CY + 80} Z" fill="${accent}" stroke="${outline}" stroke-width="1.5"/>
      <rect x="${BODY_CX - 6}" y="${BODY_CY + 66}" width="12" height="12" rx="2" fill="${accent}" stroke="${outline}" stroke-width="1.5"/>
    </g>`;

    case "belly-patch":
      return `<ellipse aria-label="belly-patch" cx="${BODY_CX}" cy="${BODY_CY + 30}" rx="34" ry="22" fill="white" opacity="0.35"/>`;

    case "tail-tuft":
      return `
    <g aria-label="tail-tuft">
      <path d="M ${BODY_CX + 95} ${BODY_CY + 45} Q ${BODY_CX + 120} ${BODY_CY + 30} ${BODY_CX + 130} ${BODY_CY + 50} Q ${BODY_CX + 120} ${BODY_CY + 60} ${BODY_CX + 95} ${BODY_CY + 45} Z" fill="${pet.palette.secondary}" stroke="${outline}" stroke-width="2"/>
    </g>`;

    case "whisker-3":
      return `
    <g aria-label="whisker-3" stroke="${outline}" stroke-width="1.5" stroke-linecap="round">
      <line x1="${BODY_CX - 90}" y1="${BODY_CY - 5}" x2="${BODY_CX - 60}" y2="${BODY_CY - 8}"/>
      <line x1="${BODY_CX - 92}" y1="${BODY_CY + 5}" x2="${BODY_CX - 60}" y2="${BODY_CY + 4}"/>
      <line x1="${BODY_CX - 88}" y1="${BODY_CY + 14}" x2="${BODY_CX - 60}" y2="${BODY_CY + 14}"/>
      <line x1="${BODY_CX + 60}" y1="${BODY_CY - 8}" x2="${BODY_CX + 90}" y2="${BODY_CY - 5}"/>
      <line x1="${BODY_CX + 60}" y1="${BODY_CY + 4}" x2="${BODY_CX + 92}" y2="${BODY_CY + 5}"/>
      <line x1="${BODY_CX + 60}" y1="${BODY_CY + 14}" x2="${BODY_CX + 88}" y2="${BODY_CY + 14}"/>
    </g>`;

    case "none":
      return "";
  }
}
```

### - [ ] Step 3.5: Update eyes.ts to take eyeKind

Modify `packages/render-svg/src/parts/eyes.ts`. Mood overrides win for sad/sick/sleepy/angry/ghost; only the neutral/happy/excited baseline reads `eyeKind`. Change `renderEyes` signature:

```ts
import type { State } from "@repogotchi/contract";
import type { PetVariation } from "@repogotchi/core";

export const FACE_CX = 200;
export const EYE_Y = 160;
export const EYE_OFFSET = 50;

export function renderEyes(
  mood: State["mood"],
  eyeKind: PetVariation["eyeKind"],
  outline: string,
): string {
  const lx = FACE_CX - EYE_OFFSET;
  const rx = FACE_CX + EYE_OFFSET;
  const stroke = `stroke="${outline}" stroke-width="3" fill="none"`;

  // Mood overrides for the expressive moods. These ignore eyeKind because
  // their visual identity (tears, X-eyes, slits) is mood-specific.
  switch (mood) {
    case "sad":
      return `
    <path d="M ${lx - 10} ${EYE_Y - 10} Q ${lx} ${EYE_Y} ${lx + 10} ${EYE_Y - 10}" ${stroke}/>
    <path d="M ${rx - 10} ${EYE_Y - 10} Q ${rx} ${EYE_Y} ${rx + 10} ${EYE_Y - 10}" ${stroke}/>
    <path d="M ${lx} ${EYE_Y + 5} L ${lx - 4} ${EYE_Y + 18}" stroke="#5BA8FF" stroke-width="3" fill="none"/>
    <path d="M ${rx} ${EYE_Y + 5} L ${rx + 4} ${EYE_Y + 18}" stroke="#5BA8FF" stroke-width="3" fill="none"/>`;

    case "sick":
      return `
    <path d="M ${lx - 8} ${EYE_Y - 8} L ${lx + 8} ${EYE_Y + 8} M ${lx + 8} ${EYE_Y - 8} L ${lx - 8} ${EYE_Y + 8}" stroke="${outline}" stroke-width="3"/>
    <path d="M ${rx - 8} ${EYE_Y - 8} L ${rx + 8} ${EYE_Y + 8} M ${rx + 8} ${EYE_Y - 8} L ${rx - 8} ${EYE_Y + 8}" stroke="${outline}" stroke-width="3"/>`;

    case "angry":
      return `
    <path d="M ${lx - 12} ${EYE_Y - 8} L ${lx + 12} ${EYE_Y + 4}" stroke="${outline}" stroke-width="4" stroke-linecap="round"/>
    <path d="M ${rx + 12} ${EYE_Y - 8} L ${rx - 12} ${EYE_Y + 4}" stroke="${outline}" stroke-width="4" stroke-linecap="round"/>`;

    case "sleepy":
      return `
    <path d="M ${lx - 10} ${EYE_Y} Q ${lx} ${EYE_Y + 6} ${lx + 10} ${EYE_Y}" ${stroke}/>
    <path d="M ${rx - 10} ${EYE_Y} Q ${rx} ${EYE_Y + 6} ${rx + 10} ${EYE_Y}" ${stroke}/>`;

    case "ghost":
      return `
    <circle cx="${lx}" cy="${EYE_Y}" r="10" fill="none" stroke="${outline}" stroke-width="2"/>
    <circle cx="${rx}" cy="${EYE_Y}" r="10" fill="none" stroke="${outline}" stroke-width="2"/>`;

    // Baseline moods read eyeKind.
    case "happy":
    case "excited":
    default:
      return baselineEyes(eyeKind, lx, rx, outline, mood === "excited");
  }
}

function baselineEyes(
  eyeKind: PetVariation["eyeKind"],
  lx: number,
  rx: number,
  outline: string,
  hyped: boolean,
): string {
  switch (eyeKind) {
    case "round": {
      // Today's "excited" baseline applied to the open-eyed moods.
      if (hyped) {
        return `
    <circle cx="${lx}" cy="${EYE_Y}" r="9" fill="${outline}"/>
    <circle cx="${rx}" cy="${EYE_Y}" r="9" fill="${outline}"/>
    <circle cx="${lx + 2}" cy="${EYE_Y - 3}" r="2" fill="white"/>
    <circle cx="${rx + 2}" cy="${EYE_Y - 3}" r="2" fill="white"/>`;
      }
      return `
    <path d="M ${lx - 10} ${EYE_Y} Q ${lx} ${EYE_Y - 10} ${lx + 10} ${EYE_Y}" stroke="${outline}" stroke-width="3" fill="none"/>
    <path d="M ${rx - 10} ${EYE_Y} Q ${rx} ${EYE_Y - 10} ${rx + 10} ${EYE_Y}" stroke="${outline}" stroke-width="3" fill="none"/>`;
    }

    case "almond":
      return `
    <ellipse cx="${lx}" cy="${EYE_Y}" rx="10" ry="5" fill="none" stroke="${outline}" stroke-width="2.5"/>
    <ellipse cx="${rx}" cy="${EYE_Y}" rx="10" ry="5" fill="none" stroke="${outline}" stroke-width="2.5"/>
    <circle cx="${lx}" cy="${EYE_Y}" r="2.5" fill="${outline}"/>
    <circle cx="${rx}" cy="${EYE_Y}" r="2.5" fill="${outline}"/>`;

    case "bead":
      return `
    <circle cx="${lx}" cy="${EYE_Y}" r="4" fill="${outline}"/>
    <circle cx="${rx}" cy="${EYE_Y}" r="4" fill="${outline}"/>`;

    case "wide":
      return `
    <ellipse cx="${lx}" cy="${EYE_Y}" rx="11" ry="13" fill="white" stroke="${outline}" stroke-width="2"/>
    <ellipse cx="${rx}" cy="${EYE_Y}" rx="11" ry="13" fill="white" stroke="${outline}" stroke-width="2"/>
    <ellipse cx="${lx}" cy="${EYE_Y + 1}" rx="3" ry="6" fill="${outline}"/>
    <ellipse cx="${rx}" cy="${EYE_Y + 1}" rx="3" ry="6" fill="${outline}"/>`;
  }
}
```

### - [ ] Step 3.6: Update index.ts orchestrator

Replace the body of `renderPet` in `packages/render-svg/src/index.ts`. The full file becomes:

```ts
import type { Pet, State } from "@repogotchi/contract";
import { derivePetVariation } from "@repogotchi/core";
import { renderAccessories } from "./parts/accessories";
import { renderBody } from "./parts/body";
import { renderCheeks } from "./parts/cheeks";
import { renderEars } from "./parts/ears";
import { renderEyes } from "./parts/eyes";
import { renderMouth } from "./parts/mouth";
import { renderTrinket } from "./parts/trinket";
import { escapeXmlAttr, escapeXmlText } from "./xml";

export interface RenderOptions {
  /** Output width/height in px. Always renders into a 400x400 viewBox. Default 400. */
  size?: number;
  /** CSS color for the background rect. Default "transparent". */
  background?: string;
}

export interface RenderResult {
  svg: string;
  width: number;
  height: number;
}

export function renderPet(
  pet: Pet,
  state: State,
  opts: RenderOptions = {},
): RenderResult {
  const size = opts.size ?? 400;
  const bg = opts.background ?? "transparent";

  const variation = derivePetVariation(pet);
  const { primary, secondary, outline } = pet.palette;

  const isGhost = state.mood === "ghost" || state.signals.isArchived === true;
  const groupOpacity = isGhost ? 0.55 : 1;

  const radius = 80 + (clamp(state.scores.health, 0, 100) / 100) * 40;

  const gradId = `body-${pet.id}`;
  const ariaLabel = `${pet.name}: ${state.statusHeadline} (${state.mood}, level ${state.level})`;

  const body = renderBody(variation.silhouette, radius, `url(#${gradId})`, outline);
  const ears = renderEars(variation.earKind, pet);
  const cheeks = renderCheeks(variation.cheekKind, pet);
  const trinket = renderTrinket(variation.trinket, pet);
  const eyes = renderEyes(state.mood, variation.eyeKind, outline);
  const mouth = renderMouth(state.mood, state.scores.happiness, outline);
  const accessories = renderAccessories(pet, state);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 400 400" role="img" aria-label="${escapeXmlAttr(ariaLabel)}">
  <title>${escapeXmlText(pet.name)}</title>
  <desc>${escapeXmlText(state.statusHeadline)}</desc>
  <defs>
    <radialGradient id="${gradId}">
      <stop offset="0%" stop-color="${secondary}"/>
      <stop offset="100%" stop-color="${primary}"/>
    </radialGradient>
  </defs>
  <rect width="400" height="400" fill="${bg}"/>
  <g opacity="${groupOpacity}">
    ${body}
    ${cheeks}
    ${eyes}
    ${mouth}
    ${trinket}
    ${ears}${accessories}
  </g>
</svg>`;

  return { svg, width: size, height: size };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export { pickAccessories } from "./parts/accessories";
```

Z-order: body → cheeks → eyes → mouth → trinket → ears → accessories. (Ears layer over body so floppy ears overlap correctly; accessories sit on top of everything.)

### - [ ] Step 3.7: Add variation tests in render.test.ts

Append these to `packages/render-svg/test/render.test.ts`:

```ts
import { derivePetVariation } from "@repogotchi/core";

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
    expect(sadSvg).toContain("#5BA8FF");
  });

  it("cheeks 'none' produces no blush ovals", () => {
    const id = "000000000020"; // cheekKind = none
    expect(derivePetVariation({ ...PET, id }).cheekKind).toBe("none");
    const { svg } = renderPet({ ...PET, id }, makeState());
    expect(svg).not.toContain("#FFB6C1");
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
```

### - [ ] Step 3.8: Re-snapshot

The canonical `PET` fixture (`id: a3f5b8c2d1e0`) reads variation bytes
(byte-pairs are `a3 | f5 | b8 | c2 | d1 | e0`):
- byte 2 = 0xb8 (184), % 4 = 0 → silhouette `round`
- byte 3 = 0xc2 (194), % 6 = 2 → earKind `floppy-2`
- byte 4 = 0xd1 (209), % 4 = 1 → eyeKind `almond`
- byte 5 = 0xe0, hi=0xe (14) %3 = 2 → cheek `none`, lo=0x0 → trinket `collar`

So the existing snapshot will diff. Update it:

```bash
pnpm --filter @repogotchi/render-svg test -- -u
```

Verify the diff manually: open `packages/render-svg/test/__snapshots__/render.test.ts.snap` and confirm the canonical pet now has a round body ellipse, floppy ear paths (Q-curve, not simple ellipses), almond eyes (ellipses with center pupils), no blush/freckles, and a `<g aria-label="collar">`. Reject and revisit if any of those are missing.

### - [ ] Step 3.9: Run full tests + typecheck

```bash
pnpm test
pnpm typecheck
```

Expected: all green.

### - [ ] Step 3.10: Commit

```bash
git add packages/render-svg/src/parts/ packages/render-svg/src/index.ts packages/render-svg/test/render.test.ts packages/render-svg/test/__snapshots__/render.test.ts.snap
git commit -m "feat(render-svg): identity-driven variation — silhouette, ears, eyes, cheeks, trinket

Wires derivePetVariation into the renderer: body silhouette (4), ears (6),
eye baseline (4), cheeks (3), trinket (6) — 1,728 base looks before palette
and mood. Mood-overridden eyes still win for sad/sick/sleepy/angry/ghost.

Snapshot updated once for the canonical fixture pet, which now reads its
variation bytes (teardrop, floppy ears, bead eyes, freckles, bowtie).

Spec: docs/superpowers/specs/2026-05-03-pet-visuals-a-plus-b-design.md"
```

---

## Task 4: Theme option (`auto` / `light` / `dark`)

Add a `<style>` block with CSS custom properties that swap on
`prefers-color-scheme: dark`. Replace literal outline / blush / tear color
attributes with `var(--…)` references in the parts that use them.

**Files:**
- Create: `packages/render-svg/src/theme.ts`
- Modify: `packages/render-svg/src/parts/eyes.ts` — replace literal `#5BA8FF` (sad tears) with `var(--tear)`.
- Modify: `packages/render-svg/src/parts/cheeks.ts` — replace literal `#FFB6C1` with `var(--blush)`.
- Modify: `packages/render-svg/src/index.ts` — accept `theme` option, emit style block, route outline through CSS var.
- Modify: `packages/render-svg/test/render.test.ts` — theme tests + snapshot matrix.

### - [ ] Step 4.1: Add theme.ts

Create `packages/render-svg/src/theme.ts`:

```ts
export type Theme = "auto" | "light" | "dark";

export interface ResolvedTheme {
  /** Inline <style> block content for the SVG. */
  styleBlock: string;
}

const LIGHT = {
  outline: "#1A1A1A",
  blush: "#FFB6C1",
  tear: "#5BA8FF",
};
const DARK = {
  outline: "#E8E8E8",
  blush: "#FF8FA3",
  tear: "#87C5FF",
};

export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "auto") {
    return {
      styleBlock: `<style>
    :root { --outline: ${LIGHT.outline}; --blush: ${LIGHT.blush}; --tear: ${LIGHT.tear}; }
    @media (prefers-color-scheme: dark) {
      :root { --outline: ${DARK.outline}; --blush: ${DARK.blush}; --tear: ${DARK.tear}; }
    }
  </style>`,
    };
  }
  const v = theme === "dark" ? DARK : LIGHT;
  return {
    styleBlock: `<style>
    :root { --outline: ${v.outline}; --blush: ${v.blush}; --tear: ${v.tear}; }
  </style>`,
  };
}
```

### - [ ] Step 4.2: Route outline through `var(--outline)` in cheeks/eyes

The existing parts take `outline` as a string parameter. To preserve the option for callers to pass a literal hex (and to make the theme-driven path explicit), the orchestrator passes `"var(--outline)"` as the outline string when theming is in effect. No change inside parts — they just inline whatever string is passed.

Modify `packages/render-svg/src/parts/cheeks.ts` `blush-pink` branch — replace the literal:

```ts
    case "blush-pink":
      return `
    <ellipse cx="${BODY_CX - CHEEK_OFFSET}" cy="${CHEEK_Y}" rx="14" ry="9" fill="var(--blush)" opacity="0.7"/>
    <ellipse cx="${BODY_CX + CHEEK_OFFSET}" cy="${CHEEK_Y}" rx="14" ry="9" fill="var(--blush)" opacity="0.7"/>`;
```

(Opacity bumped from 0.55 → 0.7 to compensate for the blush color shifting in dark mode.)

Modify `packages/render-svg/src/parts/eyes.ts` `sad` branch — replace literal `#5BA8FF` with `var(--tear)`:

```ts
    case "sad":
      return `
    <path d="M ${lx - 10} ${EYE_Y - 10} Q ${lx} ${EYE_Y} ${lx + 10} ${EYE_Y - 10}" ${stroke}/>
    <path d="M ${rx - 10} ${EYE_Y - 10} Q ${rx} ${EYE_Y} ${rx + 10} ${EYE_Y - 10}" ${stroke}/>
    <path d="M ${lx} ${EYE_Y + 5} L ${lx - 4} ${EYE_Y + 18}" stroke="var(--tear)" stroke-width="3" fill="none"/>
    <path d="M ${rx} ${EYE_Y + 5} L ${rx + 4} ${EYE_Y + 18}" stroke="var(--tear)" stroke-width="3" fill="none"/>`;
```

### - [ ] Step 4.3: Wire theme into index.ts

Modify `packages/render-svg/src/index.ts`. Add the option, resolve it, emit the style block, swap outline:

```ts
import { resolveTheme, type Theme } from "./theme";

export interface RenderOptions {
  size?: number;
  background?: string;
  theme?: Theme; // NEW; default "auto"
}

// inside renderPet, near the top:
const theme = opts.theme ?? "auto";
const { styleBlock } = resolveTheme(theme);

// outline used by parts becomes the CSS variable:
const themedOutline = "var(--outline)";

// Update calls:
const body = renderBody(variation.silhouette, radius, `url(#${gradId})`, themedOutline);
const ears = renderEars(variation.earKind, pet);
const cheeks = renderCheeks(variation.cheekKind, pet);
const trinket = renderTrinket(variation.trinket, pet);
const eyes = renderEyes(state.mood, variation.eyeKind, themedOutline);
const mouth = renderMouth(state.mood, state.scores.happiness, themedOutline);
const accessories = renderAccessories(pet, state);
```

**Important:** ears, trinket, and accessories also use `pet.palette.outline` internally — those are *identity* outlines, not theme-swapped. Keep them as `pet.palette.outline`. Only the *facial outline* and stroke that surrounds the body shifts on theme. (This is a deliberate choice; the pet's identity stays consistent across themes, only its line-art weight against the background adjusts.)

Actually, simpler: route everything outline-related through `themedOutline`, since the whole point of theming is to keep the line art legible on dark backgrounds. Update `renderEars`, `renderTrinket`, and `renderAccessories` to take `outline` as a parameter rather than reading from `pet.palette.outline`:

Modify `parts/ears.ts`:

```ts
export function renderEars(
  earKind: PetVariation["earKind"],
  pet: Pet,
  outline: string,
): string {
  const fill = pet.palette.primary;
  const accent = pet.palette.accent;
  // ...rest unchanged, replace pet.palette.outline references with `outline`
}
```

Modify `parts/trinket.ts`:

```ts
export function renderTrinket(
  trinket: PetVariation["trinket"],
  pet: Pet,
  outline: string,
): string {
  const accent = pet.palette.accent;
  // ...rest unchanged, replace pet.palette.outline references with `outline`
}
```

Modify `parts/accessories.ts`:

```ts
export function renderAccessories(
  pet: Pet,
  state: State,
  outline: string,
): string {
  const flags = pickAccessories(pet, state);
  const accent = pet.palette.accent;
  // ...rest unchanged, replace pet.palette.outline references with `outline`
}
```

Update the `index.ts` calls to pass `themedOutline`:

```ts
const body = renderBody(variation.silhouette, radius, `url(#${gradId})`, themedOutline);
const ears = renderEars(variation.earKind, pet, themedOutline);
const cheeks = renderCheeks(variation.cheekKind, pet);
const trinket = renderTrinket(variation.trinket, pet, themedOutline);
const eyes = renderEyes(state.mood, variation.eyeKind, themedOutline);
const mouth = renderMouth(state.mood, state.scores.happiness, themedOutline);
const accessories = renderAccessories(pet, state, themedOutline);
```

Insert the styleBlock right after `<svg ...>` (before `<title>`):

```ts
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 400 400" role="img" aria-label="${escapeXmlAttr(ariaLabel)}">
  ${styleBlock}
  <title>${escapeXmlText(pet.name)}</title>
  ...`;
```

### - [ ] Step 4.4: Theme tests

Append to `packages/render-svg/test/render.test.ts`:

```ts
describe("theme", () => {
  it("auto theme emits a prefers-color-scheme media query", () => {
    const { svg } = renderPet(PET, makeState());
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
```

### - [ ] Step 4.5: Re-snapshot

```bash
pnpm --filter @repogotchi/render-svg test -- -u
```

Verify the snapshot diff: it should add the `<style>` block and change literal `#1A1A1A` strokes to `var(--outline)`. Visual identity unchanged on light backgrounds.

### - [ ] Step 4.6: Run full tests + typecheck

```bash
pnpm test
pnpm typecheck
```

### - [ ] Step 4.7: Commit

```bash
git add packages/render-svg/src/theme.ts packages/render-svg/src/parts/ packages/render-svg/src/index.ts packages/render-svg/test/render.test.ts packages/render-svg/test/__snapshots__/render.test.ts.snap
git commit -m "feat(render-svg): theme option — prefers-color-scheme dark mode support

Adds a <style> block with --outline / --blush / --tear CSS variables that
swap on prefers-color-scheme: dark. theme: 'auto' (default) emits the media
query; 'light'/'dark' emit a single :root for surfaces that know their
context (e.g. macOS menubar). Pet's identity palette (primary/secondary/
accent) is never theme-swapped.

Spec: docs/superpowers/specs/2026-05-03-pet-visuals-a-plus-b-design.md"
```

---

## Task 5: Detail option (`auto` / `full` / `compact`) + compact viewBox

Compact mode tightens the viewBox, drops cheeks / trinket / sparkles / zzz / glasses, simplifies crown to a solid silhouette, simplifies ears, and forces `eyeKind = bead` for non-mood-overridden moods. `auto` resolves to `compact` when `size <= 64`.

**Files:**
- Modify: `packages/render-svg/src/theme.ts` — add detail resolution helper.
- Modify: `packages/render-svg/src/parts/accessories.ts` — accept a `detail` flag and gate layers.
- Modify: `packages/render-svg/src/parts/ears.ts` — accept a `detail` flag for simplified rendering.
- Modify: `packages/render-svg/src/index.ts` — accept `detail` option, gate layers, swap viewBox.
- Modify: `packages/render-svg/test/render.test.ts` — detail tests + cross-mode invariants.

### - [ ] Step 5.1: Add detail resolution to theme.ts

Modify `packages/render-svg/src/theme.ts` (append):

```ts
export type Detail = "auto" | "full" | "compact";

export function resolveDetail(detail: Detail, size: number): "full" | "compact" {
  if (detail === "auto") return size <= 64 ? "compact" : "full";
  return detail;
}
```

### - [ ] Step 5.2: Accessories — gate by detail

Modify `packages/render-svg/src/parts/accessories.ts`:

```ts
export function renderAccessories(
  pet: Pet,
  state: State,
  outline: string,
  detail: "full" | "compact",
): string {
  const flags = pickAccessories(pet, state);
  const accent = pet.palette.accent;
  const parts: string[] = [];

  if (flags.crown) {
    if (detail === "compact") {
      // Solid silhouette only — no inner gem dots.
      parts.push(`
    <g aria-label="crown">
      <path d="M 150 80 L 160 100 L 170 85 L 180 100 L 190 85 L 200 100 L 210 85 L 220 100 L 230 85 L 240 100 L 250 80 L 150 80 Z"
            fill="${accent}" stroke="${outline}" stroke-width="2"/>
    </g>`);
    } else {
      parts.push(`
    <g aria-label="crown">
      <path d="M 150 80 L 160 100 L 170 85 L 180 100 L 190 85 L 200 100 L 210 85 L 220 100 L 230 85 L 240 100 L 250 80 L 150 80 Z"
            fill="${accent}" stroke="${outline}" stroke-width="2"/>
      <circle cx="165" cy="85" r="4" fill="#FF6B6B"/>
      <circle cx="200" cy="80" r="4" fill="#FF6B6B"/>
      <circle cx="235" cy="85" r="4" fill="#FF6B6B"/>
    </g>`);
    }
  }

  if (flags.glasses && detail === "full") {
    parts.push(`
    <g aria-label="glasses" opacity="0.85">
      <circle cx="${FACE_CX - EYE_OFFSET}" cy="${EYE_Y}" r="20" fill="none" stroke="${outline}" stroke-width="2"/>
      <circle cx="${FACE_CX + EYE_OFFSET}" cy="${EYE_Y}" r="20" fill="none" stroke="${outline}" stroke-width="2"/>
      <line x1="${FACE_CX - EYE_OFFSET + 20}" y1="${EYE_Y}" x2="${FACE_CX + EYE_OFFSET - 20}" y2="${EYE_Y}" stroke="${outline}" stroke-width="2"/>
    </g>`);
  }

  if (flags.sparkles && detail === "full") {
    parts.push(`
    <g aria-label="sparkles">
      <path d="M 320 120 L 325 130 L 330 120 L 325 110 Z" fill="${accent}"/>
      <path d="M 70 120 L 75 130 L 80 120 L 75 110 Z" fill="${accent}"/>
      <path d="M 200 50 L 205 60 L 210 50 L 205 40 Z" fill="${accent}"/>
    </g>`);
  }

  if (flags.zzz && detail === "full") {
    parts.push(`
    <g aria-label="zzz" font-family="monospace" font-weight="bold" fill="${outline}">
      <text x="290" y="100" font-size="22">Z</text>
      <text x="310" y="80" font-size="16">z</text>
      <text x="325" y="65" font-size="12">z</text>
    </g>`);
  }

  return parts.join("");
}
```

### - [ ] Step 5.3: Ears — simplify in compact

Modify `parts/ears.ts` to accept a `detail` flag. In `compact`:
- `pointed-2`, `round-2`, `floppy-2`, `horn-2` keep their basic shapes but drop the stroke (or thin it via `vector-effect="non-scaling-stroke"`).
- `tuft-3` collapses to `pointed-2`.
- `none` keeps the antenna dot.

Simpler implementation: in `compact`, fall through to a smaller switch:

```ts
export function renderEars(
  earKind: PetVariation["earKind"],
  pet: Pet,
  outline: string,
  detail: "full" | "compact",
): string {
  const fill = pet.palette.primary;
  const accent = pet.palette.accent;

  if (detail === "compact") {
    switch (earKind) {
      case "none":
        return `
    <circle cx="${BODY_CX}" cy="80" r="3" fill="${outline}"/>`;
      case "horn-2":
        return `
    <path d="M ${EAR_LX - 6} ${EAR_TOP_Y - 5} L ${EAR_LX} ${EAR_TOP_Y - 30} L ${EAR_LX + 6} ${EAR_TOP_Y - 5} Z" fill="${accent}"/>
    <path d="M ${EAR_RX - 6} ${EAR_TOP_Y - 5} L ${EAR_RX} ${EAR_TOP_Y - 30} L ${EAR_RX + 6} ${EAR_TOP_Y - 5} Z" fill="${accent}"/>`;
      default:
        // pointed-2 / round-2 / floppy-2 / tuft-3 → simple round dots
        return `
    <circle cx="${EAR_LX}" cy="${EAR_TOP_Y}" r="22" fill="${fill}"/>
    <circle cx="${EAR_RX}" cy="${EAR_TOP_Y}" r="22" fill="${fill}"/>`;
    }
  }

  // full mode — existing switch from Task 3
  switch (earKind) {
    // ...all six cases unchanged
  }
}
```

### - [ ] Step 5.4: Force eyeKind = bead in compact

Modify `index.ts` so that when detail = compact, the eyeKind passed to renderEyes is `bead` (mood-overridden eyes are unaffected because they short-circuit before reading eyeKind):

```ts
const detail = resolveDetail(opts.detail ?? "auto", size);
const effectiveEyeKind = detail === "compact" ? "bead" : variation.eyeKind;
const eyes = renderEyes(state.mood, effectiveEyeKind, themedOutline);
```

### - [ ] Step 5.5: Compact viewBox + gate cheeks/trinket

Modify `index.ts`:

```ts
const viewBox = detail === "compact" ? "40 40 320 320" : "0 0 400 400";

const cheeks = detail === "compact" ? "" : renderCheeks(variation.cheekKind, pet);
const trinket = detail === "compact" ? "" : renderTrinket(variation.trinket, pet, themedOutline);

// rect background covers the canonical 0..400 area regardless; the viewBox
// crops it. Keep the rect as-is.

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}" role="img" aria-label="${escapeXmlAttr(ariaLabel)}">
  ${styleBlock}
  ...
```

Update `renderEars` and `renderAccessories` calls to pass `detail`:

```ts
const ears = renderEars(variation.earKind, pet, themedOutline, detail);
const accessories = renderAccessories(pet, state, themedOutline, detail);
```

### - [ ] Step 5.6: Add non-scaling strokes

In `parts/body.ts`, append `vector-effect="non-scaling-stroke"` to body strokes so they read crisply at every render size. Apply to the body and all stroke-bearing parts in the same edit pass — body, ears (full + compact), trinket strokes, accessories outlines. (Cheap one-line additions.)

For brevity here: search-and-replace `stroke-width="3"` and `stroke-width="2"` inside the parts modules, replacing each with `stroke-width="3" vector-effect="non-scaling-stroke"` (or the relevant width). Verify each file:

```bash
grep -rn 'stroke-width=' packages/render-svg/src/
```

For each match, ensure `vector-effect="non-scaling-stroke"` is present on the same element (or remove non-scaling-stroke for elements where scaling is fine — e.g. eye paths benefit from scaling because their detail is small). Simpler rule: apply `vector-effect="non-scaling-stroke"` only to the body and accessory outer outlines.

### - [ ] Step 5.7: Detail tests

Append to `render.test.ts`:

```ts
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
    expect(svg).not.toContain("FFB6C1"); // no blush ovals
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
```

### - [ ] Step 5.8: Re-snapshot

```bash
pnpm --filter @repogotchi/render-svg test -- -u
```

Existing snapshots that didn't pass `detail` use the default (`auto` → `full` at 400px) and so should be largely unchanged except for any non-scaling-stroke additions on outlines.

### - [ ] Step 5.9: Run full tests + typecheck

```bash
pnpm test
pnpm typecheck
```

### - [ ] Step 5.10: Commit

```bash
git add packages/render-svg/
git commit -m "feat(render-svg): detail option — compact mode for small surfaces

detail: 'compact' tightens viewBox to 40 40 320 320, drops cheeks/trinket/
sparkles/zzz/glasses, simplifies crown and ears, and forces bead eyes for
non-mood-overridden moods. detail: 'auto' resolves to compact when size <=
64 (e.g. macOS menubar 22-44px). Mood-overridden eye expressions and ghost
opacity are preserved across detail modes.

Spec: docs/superpowers/specs/2026-05-03-pet-visuals-a-plus-b-design.md"
```

---

## Task 6: Worker query params (`?size=&theme=&detail=`)

Surface defaults stay the same (auto/auto, 400px). Adding query-param overrides means external embedders can request a specific theme/detail/size without us shipping new endpoints. Invalid values clamp silently.

**Files:**
- Modify: `apps/worker/src/handler.ts`
- Modify: `apps/worker/test/handler.test.ts` (or whichever Worker test file exists)

### - [ ] Step 6.1: Inspect Worker test file

```bash
ls apps/worker/test/
```

Note the test file name. Read it once to understand the existing test structure (vitest, mocked fetch, etc.).

### - [ ] Step 6.2: Add query-param parsing in handler.ts

Modify `apps/worker/src/handler.ts` — locate the section that calls `renderPet(pet, state)` and replace with a parsed-options call:

```ts
const renderOpts = parseRenderOpts(url.searchParams);
const { svg } = renderPet(pet, state, renderOpts);
return svgResponse(svg, 200);
```

Add this helper at the bottom of the same file:

```ts
import type { RenderOptions } from "@repogotchi/render-svg";

function parseRenderOpts(params: URLSearchParams): RenderOptions {
  const opts: RenderOptions = {};

  const sizeRaw = params.get("size");
  if (sizeRaw !== null) {
    const size = parseInt(sizeRaw, 10);
    if (Number.isFinite(size) && size >= 16 && size <= 2048) {
      opts.size = size;
    }
  }

  const theme = params.get("theme");
  if (theme === "auto" || theme === "light" || theme === "dark") {
    opts.theme = theme;
  }

  const detail = params.get("detail");
  if (detail === "auto" || detail === "full" || detail === "compact") {
    opts.detail = detail;
  }

  return opts;
}
```

Garbage values are silently dropped (the option falls back to the renderer's default). No 400 errors — SVG endpoints should be forgiving.

### - [ ] Step 6.3: Worker tests

Append to `apps/worker/test/handler.test.ts`. Mirror the existing `handle(...)` + mocked fetcher pattern (the file already defines `REPO`, `ok()`, and `NOW` at the top — reuse them):

```ts
it("accepts ?size=44 and renders at that size", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(ok(REPO));
  const res = await handle(
    new Request("https://r/pet/schmug/RepoGotchi.svg?size=44"),
    {},
    { fetcher, now: NOW },
  );
  expect(res.status).toBe(200);
  const body = await res.text();
  expect(body).toContain('width="44"');
  expect(body).toContain('height="44"');
});

it("accepts ?theme=dark and applies dark mode without media query", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(ok(REPO));
  const res = await handle(
    new Request("https://r/pet/schmug/RepoGotchi.svg?theme=dark"),
    {},
    { fetcher, now: NOW },
  );
  const body = await res.text();
  expect(body).toContain("--outline: #E8E8E8");
  expect(body).not.toContain("prefers-color-scheme");
});

it("accepts ?detail=compact and tightens the viewBox", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(ok(REPO));
  const res = await handle(
    new Request("https://r/pet/schmug/RepoGotchi.svg?detail=compact"),
    {},
    { fetcher, now: NOW },
  );
  const body = await res.text();
  expect(body).toContain('viewBox="40 40 320 320"');
});

it("silently ignores garbage query values", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(ok(REPO));
  const res = await handle(
    new Request(
      "https://r/pet/schmug/RepoGotchi.svg?size=abc&theme=blue&detail=enormous",
    ),
    {},
    { fetcher, now: NOW },
  );
  expect(res.status).toBe(200);
  const body = await res.text();
  expect(body).toContain('viewBox="0 0 400 400"');
  expect(body).toContain("@media (prefers-color-scheme: dark)");
});

it("clamps size to a sane range", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(ok(REPO));
  const tooSmall = await handle(
    new Request("https://r/pet/schmug/RepoGotchi.svg?size=1"),
    {},
    { fetcher, now: NOW },
  );
  const tooBig = await handle(
    new Request("https://r/pet/schmug/RepoGotchi.svg?size=9999"),
    {},
    { fetcher, now: NOW },
  );
  expect(await tooSmall.text()).toContain('width="400"');
  expect(await tooBig.text()).toContain('width="400"');
});
```

### - [ ] Step 6.4: Run worker tests + typecheck

```bash
pnpm --filter @repogotchi/worker test
pnpm typecheck
```

### - [ ] Step 6.5: Commit

```bash
git add apps/worker/src/handler.ts apps/worker/test/
git commit -m "feat(worker): expose ?size=&theme=&detail= query params

External embedders can now request specific theme (light/dark/auto), detail
(full/compact/auto), and size on the /pet/:owner/:repo.svg endpoint.
Invalid values fall back to defaults silently — SVG endpoints stay
forgiving and never return 400.

Spec: docs/superpowers/specs/2026-05-03-pet-visuals-a-plus-b-design.md"
```

---

## Task 7: README + ROADMAP updates

**Files:**
- Modify: `README.md`
- Modify: `ROADMAP.md`

### - [ ] Step 7.1: README — note theme + detail support

Add a short section in `README.md` after the existing badge embed examples:

```markdown
### Theming and detail

Pets adapt to light/dark backgrounds via `prefers-color-scheme` and gracefully
shed detail at small sizes. The Worker endpoint accepts query params:

```
?size=44&theme=dark&detail=compact   # for a menubar-sized dark embed
?theme=light                         # force the light palette
?detail=full                         # force full detail at any size
```

The Action embed uses default `auto` for both, which works in both light and
dark GitHub READMEs out of the box.
```

### - [ ] Step 7.2: ROADMAP — record A+B shipped, link #13

Modify `ROADMAP.md`. Add a new "Recent" entry near the top:

```markdown
- 2026-05-XX: shipped A+B pet visual upgrade — identity-driven variation
  (silhouette, ears, eyes, cheeks, trinket) and adaptive multi-surface SVG
  (theme + detail). Multi-species follow-up tracked in
  [#13](https://github.com/schmug/RepoGotchi/issues/13).
```

(The exact date will be the merge date — fill it in at PR-merge time.)

### - [ ] Step 7.3: Run full test suite once more

```bash
pnpm test
pnpm typecheck
swift test --package-path apps/macos-companion
```

Expected: all green. The Swift suite is unaffected.

### - [ ] Step 7.4: Commit

```bash
git add README.md ROADMAP.md
git commit -m "docs: note theme/detail support and link multi-species follow-up

Spec: docs/superpowers/specs/2026-05-03-pet-visuals-a-plus-b-design.md"
```

---

## Task 8: Open the PR

### - [ ] Step 8.1: Push and open PR

```bash
git push -u origin claude/sharp-wiles-582821
gh pr create --title "feat(render-svg): identity-driven variation + adaptive multi-surface SVG (A+B)" --body "$(cat <<'EOF'
## Summary

Implements the A+B design from `docs/superpowers/specs/2026-05-03-pet-visuals-a-plus-b-design.md`:

- **Identity-driven variation** — body silhouette, ears, eye baseline, cheeks, and trinket are now derived from `pet.id` hash bytes. 1,728 distinct base looks before palette and mood. Same repo always renders the same pet.
- **Adaptive multi-surface SVG** — `theme: 'auto' | 'light' | 'dark'` adds a `prefers-color-scheme: dark` media query to the SVG so one badge file works in both light and dark READMEs. `detail: 'auto' | 'full' | 'compact'` gates layers and tightens the viewBox for tiny renders (macOS menubar). Worker exposes `?size=&theme=&detail=` query params for external embedders.

Multi-species (the bigger swing) is tracked separately in #13. The renderer's parts pipeline was structured here so #13 plugs in without re-architecting.

## What changes visually

- The dogfood pet for this repo (`a3f5b8c2d1e0`) shifts from a round blob with pointed ears and round eyes → round body, floppy ears, almond eyes, no cheeks, collar. One-time refresh per dogfooding repo.
- README badges now respond to GitHub's dark-mode toggle.
- Menubar 44px renders cleanly without gluing fine details into mud.

## Test plan

- [x] `pnpm test` — 89 → ~115 tests, all passing.
- [x] `pnpm typecheck` — green.
- [x] `swift test --package-path apps/macos-companion` — green (unaffected).
- [ ] Eyeball the snapshot diff in `packages/render-svg/test/__snapshots__/` and confirm the canonical pet's new shape.
- [ ] Render the live Worker endpoint at `repogotchi.cortech.online/pet/schmug/RepoGotchi.svg?theme=dark&size=44&detail=compact` and confirm the menubar variant looks right.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### - [ ] Step 8.2: Edit the multi-species issue to link this PR

Once the PR is open, get its URL, then edit issue #13 to replace the `TODO` cross-reference:

```bash
gh issue edit 13 --body "$(gh issue view 13 --json body -q .body | sed 's|TODO — will be linked once committed.|<PR URL here>|')"
```

(Or use the GitHub UI — not strictly required for the implementation.)

---

## Spec coverage check

Walking through the spec sections to confirm every requirement maps to a task:

| Spec section                          | Task                |
|---------------------------------------|---------------------|
| `derivePetVariation` in core          | Task 1              |
| Render-svg restructure                | Task 2              |
| Variation catalogue (silhouette)      | Task 3 (body.ts)    |
| Variation catalogue (ears)            | Task 3 (ears.ts)    |
| Variation catalogue (eyes baseline)   | Task 3 (eyes.ts)    |
| Variation catalogue (cheeks)          | Task 3 (cheeks.ts)  |
| Variation catalogue (trinket)         | Task 3 (trinket.ts) |
| Z-order                               | Task 3.6            |
| Theme adaptation                      | Task 4              |
| `prefers-color-scheme` media query    | Task 4.1            |
| `theme: light` / `dark`               | Task 4.1            |
| Identity palette stays literal        | Task 4.3 (note)     |
| Detail adaptation                     | Task 5              |
| Compact viewBox `40 40 320 320`       | Task 5.5            |
| Compact gate per layer                | Task 5.2, 5.5       |
| Force `bead` eyes in compact          | Task 5.4            |
| Mood overrides win in compact         | Task 5.7 (test)     |
| Ghost opacity preserved in compact    | Task 5.7 (test)     |
| `vector-effect="non-scaling-stroke"`  | Task 5.6            |
| Per-surface defaults (Worker params)  | Task 6              |
| `pet.id` byte-out-of-range fallback   | Task 1.1 (test)     |
| Cross-mode invariants                 | Task 5.7            |
| Worker forgiving on garbage params    | Task 6.3            |
| README + ROADMAP updates              | Task 7              |

All spec sections covered.
