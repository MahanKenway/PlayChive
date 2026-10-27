#!/usr/bin/env python3
"""Validate PLAYCHIVE SEO/GEO output. Exit code 1 on any error (warnings never fail).

Checks every indexable HTML page for title, description, canonical, Open Graph,
Twitter, JSON-LD, h1 and hreflang; cross-checks sitemap, robots, llms files and
the static catalog against data/games.json; verifies local files exist.
"""
from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://playchive.ir"
errors: list[str] = []
warnings: list[str] = []


def err(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


def local_for(url: str) -> Path | None:
    if not url.startswith(BASE):
        return None
    path = urlparse(url).path.lstrip("/")
    if path == "" or path.endswith("/"):
        path += "index.html"
    return ROOT / path


def attr(tag_re: str, text: str, key: str = "content"):
    m = re.search(tag_re, text)
    if not m:
        return None
    m2 = re.search(key + r'="([^"]*)"', m.group(0))
    return m2.group(1) if m2 else None


def unescape(s):
    import html
    return html.unescape(s) if s is not None else s


pages = sorted(p for p in ROOT.glob("**/*.html")
               if not any(part in {".git", "third_party", "dist", "armawebtron", "docs", "node_modules", "linuxdoom-1.10",
                                   "tuxracer", "neon-rift", "shadow-station", "agent-assets"} for part in p.relative_to(ROOT).parts[:-1])
               and not p.name.startswith("google"))

# directories like neon-rift/ contain game assets, not pages; only top level pages plus these folders matter
pages = [p for p in pages if len(p.relative_to(ROOT).parts) == 1 or p.relative_to(ROOT).parts[0] in {"fa", "agent", "privacy"}]

canonicals: dict[str, Path] = {}
noindex_pages: list[str] = []
for p in pages:
    rel = p.relative_to(ROOT).as_posix()
    t = p.read_text(encoding="utf-8")
    head = re.search(r"<head[^>]*>(.*?)</head>", t, re.S)
    if not head:
        err(f"{rel}: no <head>")
        continue
    h = head.group(1)
    if "noindex" in (attr(r'<meta\s+name="robots"[^>]*>', h) or ""):
        noindex_pages.append(rel)
        continue

    m = re.search(r"<title>(.*?)</title>", h, re.S)
    title = unescape(m.group(1).strip()) if m else None
    if not title:
        err(f"{rel}: missing <title>")
    elif not 25 <= len(title) <= 70:
        warn(f"{rel}: title length {len(title)} (ideal 30-65)")

    desc = unescape(attr(r'<meta\s+name="description"[^>]*>', h))
    if not desc:
        err(f"{rel}: missing meta description")
    elif not 70 <= len(desc) <= 170:
        warn(f"{rel}: description length {len(desc)} (ideal 70-160)")

    canon = attr(r'<link\s+rel="canonical"[^>]*>', h, "href")
    if not canon:
        err(f"{rel}: missing canonical")
    else:
        if not canon.startswith(BASE):
            err(f"{rel}: canonical not on {BASE}: {canon}")
        expected = BASE + "/" + (rel[: -len("index.html")] if rel.endswith("index.html") else rel)
        if canon != expected:
            err(f"{rel}: canonical {canon} != expected {expected}")
        if canon in canonicals:
            err(f"{rel}: duplicate canonical with {canonicals[canon]}")
        canonicals[canon] = p

    for prop in ("og:title", "og:description", "og:url", "og:image", "og:type", "og:site_name"):
        if attr(rf'<meta\s+property="{prop}"[^>]*>', h) is None:
            err(f"{rel}: missing {prop}")
    if attr(r'<meta\s+property="og:url"[^>]*>', h) != canon:
        err(f"{rel}: og:url differs from canonical")
    img = attr(r'<meta\s+property="og:image"[^>]*>', h)
    if img:
        lp = local_for(img)
        if lp is None or not lp.exists():
            err(f"{rel}: og:image does not resolve to a local file: {img}")
    if attr(r'<meta\s+name="twitter:card"[^>]*>', h) is None:
        err(f"{rel}: missing twitter:card")
    if attr(r'<meta\s+name="twitter:image"[^>]*>', h) is None:
        warn(f"{rel}: missing twitter:image")

    if not re.search(r"<html[^>]*\blang=", t):
        err(f"{rel}: <html> has no lang")
    if len(re.findall(r"<h1[\s>]", t)) != 1:
        warn(f"{rel}: expected exactly one <h1>, found {len(re.findall(r'<h1[\s>]', t))}")
    if "github.io/PlayChive" in t:
        err(f"{rel}: still references github.io/PlayChive")

    blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', t, re.S)
    if not blocks and rel != "privacy/index.html" and rel != "agent/index.html":
        err(f"{rel}: no JSON-LD")
    for b in blocks:
        try:
            data = json.loads(b.replace("<\\/", "</"))
        except Exception as e:  # noqa: BLE001
            err(f"{rel}: invalid JSON-LD ({e})")
            continue
        for node in data.get("@graph", [data]):
            if node.get("@type") == "VideoGame":
                for k in ("name", "url", "description", "image", "gamePlatform"):
                    if not node.get(k):
                        err(f"{rel}: VideoGame missing {k}")
            if node.get("@type") == "FAQPage":
                ents = node.get("mainEntity", [])
                if not ents:
                    err(f"{rel}: empty FAQPage")
                visible = re.sub(r"<[^>]+>", " ", t)
                visible = unescape(" ".join(visible.split()))
                for q in ents:
                    if q["name"] not in visible:
                        err(f"{rel}: FAQ question not visible in page text: {q['name'][:50]}")

    if "hreflang" in h:
        langs = dict(re.findall(r'<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"', h))
        if "x-default" not in langs:
            err(f"{rel}: hreflang without x-default")
        if canon and canon not in langs.values():
            err(f"{rel}: hreflang set does not include itself")

# ----------------------------------------------------------------------- sitemap
sm = ET.parse(ROOT / "sitemap.xml").getroot()
ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9",
      "i": "http://www.google.com/schemas/sitemap-image/1.1"}
locs = [u.find("s:loc", ns).text for u in sm.findall("s:url", ns)]
if len(set(locs)) != len(locs):
    err("sitemap: duplicate <loc>")
for u in sm.findall("s:url", ns):
    loc = u.find("s:loc", ns).text
    lp = local_for(loc)
    if lp is None or not lp.exists():
        err(f"sitemap: {loc} has no local file")
    lm = u.find("s:lastmod", ns)
    if lm is None or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", lm.text or ""):
        err(f"sitemap: bad lastmod for {loc}")
    for im in u.findall("i:image", ns):
        ip = local_for(im.find("i:loc", ns).text)
        if ip is None or not ip.exists():
            err(f"sitemap: image missing for {loc}")
for np_ in noindex_pages:
    if any(l.endswith("/" + np_) for l in locs):
        err(f"sitemap: noindex page must not be listed: {np_}")
for c in canonicals:
    if c not in locs:
        err(f"sitemap: indexable page missing from sitemap: {c}")
for loc in locs:
    if loc not in canonicals:
        err(f"sitemap: {loc} is not a checked canonical page")

# ------------------------------------------------------------------ robots / llms
robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
if f"Sitemap: {BASE}/sitemap.xml" not in robots:
    err("robots.txt: missing Sitemap line for playchive.ir")
for bot in ("GPTBot", "ClaudeBot", "PerplexityBot", "OAI-SearchBot", "Google-Extended"):
    if bot not in robots:
        warn(f"robots.txt: {bot} not mentioned")
if re.search(r"(?mi)^Disallow:\s*/\s*$", robots):
    err("robots.txt: Disallow: / blocks the whole site")

games = json.loads((ROOT / "data/games.json").read_text(encoding="utf-8"))["games"]
llms = (ROOT / "llms.txt").read_text(encoding="utf-8")
llms_full = (ROOT / "llms-full.txt").read_text(encoding="utf-8")
if not llms.startswith("# "):
    err("llms.txt: must start with an H1")
if "\n> " not in llms:
    err("llms.txt: missing blockquote summary")
for url in re.findall(r"\]\((https://playchive\.ir[^)\s]*)\)", llms):
    lp = local_for(url)
    if lp is None or not lp.exists():
        err(f"llms.txt: link does not resolve locally: {url}")
for g in games:
    if f"### {g['name']}" not in llms_full:
        err(f"llms-full.txt: missing {g['name']}")

# ------------------------------------------------- static catalog on the hub page
hub = (ROOT / "index.html").read_text(encoding="utf-8")
sec = re.search(r'id="static-catalog".*?</section>', hub, re.S)
if not sec:
    err("index.html: static catalog missing (non-JS crawlers would see nothing)")
else:
    text = sec.group(0)
    for g in games:
        if g["name"].replace("&", "&amp;").replace("'", "&#x27;") not in text and g["name"] not in text:
            err(f"index.html: static catalog missing {g['name']}")
    for href in re.findall(r'href="([^"#]+)"', text):
        if href.startswith(("http", "mailto:")):
            continue
        if not (ROOT / href.split("?")[0]).exists():
            err(f"index.html: static catalog link not found: {href}")

fa = (ROOT / "fa/index.html").read_text(encoding="utf-8")
for href in re.findall(r'href="(\.\./[^"#]+)"', fa):
    if not (ROOT / "fa" / href).resolve().exists():
        err(f"fa/index.html: broken relative link {href}")
if 'hreflang="fa"' not in hub or 'hreflang="en"' not in fa:
    err("hreflang pair between / and /fa/ is not reciprocal")

# ---------------------------------------------------------------- other files
key_files = list(ROOT.glob("[0-9a-f]" * 32 + ".txt"))
if not key_files:
    err("IndexNow key file missing")
else:
    for kf in key_files:
        if kf.read_text(encoding="utf-8").strip() != kf.stem:
            err(f"{kf.name}: content must equal the key")
for f in ("manifest.json", "agent-manifest.json", "data/games.json", "agent/catalog.json"):
    try:
        json.loads((ROOT / f).read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        err(f"{f}: invalid JSON ({e})")
if json.loads((ROOT / "agent/catalog.json").read_text())["games"] != games:
    err("agent/catalog.json is out of sync with data/games.json (run scripts/generate-seo.py)")

print(f"noindex pages (skipped, correctly out of sitemap): {noindex_pages}")
print(f"checked {len(pages)} pages, {len(locs)} sitemap URLs, {len(games)} catalog records")
for w in warnings:
    print("WARN ", w)
for e in errors:
    print("ERROR", e)
print(f"{len(errors)} error(s), {len(warnings)} warning(s)")
sys.exit(1 if errors else 0)
