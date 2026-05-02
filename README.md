# RepoGotchi

A pet for every repo. One shared contract drives three surfaces:

- **GitHub README badge** — procedural SVG generated from repo activity, served by a Cloudflare Worker or committed by a GitHub Action. `![](https://repogotchi.app/pet/<owner>/<repo>.svg)`
- **Local CLI** — `repogotchi` watches your working repo (git status, CI, lint/test signals) and writes pet state to `~/.repogotchi/`.
- **macOS menubar companion** — a Swift app that watches the same files and renders the active repo's pet as a glanceable menubar buddy.

The pet's identity (species, palette, evolution stage) stays stable per repo; the mood and accessories change with the signals.

## Status

Pre-alpha. Scaffolding the monorepo. See per-package READMEs for what's planned where.

## Layout

```
packages/
  contract/       JSON Schemas for pet.json + state.json (source of truth)
  core/           TS scoring, mood mapper, evolution stages
  render-svg/     Procedural SVG renderer (works in browser, Node, Worker)
apps/
  cli/            `repogotchi` Node CLI + watcher
  worker/         Cloudflare Worker: /pet/:owner/:repo.svg
  macos-companion/  Swift Package for the menubar app
actions/
  repogotchi/     GitHub Action wrapping cli + render-svg
plugins/
  claude-code/    Claude Code plugin (hooks bump local state.json)
```

## License

MIT. See [LICENSE](LICENSE).
