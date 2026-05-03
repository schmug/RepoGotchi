# RepoGotchi Roadmap

Single source of truth for project status and next steps. Update on every meaningful change.

Last updated: 2026-05-03 (A+B pet visuals — identity variation + adaptive multi-surface SVG).

---

## Status snapshot

| Surface / package          | Status   | Notes                                                                            |
| -------------------------- | -------- | -------------------------------------------------------------------------------- |
| `@repogotchi/contract`     | shipped  | JSON Schemas + TS/Swift codegen, drift-checked in CI. 6 tests.                   |
| `@repogotchi/core`         | shipped  | Scoring, mood, level/evolution, headline, hatchPet, petIdFor, derivePetVariation. 38 tests. |
| `@repogotchi/render-svg`   | shipped  | Procedural SVG, deterministic, theme- and detail-aware, runs in browser/Node/Workers. 34 tests. |
| `@repogotchi/worker`       | shipped  | Cloudflare Worker `/pet/:owner/:repo.svg`, accepts `?size=&theme=&detail=`. 19 tests. Deployed at `repogotchi.cortech.online`. |
| `@repogotchi/cli`          | shipped  | `init` / `compute` / `render` / `status`. 20 tests. Not published to npm.        |
| `@repogotchi/action`       | shipped  | GitHub Action with bundled `dist/`. 2 tests. Dogfooded via the workflow below.   |
| `apps/macos-companion`     | shipped  | Swift menubar app + companion core lib. 5 tests. Not packaged/notarized.         |
| `plugins/claude-code`      | planned  | Bash hooks calling `repogotchi compute`. Blocked on CLI being on `$PATH`.        |
| CI                         | shipped  | Node + Swift jobs on every PR. Drift checks for codegen + action bundle.         |
| Dogfood workflow           | shipped  | `.github/workflows/repogotchi.yml` runs the action on this repo on push to main. |

Test totals: **119 JS + 5 Swift = 124**.

---

## Recent

- **2026-05-03 — A+B pet visual upgrade.** Identity-driven variation
  (silhouette, ears, eye baseline, cheeks, trinket from `pet.id` hash bytes —
  1,728 base looks before palette and mood) plus adaptive multi-surface SVG
  (`prefers-color-scheme` theming and size-aware detail gating). Worker
  exposes `?size=&theme=&detail=` query params. Multi-species follow-up
  tracked in [#13](https://github.com/schmug/RepoGotchi/issues/13).

---

## Next steps (ordered)

### Now — finish the v0 loop

1. **Open the bootstrap PR.** The CI workflow only fires on PRs/pushes to main; nothing has run yet. Opening the PR validates the whole pipeline against real CI.
2. **Make the CLI installable as `repogotchi`** ([#1](https://github.com/schmug/RepoGotchi/issues/1)). Needs an esbuild bundle to `dist/index.js`, a `bin` entry in `package.json`, and either npm publish or a Homebrew tap. Blocks #3.
3. **Land the Claude Code plugin** ([#3](https://github.com/schmug/RepoGotchi/issues/3)). Small bash hooks calling `repogotchi compute`. Depends on #1.

### Soon — close the cross-surface gaps

4. **Resolve the palette divergence between CLI and Worker** ([#2](https://github.com/schmug/RepoGotchi/issues/2)). Worker uses GitHub-detected language; CLI doesn't, so the same repo gets two different pets. Detect from file extensions in the CLI.
5. ~~**Deploy the Worker** ([#4](https://github.com/schmug/RepoGotchi/issues/4)) to `repogotchi.cortech.online`.~~ Shipped 2026-05-03; `GET /pet/:owner/:repo.svg` is live with `GITHUB_TOKEN` set.

### Later — quality + delight

6. **macOS popover renders the actual SVG** ([#5](https://github.com/schmug/RepoGotchi/issues/5)), not just text + score bars. WKWebView loading `pet.svg`.
7. **macOS companion packaging** (no issue yet): Homebrew tap + notarized `.app` build, `LSUIElement = true`.
8. **Premium pet tier** (no issue yet): optional LLM-driven personality + Imagen visualPrompt for a richer pet on the web.
9. **Animated spritesheet support** (no issue yet, per the [openai/skills hatch-pet contract](https://github.com/openai/skills/tree/main/skills/.curated/hatch-pet)) — 8×9 atlas, 192×208 cells. Optional tier next to procedural SVG.

### Open product/design decisions

- **Schema-first vs. inferred**: contract is the source of truth via JSON Schema → TS/Swift codegen. Working well; revisit if Swift codegen drift becomes painful.
- **Web app**: deliberately not built in v0. Reconsider once the GitHub badge has traction; could be a small Astro marketing site.
- **Spritesheet tier**: defer until procedural pets feel samey in practice.

---

## Where to look first

- Architecture: this file + per-package `README.md`s.
- Schema: [packages/contract/schemas/](packages/contract/schemas/).
- Scoring rules: [packages/core/src/scoring.ts](packages/core/src/scoring.ts).
- SVG rendering: [packages/render-svg/src/index.ts](packages/render-svg/src/index.ts) + [parts.ts](packages/render-svg/src/parts.ts).
- Worker entry: [apps/worker/src/handler.ts](apps/worker/src/handler.ts).
- CLI entry: [apps/cli/src/index.ts](apps/cli/src/index.ts).
- Action entry: [actions/repogotchi/src/index.ts](actions/repogotchi/src/index.ts).
- macOS app: [apps/macos-companion/Sources/RepoGotchiApp/main.swift](apps/macos-companion/Sources/RepoGotchiApp/main.swift) + [MenubarController.swift](apps/macos-companion/Sources/RepoGotchiApp/MenubarController.swift).

## How to verify locally

```bash
pnpm install
pnpm typecheck
pnpm test                 # 89 JS tests
swift test --package-path apps/macos-companion   # 5 Swift tests

# Smoke-render a pet for the current repo:
pnpm --filter @repogotchi/cli dev init
pnpm --filter @repogotchi/cli dev status

# Bundle the Worker and the Action:
pnpm --filter @repogotchi/worker exec wrangler deploy --dry-run
pnpm --filter @repogotchi/action build && git diff --exit-code actions/repogotchi/dist
```
