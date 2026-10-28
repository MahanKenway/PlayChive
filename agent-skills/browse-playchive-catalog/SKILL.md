---
name: browse-playchive-catalog
description: Read the PLAYCHIVE game catalog (JSON) to find playable browser games, filter by genre or status, and get the direct URL of a game. Use when a user asks what they can play on playchive.ir.
---

# Browse the PLAYCHIVE catalog

PLAYCHIVE (https://playchive.ir) is a browser hub for free and open-source retro games. It has no accounts and no API keys. All data is static, public and read-only.

## Steps

1. Fetch `https://playchive.ir/data/games.json` with a plain `GET`. The same data is also at `https://playchive.ir/agent/catalog.json`. The OpenAPI description is at `https://playchive.ir/openapi.json`.
2. The response is `{ schemaVersion, generatedFrom, generatedAt, games: [...] }`. Each record has `id`, `name`, `description`, `genre`, `playable`, `runtimeUrl`, `projectUrl`, `publicUrl`, `license`, `status`, `studio`, `controls`, `artwork`, `runtimeType` and `catalogState`.
3. Records with `playable: true` run in the browser. Their game page is `https://playchive.ir/` followed by `runtimeUrl` (for example `cdogs.html`).
4. Group everything else by the URL fields:
   - `projectUrl` or `publicUrl` starting with `http`: an external project. PLAYCHIVE only links to it and does not host it.
   - No URL: a reference or local-import entry, such as a Doom-engine campaign.
5. Filter by `genre` or `status` as needed. `status` values starting with `Free` mean the content is bundled and free. `Engine bundled / data local` means the user must supply their own lawful game data.

## Human-readable alternatives

- `https://playchive.ir/llms.txt` and `https://playchive.ir/llms-full.txt`
- `https://playchive.ir/agent/` (no JavaScript, login or cookies needed)

## Rules

- Do not send an `Authorization` header. Nothing requires one.
- Responses are static and cacheable. Keep request rates reasonable and follow `https://playchive.ir/robots.txt`.
