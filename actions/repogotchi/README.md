# RepoGotchi GitHub Action

Composite/JS action that runs the same scoring + render pipeline as the CLI, then commits `.repogotchi/pet.svg` and `.repogotchi/state.json` back to the repo.

Usage (planned):

```yaml
- uses: schmug/RepoGotchi/actions/repogotchi@v1
  with:
    commit: true   # commit the generated pet.svg back to the repo
```

Depends on: `@repogotchi/core`, `@repogotchi/render-svg`, `@repogotchi/contract`.

## Status

Planned.
