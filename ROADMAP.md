# RepoGotchi Roadmap

Single source of truth for project status and next steps. Update on every meaningful change.

Last updated: 2026-05-03 (commit `39d1198`).

---

## Status snapshot

| Surface / package          | Status   | Notes                                                                            |
| -------------------------- | -------- | -------------------------------------------------------------------------------- |
| `@repogotchi/contract`     | shipped  | JSON Schemas + TS/Swift codegen, drift-checked in CI. 6 tests.                   |
| `@repogotchi/core`         | shipped  | Scoring, mood, level/evolution, headline, hatchPet, petIdFor. 30 tests.          |
| `@repogotchi/render-svg`   | shipped  | Procedural SVG, deterministic, runs in browser/Node/Workers. 17 tests.           |
| `@repogotchi/worker`       | shipped  | Cloudflare Worker `/pet/:owner/:repo.svg`. 14 tests. Not deployed.               |
| `@repogotchi/cli`          | shipped  | `init` / `compute` / `render` / `status`. 20 tests. Not published to npm.        |
| `@repogotchi/action`       | shipped  | GitHub Action with bundled `dist/`. 2 tests. Dogfooded via the workflow below.   |
| `apps/macos-companion`     | shipped  | Swift menubar app + companion core lib. 5 tests. Not packaged/notarized.         |
| `plugins/claude-code`      | planned  | Bash hooks calling `repogotchi compute`. Blocked on CLI being on `$PATH`.        |
| CI                         | shipped  | Node + Swift jobs on every PR. Drift checks for codegen + action bundle.         |
| Dogfood workflow           | shipped  | `.github/workflows/repogotchi.yml` runs the action on this repo on push to main. |

Test totals: **89 JS + 5 Swift = 94**.

---

## Next steps (ordered)

### Now — finish the v0 loop

1. **Open the bootstrap PR.** The CI workflow only fires on PRs/pushes to main; nothing has run yet. Opening the PR validates the whole pipeline against real CI.
2. **Land the Claude Code plugin** (issue: TBD). Small bash hooks; the only blocker is "what binary do they call?" — see #3.
3. **Make the CLI installable as `repogotchi`** (issue: TBD). Needs an esbuild or tsup bundle to `dist/index.js`, a `bin` entry in `package.json`, and either npm publish or a Homebrew tap.

### Soon — close the cross-surface gaps

4. **Resolve the palette divergence between CLI and Worker** (issue: TBD). Worker uses GitHub-detected language; CLI doesn't, so the same repo gets two different pets. Options: a) CLI infers language from extensions, b) CLI calls `gh api` if available, c) document the Action flow as the canonical source.
5. **Deploy the Worker** to a real hostname (e.g. `repogotchi.app`). Wrangler config + domain + DNS. One-time setup.

### Later — quality + delight

6. **macOS popover renders the actual SVG**, not just text + score bars. WKWebView loading `pet.svg` is the simplest path.
7. **macOS companion packaging**: Homebrew tap + notarized `.app` build, `LSUIElement = true`.
8. **Premium pet tier**: optional LLM-driven personality + Imagen visualPrompt for a richer pet on the web. Out of scope for the procedural SVG.
9. **Animated spritesheet support** (per the [openai/skills hatch-pet contract](https://github.com/openai/skills/tree/main/skills/.curated/hatch-pet)) — 8×9 atlas, 192×208 cells. Optional second tier next to procedural SVG.

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
