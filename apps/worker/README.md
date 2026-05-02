# Worker

Cloudflare Worker serving `GET /pet/:owner/:repo.svg`. Fetches GitHub stats, computes scores via `@repogotchi/core`, renders via `@repogotchi/render-svg`, caches in KV with a 1h TTL.

Returns an SVG suitable for embedding in any GitHub README:

```markdown
![pet](https://repogotchi.app/pet/<owner>/<repo>.svg)
```

Depends on: `@repogotchi/core`, `@repogotchi/render-svg`, `@repogotchi/contract`.

## Status

Planned. Initial route + cache pattern adapted from [schmug/repo-pet's Express endpoint](https://github.com/schmug/repo-pet/blob/master/server/petEndpoint.ts).
