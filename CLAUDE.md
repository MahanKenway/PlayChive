# PLAYCHIVE: project rules

These rules apply to every change, by people and by AI assistants. The owner is Mahan (Persian speaker). Chat replies to him are in Persian.

## 1. Everything user-facing ships in English AND Persian

- Any new page, section, game entry, button label, error message, FAQ item or metadata field gets an English version and a Persian version in the same change. Do not merge English-only additions.
- New playable game: add the entry to `data/games.json`, then add its Persian genre to `FA_GENRE` and its Persian description to `FA_DESC` in `scripts/generate-seo.py`. CI fails if a playable game has no Persian card on `/fa/`.
- Persian pages use `lang="fa" dir="rtl"`, link to their English twin and the reverse, and keep the `hreflang` pair (en, fa, x-default) in sync. Regenerate with `python3 scripts/generate-seo.py --date YYYY-MM-DD` (use system python3, Pillow is needed).
- Keep Latin names (game titles, API terms) inside `lang="en"` spans or `unicode-bidi:isolate` so punctuation does not jump around in RTL text.

### Persian writing style

- Write it as a Persian writer would, never as a literal translation. Read it aloud: if it sounds like a machine, rewrite it.
- Address the reader informally with «تو» (باز کن، بساز، بازی کن). Short sentences, concrete verbs. No stiff words such as «مرورگرمحور».
- Use Persian digits (۲۴) in Persian prose, Latin digits in code, versions and game names. Use the half-space (ZWNJ) correctly: «بازی‌ها»، «می‌شود»، «ثبت‌نام».
- Fonts: Vazirmatn for headings, Shabnam for body, both OFL, self-hosted from `assets/fonts` (licenses in `assets/licenses`). Do not add commercial fonts (IRANSans, Yekan Bakh, Dana and similar) or third-party font hosts.

## 2. Accessibility is a requirement, not polish

- Every `<img>` has meaningful `alt` text (Persian on Persian pages). Decorative images use `alt=""`.
- Every control has an accessible name (`aria-label` or visible text) in the page language. Icon-only buttons never ship without one.
- Everything works by keyboard with a visible focus ring. Respect `prefers-reduced-motion` (animations off or near-instant) and both color schemes.
- Contrast: body text at least 4.5:1 in light and dark. Do not rely on color alone for state.
- Do not block zoom (`maximum-scale`, `user-scalable=no`). No horizontal scroll at 320px.
- Use semantic landmarks (`header`, `nav`, `main`, `footer`), one `h1` per page and ordered headings.
- Before finishing a UI change, run Lighthouse (accessibility must stay at 100) and check the page at 390px and 1280px in light and dark.

## 3. Engineering conventions

- The site is static, built by `.github/workflows/build-and-deploy.yml` to GitHub Pages and proxied by the Cloudflare Worker in `worker/index.ts` at playchive.ir. Merging to `main` deploys.
- The Worker CSP allows only same-origin scripts. Do not add third-party scripts, CDNs or analytics. Bundle what you need.
- Screenshots are WebP, at most 1280px wide. Do not commit PNG or JPG artwork.
- Keep these DOM ids and module contracts working: `wad-picker`, `btn-freedoom`, `wad-upload`, `wad-drop-zone`, `loading-screen`, `game-screen`, `retro-audio-toggle`, `retro-audio-volume`, `offline-pack-button`, `offline-pack-status`, `theme-toggle`, `library-count`, `evil-eye`.
- New CSS goes in `styles/main.css` and new header behavior in `src/header-fx.js`. Prefer CSS and Web Animations over libraries.

## 4. Checks to run before every merge

```
python3 scripts/generate-seo.py --date $(date +%F)
uv run --python 3.10 scripts/check-seo.py          # SEO, GEO, Persian parity, alt text
npx wrangler deploy --dry-run --outdir /tmp/wr && node scripts/test-worker.mjs /tmp/wr/index.js
```

Then look at the page in a real browser (Playwright is available) at phone and desktop widths, both themes.
