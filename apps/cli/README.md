# `repogotchi` CLI

Node CLI that reads a local repo's git/CI/lint/test signals, computes pet state, and writes to `~/.repogotchi/pets/<repo-hash>/{pet.json,state.json,pet.svg}`.

Subcommands (planned):

- `repogotchi init` — generate a new pet for the current repo.
- `repogotchi watch` — long-running watcher that updates state on git events.
- `repogotchi render` — write `pet.svg` for the current state.
- `repogotchi status` — print current scores and mood.

Depends on: `@repogotchi/core`, `@repogotchi/render-svg`, `@repogotchi/contract`.

## Status

Planned.
