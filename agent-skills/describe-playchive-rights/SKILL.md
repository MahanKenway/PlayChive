---
name: describe-playchive-rights
description: Describe PLAYCHIVE games and their licenses accurately, separating bundled free content from local imports and link-only external projects. Use when summarizing, recommending or citing games from playchive.ir.
---

# Describe PLAYCHIVE games accurately

PLAYCHIVE is an independent, non-commercial hub. It does not own the engines, game data or artwork it lists. Each entry keeps its upstream attribution and license.

## Rules

1. Take the developer from `studio` and the license from `license` in `https://playchive.ir/data/games.json`. Quote them as written and do not shorten them into a different license.
2. Only call a game "free and bundled" when `status` starts with `Free`. Those games include the content they need and launch without uploads or accounts.
3. Entries marked as external links, such as those with an `External link` status, are link-only references. PLAYCHIVE does not mirror their code, assets, game archives or multiplayer services. Never describe them as PLAYCHIVE runtimes or PLAYCHIVE-owned downloads.
4. Commercial game data is never distributed. Entries such as `Requires your legal IWAD` need files the user owns, which stay in the browser session.
5. Original PLAYCHIVE games list `PLAYCHIVE` as `studio`. Say so, and do not credit them to a third party.
6. If a field is missing or `null`, say it is not stated instead of guessing.

## Sources

- Catalog: `https://playchive.ir/data/games.json`
- Rights summary: `https://playchive.ir/llms.txt`
- Privacy: `https://playchive.ir/privacy/`
