# Worker

Cloudflare Worker serving `GET /pet/:owner/:repo.svg`. Fetches GitHub stats, computes scores via `@repogotchi/core`, renders via `@repogotchi/render-svg`, and relies on Cloudflare's edge cache (`Cache-Control: public, max-age=3600, s-maxage=3600`) — no KV in v0.

Returns an SVG suitable for embedding in any GitHub README:

```markdown
![pet](https://repogotchi.cortech.online/pet/<owner>/<repo>.svg)
```

Depends on: `@repogotchi/core`, `@repogotchi/render-svg`, `@repogotchi/contract`.

## Deploy

One-time setup (per Cloudflare account):

```bash
wrangler login
wrangler secret put GITHUB_TOKEN   # fine-grained PAT, public_repo read
```

The `cortech.online` zone must be active in the same Cloudflare account before `wrangler deploy` will accept the `custom_domain` binding in [wrangler.toml](wrangler.toml).

Routine deploys:

```bash
pnpm --filter @repogotchi/worker deploy
curl https://repogotchi.cortech.online/pet/schmug/RepoGotchi.svg
```

The `workers_dev = true` fallback (`repogotchi-worker.<account>.workers.dev`) is always on — handy for verifying a bundle before DNS propagates.

## Status

Code shipped (14 tests). Hostname configured to `repogotchi.cortech.online`; awaiting first deploy. Initial route + cache pattern adapted from [schmug/repo-pet's Express endpoint](https://github.com/schmug/repo-pet/blob/master/server/petEndpoint.ts).
