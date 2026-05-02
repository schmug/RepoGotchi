# @repogotchi/render-svg

Deterministic, dependency-free procedural SVG renderer. Given a `Pet` + `State`, returns an SVG string. Runs in the browser, Node, and Cloudflare Workers.

Powers the README badge, the macOS companion's pet glyph (rendered to NSImage), and any future web surface.

Depends on: `@repogotchi/contract`.

## Status

Planned. Initial port adapts the procedural generator from [schmug/repo-pet](https://github.com/schmug/repo-pet) against the new `Pet`/`State` schemas.
