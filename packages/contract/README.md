# @repogotchi/contract

Source of truth for the cross-surface schemas: `pet.json` (canonical pet identity) and `state.json` (live mood/scores).

JSON Schemas live in `schemas/`. Generated TypeScript types and Swift `Codable` types are checked in under `generated/` so consumers don't need to run codegen at install time.

## Status

Planned. First-cut schemas land in commit 3.
