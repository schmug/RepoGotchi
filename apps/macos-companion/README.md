# macOS Companion

Swift Package (`Package.swift`) for the menubar app. Watches `~/.repogotchi/` via FSEvents, resolves the active repo via project-hash MRU, and renders the pet as a menubar glyph with a click-popover for full state.

Structure forked from [schmug/contextbuddy](https://github.com/schmug/contextbuddy):

- `Sources/RepoGotchiCore/` — actor, watcher, state machine, session discovery, SQLite store.
- `Sources/RepoGotchiApp/` — `NSStatusItem` shell, popover, icon rendering.

Reads schemas from `packages/contract/generated/swift/` (committed codegen output). Distributed via a Homebrew tap (notarized, no Mac App Store).

Excluded from the pnpm workspace — built with `swift build` from this directory.

## Status

Planned. Lands after the CLI is writing real `state.json` files.
