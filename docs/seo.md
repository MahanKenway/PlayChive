# SEO and GEO

Canonical site: https://playchive.ir (served by the Cloudflare Worker in `worker/index.ts`, which proxies the GitHub Pages build).

## Workflow

```
python3 scripts/generate-seo.py     # regenerate after changing data/games.json or any page
python3 scripts/check-seo.py        # validation, also runs in CI before the build
```

`generate-seo.py` is idempotent and writes: managed `<head>` blocks and an "About" section on every playable page,
the crawlable static catalog on `index.html`, `fa/index.html`, `sitemap.xml` (lastmod only changes when a page
changes, tracked in `data/seo-state.json`), `llms.txt`, `llms-full.txt`, `agent/catalog.json` and the IndexNow key file.
Never edit the blocks between `seo:begin` and `seo:end` by hand.

## Why a static catalog

GPTBot, ClaudeBot and PerplexityBot do not run JavaScript. The hub catalog is rendered by JavaScript, so without
the static copy in `index.html` those crawlers see an almost empty page. With JS enabled the static copy is hidden
(`.js .seo-static{display:none}`) and without JS it is shown.

## Worker tests

```
npx wrangler deploy --dry-run --outdir .wrangler-test
node scripts/test-worker.mjs
```

## After changing domains or titles

IndexNow is pinged automatically after each deploy with the changed pages. Google does not support IndexNow:
submit `https://playchive.ir/sitemap.xml` once in Google Search Console.
