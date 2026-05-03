# RepoGotchi

<p align="center">
  <a href=".repogotchi/pet.svg" title="Action embed — committed by the workflow">
    <img src=".repogotchi/pet.svg" alt="RepoGotchi pet (Action embed)" width="200" />
  </a>
  &nbsp;&nbsp;
  <a href="https://repogotchi.cortech.online/pet/schmug/RepoGotchi.svg" title="Worker embed — live, edge-cached">
    <img src="https://repogotchi.cortech.online/pet/schmug/RepoGotchi.svg" alt="RepoGotchi pet (Worker embed)" width="200" />
  </a>
</p>

<p align="center"><sub>Left: <code>.repogotchi/pet.svg</code> (Action). Right: <code>repogotchi.cortech.online</code> (Worker). Both rendered from this repo's signals.</sub></p>

A pet for every repo. One shared contract — `pet.json` (identity) + `state.json` (live) — drives three surfaces:

- **GitHub Action** — runs in CI, commits `.repogotchi/pet.svg` back to the repo. Works offline and inside CI; updates only when the workflow runs. Embed it in your README:
  ```markdown
  ![pet](.repogotchi/pet.svg)
  ```
- **Cloudflare Worker** — `GET /pet/:owner/:repo.svg`. Live, edge-cached, zero-storage; reflects the repo's current state without committing anything. Embed it in your README:
  ```markdown
  ![pet](https://repogotchi.cortech.online/pet/<owner>/<repo>.svg)
  ```
- **Local CLI** — `repogotchi` reads your working repo's git signals and writes pet/state files under `~/.repogotchi/`.
- **macOS menubar companion** — Swift app that watches `~/.repogotchi/` and reflects the active repo's pet in your menubar.

The pet's identity (species, palette, name) is deterministic from the repo. The mood and accessories change with the signals.

## Quickstart

### As a GitHub Action

```yaml
# .github/workflows/repogotchi.yml
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: write
jobs:
  pet:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: schmug/RepoGotchi/actions/repogotchi@main
```

### Locally

```bash
git clone https://github.com/schmug/RepoGotchi
pnpm install
cd /path/to/your/repo
pnpm --filter @repogotchi/cli dev init
pnpm --filter @repogotchi/cli dev status
```

The macOS companion lives in [apps/macos-companion](apps/macos-companion):

```bash
swift run --package-path apps/macos-companion
```

A pet glyph appears in your menubar; click for the popover.

## Layout

```
packages/
  contract/       JSON Schemas for pet.json + state.json (source of truth);
                  TS types under generated/ts/, Swift types under
                  swift/Sources/RepoGotchiContract/ via codegen.
  core/           Pure-function engine: scoring, mood, level/evolution,
                  status headlines, hatchPet, petIdFor.
  render-svg/     Deterministic procedural SVG renderer; runs in
                  browser, Node, and Cloudflare Workers.
apps/
  cli/            `repogotchi` Node CLI: init / compute / render / status.
  worker/         Cloudflare Worker serving /pet/:owner/:repo.svg.
  macos-companion/  Swift Package — menubar app + companion core lib.
actions/
  repogotchi/     GitHub Action: render + commit pet files to the repo.
plugins/
  claude-code/    Planned: Claude Code hooks that bump local state.
```

## Development

```bash
pnpm install
pnpm test         # all JS packages — 89 tests
pnpm typecheck    # all TS packages
swift test --package-path apps/macos-companion   # 5 tests
```

CI runs both pipelines on every PR plus drift checks for the contract codegen and the Action bundle.

## License

MIT. See [LICENSE](LICENSE).
