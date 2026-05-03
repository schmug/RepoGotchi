# Claude Code Plugin

Plugin manifest + hooks that bump pet signals while you work in Claude Code:

- `PostToolUse` — increment activity, decay sleepiness.
- `Stop` — finalize the turn, mark a "session" event.
- `UserPromptSubmit` — optional, used for liveness.

Writes to `~/.repogotchi/pets/<repo-hash>/state.json` (the same file the CLI watcher and macOS companion read). No npm dependency — bash + the local CLI binary.

## Status

Planned. Lands after the CLI is stable.
