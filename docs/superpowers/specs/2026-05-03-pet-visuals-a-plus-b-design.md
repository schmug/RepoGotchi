# RepoGotchi pet visuals — A+B design

**Status:** spec, awaiting implementation plan.
**Author:** schmug + claude.
**Filed:** 2026-05-03.
**Companion follow-up:** [#13 multi-species pets](https://github.com/schmug/RepoGotchi/issues/13).

## Problem

Today every RepoGotchi pet looks like the same blob with a different color.
`petId` is a 6-byte deterministic seed but only the first 4 hex chars are used
(name index); body shape, ear shape, eye style, cheek style are fixed. Two
TypeScript repos render near-identically.

Surfaces also fight the renderer:

- One viewBox (400×400). The macOS menubar planned for 22–44px gets the same
  details (sparkles, zzz, glasses lens lines) that read fine at 200px and just
  mud out small. The single hero embed at 400px+ is underwhelming.
- Outline `#1A1A1A` and accent `#FFD700` are baked in. README badges embedded
  on dark GitHub themes look muddy; the eventual menubar (dark by default)
  will look worse.

Determinism is already solid (snapshot tests assert byte-identical output).
That property is non-negotiable — every change here must preserve it.

## Scope (this spec)

Two orthogonal lifts, shipped together:

- **A — identity-driven variation.** Use more of the `petId` hash bytes to
  vary body silhouette, ears, eye baseline, cheeks, and a baseline trinket.
  Same species ("blob"), much more visible per-repo identity.
- **B — adaptive multi-surface SVG.** Bake `prefers-color-scheme` theming and
  size-aware detail gating into the output so one SVG looks right from a 22px
  menubar to a 400px hero, on light or dark backgrounds.

Multi-species is the bigger swing tracked in [#13](https://github.com/schmug/RepoGotchi/issues/13).
This spec deliberately structures the parts pipeline so #13 plugs in without
re-architecting.

## Architecture & boundaries

### `@repogotchi/core` — variation derivation

New module `src/variation.ts` with one pure function:

```ts
export interface PetVariation {
  silhouette: "round" | "teardrop" | "oval-wide" | "lumpy";
  earKind: "pointed-2" | "round-2" | "floppy-2" | "tuft-3" | "none" | "horn-2";
  eyeKind: "round" | "almond" | "bead" | "wide";
  cheekKind: "blush-pink" | "freckles" | "none";
  trinket: "collar" | "bowtie" | "belly-patch" | "tail-tuft" | "whisker-3" | "none";
}

export function derivePetVariation(pet: Pet): PetVariation;
```

Reads bytes 2–5 of `pet.id` (bytes 0–1 are reserved for the existing name
index, which reads them as a 16-bit big-endian int via `parseInt(id.slice(0,
4), 16)`). Sync. No I/O. Identical inputs → identical outputs. Lives in core
(not render-svg) so the variation is part of identity logic, available to
non-renderer consumers and forward-compatible if we ever persist it on
`pet.json`.

Byte-to-dimension allocation, documented in the module:

| Source            | Dimension     | `n % N` |
|-------------------|---------------|---------|
| bytes 0–1 (u16)   | name index    | (existing) |
| byte 2            | silhouette    | 4       |
| byte 3            | earKind       | 6       |
| byte 4            | eyeKind       | 4       |
| byte 5 high nibble| cheekKind     | 3       |
| byte 5 low nibble | trinket       | 6       |

Splitting byte 5 into two nibbles keeps everything inside `pet.id`'s 6 bytes
without adding async hashing or correlation across dimensions. If a future
dimension exhausts the available bits, hash `pet.id` again with a different
prefix string and read from that hash — documented in the module header so
contributors do not silently reuse bit ranges.

Math: 4 × 6 × 4 × 3 × 6 = **1,728 distinct base looks** before palette and
mood. Across the GitHub repo space, collisions feel rare.

### `@repogotchi/render-svg` — restructure

```
packages/render-svg/src/
  index.ts              renderPet(pet, state, opts) — orchestrator
  theme.ts              emits <style> block + resolves theme/detail options
  xml.ts                escape helpers (lifted from today's parts.ts)
  parts/
    body.ts             silhouette switch (uses variation.silhouette)
    ears.ts             ear kind + count (uses variation.earKind)
    eyes.ts             mood-driven, with variation.eyeKind baseline for
                        neutral/happy/excited; mood-override for
                        sad/sick/sleepy/angry/ghost
    mouth.ts            mood-driven (today's logic, unchanged)
    cheeks.ts           variation.cheekKind
    trinket.ts          variation.trinket
    accessories.ts      crown/glasses/sparkles/zzz (today's logic, unchanged)
```

The split is the same seam #13 will plug into: `parts/body.ts` becomes
`species/<name>/body.ts` later without re-architecting.

Z-order inside the pet `<g>`: background blush → silhouette → cheeks → eyes
→ mouth → trinket → ears → accessories.

### Public API additions to `renderPet`

```ts
export interface RenderOptions {
  size?: number;                              // existing, default 400
  background?: string;                        // existing, default "transparent"
  theme?: "auto" | "light" | "dark";          // NEW, default "auto"
  detail?: "auto" | "full" | "compact";       // NEW, default "auto"
}
```

`theme: "auto"` emits a `<style>` block with `prefers-color-scheme: dark`
overrides for outline/blush/tear colors. `theme: "light"` / `theme: "dark"`
emit a single `:root` block with the chosen values, no media query.

`detail: "auto"` resolves at render time: `size ≤ 64` → `compact`, otherwise
`full`. Surfaces can override explicitly.

The pet's identity palette (`primary`, `secondary`, `accent`) stays as literal
hex regardless of theme — those are the repo's signature.

## Variation catalogue (v1)

### Silhouette (`parts/body.ts`)

1. **`round`** — today's ellipse. Baseline.
2. **`teardrop`** — taller top, fatter bottom. Path-based.
3. **`oval-wide`** — squashed, more horizontal. "Chonky" feel.
4. **`lumpy`** — round body with two soft bezier bumps on the sides. "Stitched
   plush" feel.

Each silhouette exposes a `bodyPath(radius)` so the existing `health → radius`
scaling (80 → 120) is preserved.

### Ears (`parts/ears.ts`)

1. **`pointed-2`** — tall narrow ellipses (today's default).
2. **`round-2`** — circular ears.
3. **`floppy-2`** — teardrop ears that hang lower.
4. **`tuft-3`** — three small triangle tufts on top, no side ears.
5. **`none`** — bare; small antenna dot top-center.
6. **`horn-2`** — short upward triangles, `pet.palette.accent` fill.

### Eyes (`parts/eyes.ts`)

Mood still wins for `sad / sick / sleepy / angry / ghost`. Variation only
changes the *neutral / happy / excited* baseline:

1. **`round`** — solid filled circles (today's "excited" baseline).
2. **`almond`** — horizontal almond outline + pupil dot.
3. **`bead`** — tiny solid dots, no white.
4. **`wide`** — large outlined ovals with vertical pupil ovals.

### Cheeks (`parts/cheeks.ts`)

1. **`blush-pink`** — today's pink ovals.
2. **`freckles`** — three small accent-colored dots per side.
3. **`none`** — clean face.

### Trinket (`parts/trinket.ts`)

Always-on identity jewelry, separate from the signal-driven `accessories`:

1. **`collar`** — thin band beneath the head, accent fill.
2. **`bowtie`** — small bowtie under chin.
3. **`belly-patch`** — lighter ellipse on the lower body.
4. **`tail-tuft`** — single tuft poking out one side.
5. **`whisker-3`** — three thin whiskers each side.
6. **`none`** — clean.

Trinket and signal accessories may co-occur (e.g. collar + crown). Layout is
designed not to collide; if a contributor changes geometry and they overlap,
visual regression smoke check (below) catches it.

## Theme adaptation

Pure CSS inside the SVG. The output gains a small `<style>` block:

```svg
<style>
  :root {
    --outline: #1A1A1A;
    --blush:   #FFB6C1;
    --tear:    #5BA8FF;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --outline: #E8E8E8;
      --blush:   #FF8FA3;
      --tear:    #87C5FF;
    }
  }
</style>
```

Stroke and outline-fill attributes get swapped from literal hex to
`var(--outline)`. The pet's identity palette stays as literal hex.

This works in GitHub READMEs (camo proxy preserves `<style>`; `<img>` rendering
honors `prefers-color-scheme`), in the Worker response, in a macOS WKWebView,
and as a plain file. No JS, no per-theme files.

`theme: "light"` / `theme: "dark"` emit a single `:root` with chosen values,
no media query — for surfaces that know their context.

## Detail adaptation

`detail` controls layer presence:

| Layer              | `full` | `compact`                              |
|--------------------|:------:|----------------------------------------|
| body silhouette    |   ✓    | ✓                                      |
| ears               |   ✓    | ✓ (simplified; no inner detail)        |
| eyes               |   ✓    | ✓ (mood overrides win as in `full`; the variation baseline is forced to `bead` for small-size readability) |
| mouth              |   ✓    | ✓ (single-stroke, any mood)            |
| cheeks             |   ✓    | ✗                                      |
| trinket            |   ✓    | ✗                                      |
| sparkles           |   ✓    | ✗                                      |
| zzz                |   ✓    | ✗                                      |
| crown              |   ✓    | ✓ (simplified silhouette)              |
| glasses            |   ✓    | ✗                                      |

In `compact` mode the viewBox tightens to `40 40 320 320` so the pet fills
the frame instead of floating in 25% white space. `full` keeps the canonical
`0 0 400 400` so existing snapshot tests stay byte-identical.

Stroke widths use `vector-effect="non-scaling-stroke"` on the body and
accessory outlines so a 3px stroke stays crisp at every render size.

In `compact + mood: "ghost"`, the `0.55` group opacity is preserved so the
archived signal still reads.

## Per-surface defaults

| Surface                                     | size | theme  | detail              |
|---------------------------------------------|-----:|--------|---------------------|
| GitHub Action (`.repogotchi/pet.svg`)       |  400 | `auto` | `auto` → `full`     |
| Worker `/pet/:owner/:repo.svg`              |  400 | `auto` | `auto` → `full`     |
| Worker query params `?size=&theme=&detail=` | varies | varies | varies            |
| CLI `repogotchi render`                     |  400 | `auto` | `auto` → `full`     |
| macOS menubar                               |   44 | `dark` | `compact`           |
| macOS popover                               |  200 | `auto` | `full`              |

Worker query params clamp invalid values to defaults silently rather than
400-erroring (SVG endpoints should be forgiving).

## Edge cases

- **Existing committed `pet.svg` files** — overwritten on next run. One-time
  visual refresh per dogfooding repo. Documented in the PR description.
- **`pet.id` byte index out of range** — schema enforces 12 hex chars (6
  bytes), but the renderer is defensive: out-of-range byte falls back to `0`.
  Tested.
- **Unknown `pet.species`** — variation derives from `pet.id`, not species, so
  today's `pet.json` files render unchanged when [#13](https://github.com/schmug/RepoGotchi/issues/13)
  lands.
- **Mood overrides eyes** — mood-specific eyes still win for
  sad/sick/sleepy/angry/ghost regardless of `eyeKind`. Variation only changes
  neutral/happy/excited baseline. Tested via a mood × eyeKind matrix.
- **Theme `auto` in an ancient browser without `prefers-color-scheme`** —
  falls back to the `:root` light values. Acceptable.
- **Worker query params with garbage values** — clamp to defaults silently.

## Testing strategy

Snapshot tests are the determinism contract. New fixtures:

- **8-pet variation matrix.** Hand-pick 8 `pet.id`s that exercise all four
  silhouettes and a spread of ear/eye/cheek/trinket combos.
- **Mood × eyeKind matrix.** 3 representative moods × 4 eyeKinds, asserting
  mood-override-wins.
- **Theme matrix.** `light` / `dark` / `auto` against one canonical pet.
- **Detail matrix.** `full` / `compact` against one canonical pet.
- **Compact + ghost.** Ensures the archived opacity is preserved.

Plus:

- **Determinism property test.** Render the same pet twice with the same
  options; assert byte-equal output. (Extension of today's check.)
- **Cross-mode invariants.** `compact` SVG must not contain
  `aria-label="sparkles"`, `aria-label="zzz"`, or `aria-label="glasses"`.
  Cheap regression catch.
- **Visual regression smoke check (CI artifact).** Render the 8-pet matrix
  at sizes 32, 200, 400 and upload as a CI artifact. Reviewers eyeball on
  PRs. Not blocking; free signal.

Existing tests stay green for unchanged options. Today's snapshot fixture
pets read new bytes — their snapshots will update once. The diff is committed
in the same PR with a note in the description.

## Determinism guarantees

- `derivePetVariation(pet)` is sync, pure, depends only on `pet.id`.
- `renderPet(pet, state, opts)` is sync, pure, depends only on inputs.
- Identical `(pet, state, opts)` → byte-identical SVG. Asserted by the
  determinism property test.
- The new options (`theme`, `detail`) are part of the input tuple — different
  options legitimately produce different output, all reproducible.

## Constraints (non-negotiable)

- No `schemaVersion` bump on `pet.json` or `state.json`.
- No new runtime dependencies in `@repogotchi/render-svg` or `@repogotchi/core`.
- Renderer must run in browser, Node 20+, and Cloudflare Workers (today's
  baseline).
- Existing `aria-label` format preserved: `<name>: <statusHeadline> (<mood>,
  level <n>)`.
- Cross-surface convergence: same `(pet, state)` produces the same SVG on
  Worker, Action, and CLI given the same `RenderOptions`.

## Out of scope (for this PR)

- Multi-species (#13).
- Schema bump or new fields on `pet.json`.
- Animated/spritesheet tier.
- Premium LLM/image-gen tier.
- Owner/org "lineage" effects.
- Code-content sniffing.
- PNG diffing infrastructure for visual regression.

## Acceptance criteria

- `derivePetVariation(pet)` lives in `@repogotchi/core` with full unit
  coverage of the byte → dimension mapping.
- `renderPet` accepts `theme` and `detail` options; defaults preserve today's
  output modulo the new `<style>` block (which gets one re-snapshot).
- 8-pet variation matrix renders 8 visibly distinct pets at 200px and 400px.
- Theme matrix snapshots exist and pass.
- Detail matrix snapshots exist and pass.
- Compact mode at 32px reads cleanly (manual eyeball on the CI artifact).
- The renderer supports the planned 44px compact dark variant for the macOS
  menubar; actually wiring the menubar to call it is tracked separately under
  [#5](https://github.com/schmug/RepoGotchi/issues/5) and is not in scope here.
- All existing JS tests pass (with one expected re-snapshot diff).
- Worker continues to respond within today's edge-cache budgets.
- README hero pets visibly demonstrate variation across at least 3 example
  repos.

## Sequencing notes

The implementation plan should:

1. Land variation derivation in `@repogotchi/core` first, with tests, before
   touching the renderer. This is a pure function and easy to verify in
   isolation.
2. Restructure `render-svg` parts into the new module layout *without behavior
   change*, with snapshots stable. Separate commit.
3. Wire variation into the parts. Re-snapshot once.
4. Add `theme` option + `<style>` block. Re-snapshot once.
5. Add `detail` option + compact gating. Re-snapshot once.
6. Wire surface defaults (Worker query params, macOS menubar override).
7. Update README.

This sequence keeps each commit a clean review with one snapshot diff at most.
