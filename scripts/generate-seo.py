#!/usr/bin/env python3
"""Generate PLAYCHIVE SEO and GEO assets from data/games.json.

What it writes (all idempotent, safe to re-run):
  * managed <head> block + visible "About" section on every playable game page
  * managed <head> block + crawlable static catalog on index.html
  * fa/index.html (Persian landing page, hreflang pair of the hub)
  * sitemap.xml (with images, hreflang alternates, honest lastmod)
  * llms.txt and llms-full.txt
  * agent/catalog.json and the record list in agent/index.html
  * IndexNow key file

Why: GPTBot, ClaudeBot and PerplexityBot do not run JavaScript, and the hub
catalog is rendered by JavaScript. Everything a crawler needs must therefore be
present in the raw HTML.

Usage:  python3 scripts/generate-seo.py [--date YYYY-MM-DD]
Run it after changing data/games.json or any page, then commit the result.
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://playchive.ir"
INDEXNOW_KEY = "130c06551e96f52003eb8c0a4570ee51"
DEFAULT_OG = "assets/og-playchive-1200x630.png"
LOGO = "assets/playchive-icon-512.png"
UPDATED = datetime.date.today().isoformat()
REPO_URL = "https://github.com/MahanKenway/PlayChive"

HEAD_BEGIN = "<!-- seo:begin -->"
HEAD_END = "<!-- seo:end -->"
BODY_BEGIN = "<!-- seo:content:begin -->"
BODY_END = "<!-- seo:content:end -->"

CONTROL_WORDS = {
    "keyboard": "keyboard",
    "touch": "on-screen touch controls",
    "gamepad": "gamepad",
    "fullscreen": "fullscreen mode",
}

FA_GENRE = {
    "Action": "اکشن", "Fantasy shooter": "شوتر فانتزی", "Exploration": "ماجراجویی و کاوش",
    "Strategy": "استراتژی", "Experimental": "تجربی", "Arcade": "آرکید", "Racing": "مسابقه‌ای",
    "3D Racing": "مسابقه‌ای سه‌بعدی", "Physics Maze": "پازل فیزیکی", "Survival": "بقا",
    "Arcade Puzzle": "پازل آرکید", "Rock & Gem Action Puzzle": "پازل اکشن", "Rhythm": "ریتم",
    "Horror": "ترسناک", "Sports": "ورزشی",
}
FA_DESC = {
    "blasphemer": "شوتر اول‌شخص فانتزی و تاریک روی موتور Heretic. بازی کامل است و همهٔ فایل‌هایش همراه خودش می‌آید.",
    "cdogs-sdl": "اکشن از نمای بالا با کمپین کامل و حالت دوئل؛ تیراندازی‌های شلوغ و پرتحرک، شبیه آرکیدهای قدیمی.",
    "gnu-freedink": "ماجراجویی نقش‌آفرینی دوبعدی با شوخ‌طبعی عجیب‌وغریب. بازی کامل، با داده‌های رسمی و رایگان.",
    "opentyrian2000": "شوتر عمودی فضایی و کلاسیک؛ نسخهٔ رایگان Tyrian 2000 با داده‌های freeware.",
    "librequake": "شوتر اول‌شخص روی موتور Quake، با مرحله‌ها و محتوای کاملاً آزاد و مستقل.",
    "openttd": "استراتژی حمل‌ونقل: ریل و جاده بکش، قطار و کامیون راه بینداز و شبکه‌ات را سودآور کن. گرافیک و موسیقی‌اش هم آزاد است.",
    "freerct": "شهربازی خودت را بساز: سرسره، چرخ‌وفلک و مسیر بگذار، مهمان‌ها را راضی نگه دار و حساب‌وکتابت را مثبت.",
    "neverball": "پازل فیزیکی سه‌بعدی؛ با کج‌کردن زمین، توپ را از مسیرهای سخت به مقصد برسان.",
    "armawebtron": "مسابقهٔ سه‌بعدی لایت‌سایکل در میدانی نئونی؛ ردّ نورانی بجا بگذار و رقیب را به دام بینداز.",
    "tuxracer-js": "پنگوئنی که روی برف سر می‌خورد: بیست مسیر سه‌بعدی و سرعتی که کم‌کم دستت می‌آید.",
    "starter-kit-racing": "رانندگی سه‌بعدی با کامیون روی پیستی محلی؛ زمان هر دور ثبت می‌شود تا رکوردت را بشکنی.",
    "astray": "یک توپ فولادی را در هزارتوهای سه‌بعدی هدایت کن؛ ساده شروع می‌شود، ولی مسیرها هر بار فرق دارند.",
    "neon-rift": "مسابقهٔ شبانهٔ سه‌بعدی با ظاهر low-poly؛ ساختهٔ خود PLAYCHIVE.",
    "obsidian-relay": "بازی بقا و کاوش در یک ایستگاه زیرآبی؛ ساختهٔ خود PLAYCHIVE.",
    "hexgl": "مسابقهٔ سریع و آینده‌نگرانهٔ سه‌بعدی با WebGL، روی پیست Cityscape.",
    "hextris": "پازل آرکید شش‌ضلعی: حلقه را بچرخان و بلوک‌های هم‌رنگ را کنار هم بیاور، پیش از آنکه روی هم تلنبار شوند.",
    "rocksndiamonds": "پازل اکشن کلاسیک؛ زمین را بکن، الماس جمع کن و از سنگ‌های در حال سقوط جا خالی بده.",
    "beats-into-shapes": "بازی ریتم سه‌لاینه با چهار موسیقی اصلی.",
    "2048": "همان پازل عددی معروف: مربع‌ها را ادغام کن تا به ۲۰۴۸ برسی. بهترین امتیازت در مرورگر می‌ماند.",
    "javascript-tetris": "تتریس سبک و سریع؛ فقط باز کن و بازی کن.",
    "adarkroom": "ماجراجویی متنی که با یک آتش کوچک در اتاقی تاریک شروع می‌شود و کم‌کم دنیایی می‌سازد.",
    "digger-remastered": "نسخهٔ بازسازی‌شدهٔ بازی حفاری و اکشن سال ۱۹۸۳؛ تونل بزن، طلا جمع کن و از هیولاها دور بمان.",
    "ecwolf": "موتور سازگار با Wolfenstein 3D. اینجا فقط خود موتور هست و فایل‌های داده‌ی قانونی را باید خودت انتخاب کنی.",
    "pacman-mit": "پک‌من کلاسیک با مجوز MIT و دوازده مرحله؛ نقطه‌ها را بخور و از روح‌های باهوش فرار کن.",
}

# --------------------------------------------------------------------------- data

DATA = json.loads((ROOT / "data/games.json").read_text(encoding="utf-8"))
GAMES = DATA["games"]


def is_free(g):
    return g["status"].startswith("Free")


def needs_local_data(g):
    return "data local" in g["status"]


def page_exists(g):
    return bool(g.get("runtimeUrl")) and str(g["runtimeUrl"]).endswith(".html") and (ROOT / g["runtimeUrl"]).exists()


PLAYABLE = [g for g in GAMES if g["playable"] and page_exists(g)]
FREE_PLAYABLE = [g for g in PLAYABLE if is_free(g)]


def classify(g):
    if g in PLAYABLE:
        return "play"
    url = g.get("projectUrl") or g.get("publicUrl") or ""
    if url.startswith("http"):
        return "external"
    return "local"


# ------------------------------------------------------------------------ helpers

def esc(s):
    return html.escape(str(s), quote=True)


def jsonld(obj):
    text = json.dumps(obj, ensure_ascii=False, indent=2).replace("</", "<\\/")
    return f'<script type="application/ld+json">\n{text}\n</script>'


def first_sentence(text, limit=150):
    text = " ".join(text.split())
    m = re.match(r"(.+?[.!?])(\s|$)", text)
    s = m.group(1) if m else text
    if len(s) > limit:
        s = s[: limit - 1].rsplit(" ", 1)[0].rstrip(",;:") + "."
    return s


def clip(text, limit):
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    return text[: limit - 1].rsplit(" ", 1)[0].rstrip(",;:.") + "."


def url_for(path):
    path = path.lstrip("/")
    return f"{BASE}/{path}" if path else f"{BASE}/"


def image_info(rel):
    p = ROOT / rel
    if not p.exists():
        rel = DEFAULT_OG
        p = ROOT / rel
    w = h = None
    try:
        from PIL import Image  # type: ignore

        with Image.open(p) as im:
            w, h = im.size
    except Exception:
        pass
    return rel, w, h


def controls_phrase(g):
    words = [CONTROL_WORDS.get(c, c) for c in g["controls"]]
    if len(words) > 1:
        return ", ".join(words[:-1]) + " and " + words[-1]
    return words[0] if words else "keyboard"


def game_title(g):
    name = g["name"]
    if needs_local_data(g):
        t = f"{name} in Your Browser (WebAssembly Engine) | PLAYCHIVE"
    else:
        t = f"Play {name} Online Free in Your Browser | PLAYCHIVE"
        if len(t) > 64:
            t = f"Play {name} Free in Your Browser | PLAYCHIVE"
        if len(t) > 64:
            t = f"{name}: Play Free in Your Browser | PLAYCHIVE"
    return t


def game_description(g):
    base = first_sentence(g["description"], 110)
    if needs_local_data(g):
        suffix = " Bring your own lawful game data; nothing is uploaded."
    else:
        suffix = " Free to play in your browser, no install or account."
    return clip(base + suffix, 160)


def game_faq(g):
    name, studio, lic = g["name"], g["studio"], g["license"]
    if needs_local_data(g):
        q1 = (f"Is {name} free to play on PLAYCHIVE?",
              f"The {name} engine is free and runs in your browser, but PLAYCHIVE does not distribute the original game "
              f"data. You select your own lawfully obtained files locally and they stay in your browser.")
    else:
        q1 = (f"Is {name} free to play on PLAYCHIVE?",
              f"Yes. {name} runs free in your browser. PLAYCHIVE bundles the engine and the game content it needs, "
              f"distributed under their own open or freeware terms ({lic}). There is no sign-up and no file upload step.")
    q2 = (f"Do I need to install anything to play {name}?",
          f"No. {name} runs directly in a modern desktop or mobile browser such as Chrome, Edge, Firefox or Safari, "
          f"using WebAssembly or HTML5. No account is required.")
    q3 = (f"Can I play {name} on a phone or with a controller?",
          f"PLAYCHIVE supports {controls_phrase(g)}. Where the runtime allows it, phones get PSP-style on-screen "
          f"controls, and desktop browsers accept keyboard, mouse and a connected gamepad.")
    q4 = (f"Who makes {name} and what is its license?",
          f"{name} is developed by {studio}. License and attribution: {lic}. PLAYCHIVE is a non-commercial hub and "
          f"keeps upstream notices with each runtime.")
    return [q1, q2, q3, q4]


def related(g, n=5):
    same = [x for x in PLAYABLE if x is not g and x["genre"] == g["genre"]]
    rest = [x for x in PLAYABLE if x is not g and x not in same]
    idx = PLAYABLE.index(g)
    rest.sort(key=lambda x: (PLAYABLE.index(x) - idx) % len(PLAYABLE))
    return (same + rest)[:n]


def faq_jsonld(qas, lang="en"):
    return {
        "@type": "FAQPage",
        "inLanguage": lang,
        "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in qas
        ],
    }


ORG_ID = f"{BASE}/#org"
SITE_ID = f"{BASE}/#website"


def organization():
    return {
        "@type": "Organization",
        "@id": ORG_ID,
        "name": "PLAYCHIVE",
        "url": f"{BASE}/",
        "logo": {"@type": "ImageObject", "url": url_for(LOGO), "width": 512, "height": 512},
        "founder": {
            "@type": "Person",
            "name": "Mahan Tavakoli",
            "url": "https://github.com/MahanKenway",
            "sameAs": ["https://github.com/MahanKenway"],
        },
        "sameAs": [REPO_URL],
    }


# ---------------------------------------------------------------- html editing

LEGACY_HEAD = [
    r"[ \t]*<title>.*?</title>[ \t]*\n?",
    r'[ \t]*<meta\s+name="description"[^>]*>[ \t]*\n?',
    r'[ \t]*<link\s+rel="canonical"[^>]*>[ \t]*\n?',
    r'[ \t]*<meta\s+name="robots"[^>]*>[ \t]*\n?',
    r'[ \t]*<meta\s+property="og:[^"]+"[^>]*>[ \t]*\n?',
    r'[ \t]*<meta\s+name="twitter:[^"]+"[^>]*>[ \t]*\n?',
    r'[ \t]*<link\s+rel="alternate"\s+hreflang[^>]*>[ \t]*\n?',
    r'[ \t]*<script type="application/ld\+json">.*?</script>[ \t]*\n?',
]


def apply_head(text, block):
    text = re.sub(re.escape(HEAD_BEGIN) + r".*?" + re.escape(HEAD_END) + r"[ \t]*\n?", "", text, flags=re.S)
    m = re.search(r"<head[^>]*>(.*?)</head>", text, flags=re.S)
    assert m, "no <head>"
    head = m.group(1)
    for pat in LEGACY_HEAD:
        head = re.sub(pat, "", head, flags=re.S)
    head = head.rstrip() + "\n" + block + "\n"
    return text[: m.start(1)] + head + text[m.end(1):]


def apply_body(text, block, marker):
    text = re.sub(re.escape(BODY_BEGIN) + r".*?" + re.escape(BODY_END) + r"[ \t]*\n?", "", text, flags=re.S)
    i = text.rfind(marker)
    assert i != -1, f"no {marker}"
    return text[:i] + BODY_BEGIN + "\n" + block + "\n" + BODY_END + "\n" + text[i:]


def head_block(*, title, desc, path, image, image_alt, extra_ld, locale="en_US", alternates=None, extra_head=""):
    canon = url_for(path)
    img_rel, w, h = image_info(image)
    img = url_for(img_rel)
    lines = [
        HEAD_BEGIN,
        f"  <title>{esc(title)}</title>",
        f'  <meta name="description" content="{esc(desc)}" />',
        f'  <link rel="canonical" href="{esc(canon)}" />',
        '  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />',
    ]
    for lang, href in (alternates or []):
        lines.append(f'  <link rel="alternate" hreflang="{lang}" href="{esc(href)}" />')
    lines += [
        '  <meta property="og:type" content="website" />',
        '  <meta property="og:site_name" content="PLAYCHIVE" />',
        f'  <meta property="og:locale" content="{locale}" />',
        f'  <meta property="og:title" content="{esc(title)}" />',
        f'  <meta property="og:description" content="{esc(desc)}" />',
        f'  <meta property="og:url" content="{esc(canon)}" />',
        f'  <meta property="og:image" content="{esc(img)}" />',
    ]
    if w and h:
        lines += [f'  <meta property="og:image:width" content="{w}" />', f'  <meta property="og:image:height" content="{h}" />']
    lines += [
        f'  <meta property="og:image:alt" content="{esc(image_alt)}" />',
        '  <meta name="twitter:card" content="summary_large_image" />',
        f'  <meta name="twitter:title" content="{esc(title)}" />',
        f'  <meta name="twitter:description" content="{esc(desc)}" />',
        f'  <meta name="twitter:image" content="{esc(img)}" />',
        f'  <meta name="twitter:image:alt" content="{esc(image_alt)}" />',
    ]
    if extra_head:
        lines.append(extra_head)
    lines.append(jsonld({"@context": "https://schema.org", "@graph": extra_ld}))
    lines.append(HEAD_END)
    return "\n".join(lines)


# ------------------------------------------------------------------ game pages

ABOUT_CSS = (
    "  <style>.seo-about{margin:34px 0 0;padding:20px 22px;border:1px solid rgba(21,24,20,.24);"
    "background:rgba(255,255,251,.5);color:#2b2f29;font:14px/1.65 Arial,sans-serif}"
    ".seo-about h2{margin:0 0 10px;font-size:20px;letter-spacing:-.02em}"
    ".seo-about h3{margin:22px 0 8px;font-size:15px}"
    ".seo-about dl{display:grid;grid-template-columns:max-content 1fr;gap:6px 16px;margin:14px 0}"
    ".seo-about dt{color:#596057;font-weight:700}.seo-about dd{margin:0}"
    ".seo-about details{margin:6px 0;padding:8px 0;border-top:1px solid rgba(21,24,20,.14)}"
    ".seo-about summary{cursor:pointer;font-weight:700}"
    ".seo-about ul{margin:8px 0;padding-left:20px}.seo-about a{color:#385b20}</style>"
)


def game_head(g):
    path = g["runtimeUrl"]
    url = url_for(path)
    title = game_title(g)
    desc = game_description(g)
    img_rel, _, _ = image_info(g["artwork"])
    free = is_free(g)
    game = {
        "@type": "VideoGame",
        "@id": f"{url}#game",
        "name": g["name"],
        "url": url,
        "description": " ".join(g["description"].split()),
        "image": url_for(img_rel),
        "screenshot": url_for(img_rel),
        "genre": g["genre"],
        "gamePlatform": "Web browser",
        "applicationCategory": "Game",
        "operatingSystem": "Any modern web browser",
        "inLanguage": "en",
        "author": {"@type": "Organization", "name": g["studio"]},
        "publisher": {"@id": ORG_ID},
        "isPartOf": {"@id": SITE_ID},
        "mainEntityOfPage": url,
    }
    if free:
        game["isAccessibleForFree"] = True
        game["offers"] = {"@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.org/InStock", "url": url}
    crumbs = {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "PLAYCHIVE", "item": f"{BASE}/"},
            {"@type": "ListItem", "position": 2, "name": g["name"], "item": url},
        ],
    }
    graph = [game, crumbs, faq_jsonld(game_faq(g))]
    return head_block(
        title=title, desc=desc, path=path, image=g["artwork"],
        image_alt=f"{g['name']} gameplay in the PLAYCHIVE browser runtime",
        extra_ld=graph, extra_head=ABOUT_CSS,
    )


def game_body(g):
    name = g["name"]
    faq = game_faq(g)
    facts = [
        ("Genre", g["genre"]),
        ("Developer", g["studio"]),
        ("License", g["license"]),
        ("Runtime", g["runtimeType"]),
        ("Controls", ", ".join(CONTROL_WORDS.get(c, c) for c in g["controls"])),
        ("Content status", g["status"]),
    ]
    parts = [f'<section class="seo-about" aria-labelledby="seo-about-title">', f'<h2 id="seo-about-title">About {esc(name)}</h2>',
             f"<p>{esc(' '.join(g['description'].split()))}</p>", "<dl>"]
    for k, v in facts:
        parts.append(f"<dt>{esc(k)}</dt><dd>{esc(v)}</dd>")
    parts.append("</dl>")
    parts.append(f"<h3>{esc(name)}: frequently asked questions</h3>")
    for q, a in faq:
        parts.append(f"<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>")
    parts.append("<h3>More playable games on PLAYCHIVE</h3><ul>")
    for r in related(g):
        parts.append(f'<li><a href="{esc(r["runtimeUrl"])}">{esc(r["name"])}</a> ({esc(r["genre"])})</li>')
    parts.append('</ul><p><a href="./">Browse the full PLAYCHIVE catalog</a></p></section>')
    return "\n".join(parts)


def update_game_page(g):
    p = ROOT / g["runtimeUrl"]
    text = p.read_text(encoding="utf-8")
    text = apply_head(text, game_head(g))
    marker = "</main>" if "</main>" in text else "</body>"
    text = apply_body(text, game_body(g), marker)
    p.write_text(text, encoding="utf-8")


# --------------------------------------------------------------------- hub page

HUB_FAQ = [
    ("What is PLAYCHIVE?",
     "PLAYCHIVE is a curated browser hub for classic, open-source and freeware games. Independent WebAssembly and HTML5 "
     "runtimes let you play them directly in the browser, with no install and no account."),
    ("Are the games free and do I need to install anything?",
     "Games marked Ready or Free / bundled are free and include the content they need. Nothing has to be installed and "
     "no account is required. ECWolf is the exception: it ships only the engine, so you select your own lawful data files."),
    ("Does PLAYCHIVE work on phones and with controllers?",
     "Yes. Supported runtimes offer PSP-style touch controls, and desktop browsers accept keyboard, mouse and a gamepad. "
     "Fullscreen is available from each runtime page."),
    ("Where are my saves stored?",
     "Progress is kept in your own browser storage, per game. It never goes to a PLAYCHIVE server, so clearing site data "
     "for the domain also clears your saves."),
    ("Does PLAYCHIVE include commercial games such as the original Doom?",
     "No. PLAYCHIVE does not distribute commercial game data. It bundles free content such as Freedoom, and a separate "
     "local importer lets you load WAD files you own; they stay in your browser session."),
]


def reference_list():
    """Every catalog record that is not a PLAYCHIVE runtime, described honestly.

    External projects keep their own URL and are never given a PLAYCHIVE page, offer or play action.
    """
    refs = [g for g in GAMES if g not in PLAYABLE]
    items = []
    for i, g in enumerate(refs, 1):
        ext = g.get("projectUrl") or g.get("publicUrl") or ""
        kind = ("External project listed for reference; PLAYCHIVE does not host or mirror it."
                if str(ext).startswith("http") else
                "Bundled free content that runs inside the PLAYCHIVE Doom hub." if is_free(g) or g["status"].startswith("Royalty-free") else
                "Catalog entry that needs a legal data file you provide locally; no commercial game data is distributed.")
        node = {"@type": "VideoGame", "name": g["name"], "genre": g["genre"],
                "description": f"{first_sentence(g['description'], 140)} {kind}",
                "author": {"@type": "Organization", "name": g["studio"]}}
        if str(ext).startswith("http"):
            node["url"] = ext
            node["sameAs"] = ext
        items.append({"@type": "ListItem", "position": i, "item": node})
    return {"@type": "ItemList", "@id": f"{BASE}/#reference-entries",
            "name": "Reference entries in the PLAYCHIVE catalog (not playable on PLAYCHIVE)",
            "numberOfItems": len(items), "itemListElement": items}


def hub_head():
    n = len(FREE_PLAYABLE)
    title = "PLAYCHIVE: Free Classic and Open-Source Games in Your Browser"
    desc = (f"Play {n} free retro and open-source games in your browser, from OpenTTD and LibreQuake to racers and "
            f"puzzles. No install, no account.")
    items = []
    for i, g in enumerate(PLAYABLE, 1):
        rel, _, _ = image_info(g["artwork"])
        items.append({
            "@type": "ListItem", "position": i, "url": url_for(g["runtimeUrl"]),
            "item": {"@type": "VideoGame", "@id": f"{url_for(g['runtimeUrl'])}#game", "name": g["name"],
                     "url": url_for(g["runtimeUrl"]), "genre": g["genre"], "image": url_for(rel),
                     "gamePlatform": "Web browser", "applicationCategory": "Game"},
        })
    graph = [
        organization(),
        {"@type": "WebSite", "@id": SITE_ID, "name": "PLAYCHIVE", "url": f"{BASE}/", "description": desc,
         "inLanguage": ["en", "fa"], "publisher": {"@id": ORG_ID}},
        {"@type": "CollectionPage", "@id": f"{BASE}/#catalog", "url": f"{BASE}/", "name": title, "description": desc,
         "isPartOf": {"@id": SITE_ID}, "inLanguage": "en", "dateModified": UPDATED,
         "mainEntity": {"@type": "ItemList", "name": "Playable games on PLAYCHIVE", "numberOfItems": len(items),
                        "itemListElement": items}},
        reference_list(),
        faq_jsonld(HUB_FAQ),
    ]
    extra = (
        "  <script>document.documentElement.classList.add('js');</script>\n"
        "  <style>.js .seo-static{display:none}.seo-static{max-width:960px;margin:0 auto;padding:32px 20px 60px;"
        "font:16px/1.65 system-ui,Arial,sans-serif;color:#161815;background:#e7e6e0}"
        ".seo-static a{color:#385b20}.seo-static h2{margin-top:32px}.seo-static li{margin:6px 0}</style>\n"
        "  <noscript><style>html,body{overflow:auto!important;height:auto!important}.screen{display:none!important}"
        ".seo-static{display:block!important}</style></noscript>"
    )
    return head_block(
        title=title, desc=desc, path="", image=DEFAULT_OG,
        image_alt="PLAYCHIVE browser arcade with classic open-source game worlds",
        extra_ld=graph, extra_head=extra,
        alternates=[("en", f"{BASE}/"), ("fa", f"{BASE}/fa/"), ("x-default", f"{BASE}/")],
    )


def hub_body():
    out = ['<section id="static-catalog" class="seo-static" aria-label="PLAYCHIVE game catalog">',
           "<h2>PLAYCHIVE: free classic and open-source games in your browser</h2>",
           f"<p>PLAYCHIVE is a curated hub of {len(PLAYABLE)} playable browser runtimes plus a rights-aware directory of "
           f"{len(GAMES) - len(PLAYABLE)} further catalog entries. Each game runs as WebAssembly or HTML5 in your browser: no "
           "install, no account, and saves stay on your device. PLAYCHIVE is non-commercial and keeps upstream license "
           'notices with every runtime. <a href="fa/">فارسی</a></p>',
           f'<p>Last updated: <time datetime="{UPDATED}">{UPDATED}</time></p>',
           f"<h3>Play now ({len(PLAYABLE)} games)</h3><ul>"]
    for g in PLAYABLE:
        note = " Requires your own lawful game data." if needs_local_data(g) else ""
        out.append(f'<li><a href="{esc(g["runtimeUrl"])}">{esc(g["name"])}</a> ({esc(g["genre"])}): '
                   f'{esc(first_sentence(g["description"], 180))}{note}</li>')
    out.append("</ul>")
    local = [g for g in GAMES if classify(g) == "local"]
    ext = [g for g in GAMES if classify(g) == "external"]
    out.append("<h3>Doom-engine campaigns and local import</h3><p>These entries are reference records. Free content "
               "(Freedoom, FreeDM, Hacx) is bundled; commercial IWADs are never distributed and must be supplied by you "
               "locally.</p><ul>")
    for g in local:
        out.append(f'<li>{esc(g["name"])} ({esc(g["genre"])}): {esc(first_sentence(g["description"], 180))}</li>')
    out.append("</ul>")
    out.append("<h3>External browser projects (link only)</h3><p>PLAYCHIVE does not host or mirror these projects, their "
               "assets or their servers. They are listed as references to third-party sites.</p><ul>")
    for g in ext:
        url = g.get("projectUrl") or g.get("publicUrl")
        if url == "openresident.html":
            href = esc(url)
        else:
            href = esc(url)
        out.append(f'<li><a href="{href}" rel="noopener">{esc(g["name"])}</a> ({esc(g["genre"])}): '
                   f'{esc(first_sentence(g["description"], 180))}</li>')
    out.append("</ul><h2>Frequently asked questions</h2>")
    for q, a in HUB_FAQ:
        out.append(f"<h3>{esc(q)}</h3><p>{esc(a)}</p>")
    out.append('<h2>For agents and developers</h2><ul><li><a href="llms.txt">llms.txt</a> and '
               '<a href="llms-full.txt">llms-full.txt</a></li><li><a href="data/games.json">Catalog JSON</a></li>'
               '<li><a href="agent/">Agent guide</a></li><li><a href="about/">About and contact</a></li><li><a href="sitemap.xml">Sitemap</a></li>'
               f'<li><a href="{REPO_URL}">Source repository</a></li></ul>')
    out.append("</section>")
    return "\n".join(out)


def update_hub():
    p = ROOT / "index.html"
    text = p.read_text(encoding="utf-8")
    text = apply_head(text, hub_head())
    text = apply_body(text, hub_body(), "</main>")
    p.write_text(text, encoding="utf-8")


# ----------------------------------------------------------------- Persian page

FA_FAQ = [
    ("PLAYCHIVE چیست؟",
     "یک مجموعهٔ گزینش‌شده از بازی‌های کلاسیک، متن‌باز و رایگان که مستقیم در مرورگر اجرا می‌شوند. "
     "همه‌چیز با WebAssembly و HTML5 کار می‌کند، پس لازم نیست چیزی نصب کنی یا حساب کاربری بسازی."),
    ("واقعاً رایگان است؟ تبلیغ یا ثبت‌نام ندارد؟",
     "بله. بازی‌های آماده رایگان‌اند و هر کدام محتوای لازم برای اجرا را همراه خودشان دارند. "
     "ثبت‌نام، تبلیغ یا خرید درون‌برنامه‌ای در کار نیست. فقط ECWolf استثناست: موتورش اینجاست، "
     "ولی فایل‌های داده‌ی قانونی را باید خودت انتخاب کنی."),
    ("روی گوشی و با دسته هم کار می‌کند؟",
     "بله. روی گوشی کنترل لمسی به سبک PSP نمایش داده می‌شود و روی کامپیوتر می‌توانی از کیبورد، ماوس یا گیم‌پد "
     "استفاده کنی. حالت تمام‌صفحه هم در همهٔ بازی‌ها هست."),
    ("پیشرفتم کجا ذخیره می‌شود؟",
     "فقط در حافظهٔ محلی مرورگر خودت و روی هیچ سروری نمی‌رود. اگر داده‌های سایت را از مرورگر پاک کنی، "
     "ذخیره‌ها هم از بین می‌روند."),
    ("بدون اینترنت هم می‌شود بازی کرد؟",
     "بله. دکمهٔ «Offline Pack» بالای صفحه همهٔ بازی‌های آماده را در مرورگرت ذخیره می‌کند. "
     "بعد از دانلود اولیه، بدون اینترنت هم بازی‌ها اجرا می‌شوند."),
    ("دووم یا کوییک اصلی هم هست؟",
     "نه. PLAYCHIVE داده‌ی تجاری پخش نمی‌کند. به‌جایش محتوای آزادی مثل Freedoom و LibreQuake را دارد. "
     "اگر فایل WAD قانونی داری می‌توانی محلی واردش کنی و فایل از مرورگرت بیرون نمی‌رود."),
    ("چرا بعضی ورودی‌های کاتالوگ دکمهٔ اجرا ندارند؟",
     "بعضی پروژه‌ها فقط به صفحهٔ رسمی‌شان لینک شده‌اند، چون کد یا داده‌شان اجازهٔ پخش مجدد ندارد. "
     "این ورودی‌ها به‌وضوح با برچسب «لینک خارجی» مشخص شده‌اند و جزو بازی‌های قابل اجرا حساب نمی‌شوند."),
    ("چطور باگ گزارش بدهم یا بازی پیشنهاد کنم؟",
     "سورس‌کد در گیت‌هاب است و می‌توانی همان‌جا Issue باز کنی. فقط مجوز بازی را هم بنویس تا بتوانیم بررسی کنیم "
     "که امکان گذاشتنش هست یا نه."),
]


FA_DIGITS = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")


def fa_num(n):
    return str(n).translate(FA_DIGITS)


FA_CSS = """
@font-face{font-family:'Vazirmatn';src:url(../assets/fonts/Vazirmatn-Bold.woff2) format('woff2');font-weight:700;font-display:swap}
@font-face{font-family:'Vazirmatn';src:url(../assets/fonts/Vazirmatn-ExtraBold.woff2) format('woff2');font-weight:800;font-display:swap}
@font-face{font-family:'Shabnam';src:url(../assets/fonts/Shabnam-Regular.woff2) format('woff2');font-weight:400;font-display:swap}
@font-face{font-family:'Shabnam';src:url(../assets/fonts/Shabnam-Bold.woff2) format('woff2');font-weight:700;font-display:swap}
:root{color-scheme:light dark;--bg:#e7e6e0;--surf:#f4f3ee;--ink:#161815;--soft:#3c4039;--muted:#5b6057;--line:rgba(22,24,21,.16);--line-s:rgba(22,24,21,.34);--lime:#8e9b1f;--lime-ink:#161a05;--lime-soft:rgba(142,155,31,.16);--head:'Vazirmatn',Tahoma,system-ui,sans-serif;--body:'Shabnam',Tahoma,system-ui,sans-serif}
@media (prefers-color-scheme:dark){:root{--bg:#111210;--surf:#181917;--ink:#eceeec;--soft:#c3c8c0;--muted:#9ba097;--line:rgba(236,238,236,.1);--line-s:rgba(236,238,236,.28);--lime:#bdee63;--lime-ink:#11130c;--lime-soft:rgba(189,238,99,.12)}}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font:400 17px/2 var(--body);background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:36px 36px}
a{color:inherit;text-decoration-color:var(--lime);text-underline-offset:.28em}
.wrap{width:min(1080px,100% - 32px);margin:0 auto}
.bar{position:sticky;top:12px;z-index:10;margin:12px auto 0;width:min(1080px,100% - 32px);display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 8px 8px 16px;border:1px solid var(--line);border-radius:16px;background:color-mix(in srgb,var(--bg) 90%,transparent);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
.brand{font:800 22px/1 var(--head);letter-spacing:-.05em;text-decoration:none;direction:ltr}.brand b{color:var(--lime)}
nav{display:flex;gap:4px;flex-wrap:wrap}
nav a{padding:6px 14px;border-radius:999px;text-decoration:none;font-size:15px;color:var(--soft);transition:background .2s,color .2s}
nav a:hover{background:var(--lime-soft);color:var(--ink)}
nav a.en{border:1px solid var(--line-s);direction:ltr;font-family:var(--head);font-size:13px}
.hero{padding:clamp(48px,9vw,110px) 0 36px}
h1{font:800 clamp(34px,6.4vw,68px)/1.25 var(--head);margin:0;letter-spacing:-.02em;text-wrap:balance}
h1 em{font-style:normal;color:var(--lime)}
.lead{max-width:44em;margin:18px 0 0;font-size:clamp(18px,2.2vw,21px);color:var(--soft)}
.cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}
.btn{display:inline-block;padding:10px 26px;border-radius:6px;background:var(--ink);color:var(--bg);text-decoration:none;font:700 16px/1.8 var(--head);transition:transform .25s}
.btn:hover{transform:translateY(-2px)}.btn.alt{background:none;color:var(--ink);border:1px solid var(--line-s)}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:34px 0 0;padding:0;list-style:none}
.facts li{padding:14px 16px;border:1px solid var(--line);background:var(--surf);border-radius:4px}
.facts b{display:block;font:800 28px/1.4 var(--head);color:var(--lime)}.facts span{font-size:15px;color:var(--muted)}
h2{font:800 clamp(26px,4vw,38px)/1.4 var(--head);margin:0 0 6px;scroll-margin-top:84px}
.sec{padding:46px 0 10px}.sec>p{margin:0 0 22px;color:var(--muted);max-width:46em}
.games{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:16px}
.game{display:flex;flex-direction:column;border:1px solid var(--line);background:var(--surf);border-radius:4px;overflow:hidden;transition:transform .35s cubic-bezier(.16,1,.3,1),border-color .25s}
.game:hover{transform:translateY(-4px);border-color:var(--line-s)}
.game img{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;background:var(--line)}
.game div{display:flex;flex-direction:column;gap:6px;padding:14px 16px 16px;flex:1}
.game h3{margin:0;font:700 19px/1.5 var(--head);direction:ltr;text-align:right;unicode-bidi:isolate}
.tag{align-self:flex-start;padding:0 10px;border:1px solid var(--line-s);border-radius:999px;font-size:13px;line-height:1.7;color:var(--muted)}
.game p{margin:0;font-size:15.5px;line-height:1.95;color:var(--soft);flex:1}
.game .btn{align-self:flex-start;margin-top:8px;padding:5px 18px;font-size:15px}
details{border-top:1px solid var(--line);padding:12px 0}details:last-of-type{border-bottom:1px solid var(--line)}
summary{cursor:pointer;font:700 18px/1.8 var(--head);list-style:none;display:flex;justify-content:space-between;gap:16px}
summary::after{content:'+';color:var(--lime);font-size:24px;line-height:1.4;transition:transform .25s}details[open] summary::after{transform:rotate(45deg)}
summary::-webkit-details-marker{display:none}details p{margin:8px 0 2px;color:var(--soft);max-width:46em}
.about p{max-width:46em;color:var(--soft)}
footer{margin:56px 0 36px;padding-top:18px;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;gap:6px 18px;font-size:14px;color:var(--muted);direction:rtl}
footer a{direction:ltr;unicode-bidi:isolate}
:focus-visible{outline:2px solid var(--lime);outline-offset:3px}
@media (max-width:640px){.bar{padding-inline:12px}nav a{padding:5px 10px;font-size:14px}.brand{font-size:19px}}
@media (prefers-reduced-motion:reduce){*{transition:none!important;scroll-behavior:auto!important}}
"""


def fa_page():
    path = "fa/"
    n = len(PLAYABLE)
    title = "PLAYCHIVE | بازی‌های کلاسیک و متن‌باز رایگان در مرورگر، بدون نصب"
    desc = (f"{fa_num(n)} بازی کلاسیک و متن‌باز مثل OpenTTD، LibreQuake و HexGL را رایگان و بدون نصب، "
            "بدون ثبت‌نام و بدون تبلیغ، مستقیم در مرورگر بازی کن.")
    items = []
    for i, g in enumerate(PLAYABLE, 1):
        items.append({"@type": "ListItem", "position": i, "url": url_for(g["runtimeUrl"]), "name": g["name"]})
    graph = [
        organization(),
        {"@type": "WebPage", "@id": f"{BASE}/fa/#page", "url": f"{BASE}/fa/", "name": title, "description": desc,
         "inLanguage": "fa", "isPartOf": {"@id": SITE_ID}, "publisher": {"@id": ORG_ID},
         "mainEntity": {"@type": "ItemList", "name": "بازی‌های قابل اجرا در PLAYCHIVE",
                        "numberOfItems": len(items), "itemListElement": items}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "PLAYCHIVE", "item": f"{BASE}/"},
            {"@type": "ListItem", "position": 2, "name": "فارسی", "item": f"{BASE}/fa/"}]},
        faq_jsonld(FA_FAQ, "fa"),
    ]
    head = head_block(
        title=title, desc=desc, path=path, image=DEFAULT_OG,
        image_alt="PLAYCHIVE: بازی‌های کلاسیک در مرورگر", extra_ld=graph, locale="fa_IR",
        alternates=[("en", f"{BASE}/"), ("fa", f"{BASE}/fa/"), ("x-default", f"{BASE}/")],
    )
    cards = []
    for i, g in enumerate(PLAYABLE):
        genre = FA_GENRE.get(g["genre"], g["genre"])
        text = FA_DESC.get(g["id"], "")
        lazy = ' loading="lazy" decoding="async"' if i >= 3 else ' fetchpriority="high"' if i == 0 else ""
        cards.append(
            f'<li class="game"><img src="../{esc(g["artwork"])}" width="1280" height="720" alt="تصویری از بازی {esc(g["name"])}"{lazy}>'
            f'<div><h3 lang="en">{esc(g["name"])}</h3><span class="tag">{esc(genre)}</span><p>{esc(text)}</p>'
            f'<a class="btn" href="../{esc(g["runtimeUrl"])}" aria-label="اجرای {esc(g["name"])}">اجرای بازی</a></div></li>'
        )
    faq = "\n".join(f"<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>" for q, a in FA_FAQ)
    body = f"""<div class="bar"><a class="brand" href="../" lang="en" aria-label="PLAYCHIVE">PLAY<b>CHIVE</b></a>
<nav aria-label="ناوبری"><a href="#games">بازی‌ها</a><a href="#faq">پرسش‌ها</a><a href="#about">درباره</a><a class="en" href="../" lang="en" hreflang="en">English</a></nav></div>
<main class="wrap">
<section class="hero">
<h1>بازی‌های کلاسیک، <em>مستقیم توی مرورگر</em></h1>
<p class="lead">بدون نصب، بدون ثبت‌نام و بدون تبلیغ. PLAYCHIVE مجموعه‌ای گزینش‌شده از بازی‌های آزاد و متن‌باز است که همین‌جا اجرا می‌شوند. یک مسابقه بده، یک شهربازی بساز یا چند دقیقه‌ای با یک شوتر قدیمی دلتنگی کن.</p>
<div class="cta"><a class="btn" href="#games">بازی‌ها را ببین</a><a class="btn alt" href="../" lang="en">کاتالوگ کامل (English)</a></div>
<ul class="facts"><li><b>{fa_num(n)}</b><span>بازی آمادهٔ اجرا</span></li><li><b>۰</b><span>نصب، حساب کاربری یا تبلیغ</span></li><li><b>WebAssembly</b><span>و HTML5 زیر کاپوت</span></li></ul>
</section>
<section class="sec" id="games"><h2>همین الان بازی کن</h2>
<p>هر بازی در صفحهٔ خودش باز می‌شود و محتوایش همراه خودش است. روی گوشی کنترل لمسی و روی کامپیوتر کیبورد و دسته کار می‌کند.</p>
<ul class="games">
{chr(10).join(cards)}
</ul></section>
<section class="sec" id="faq"><h2>پرسش‌های پرتکرار</h2>
{faq}
</section>
<section class="sec about" id="about"><h2>دربارهٔ PLAYCHIVE</h2>
<p>PLAYCHIVE پروژه‌ای غیرتجاری است که <a href="https://github.com/MahanKenway" rel="noopener">ماهان توکلی</a> ساخته. هدفش این است که حس پیدا کردن بازی‌های قدیمی را برگرداند، بدون دردسر نصب و حساب کاربری. نام و مجوز سازندگان هر بازی کنار همان بازی می‌ماند و محتوای تجاری هم به‌عنوان رایگان معرفی نمی‌شود. سورس‌کد در <a href="{REPO_URL}" rel="noopener">گیت‌هاب</a> باز است.</p>
</section>
<footer><a href="../privacy/" lang="en">Privacy</a><a href="../llms.txt" lang="en">llms.txt</a><a href="../sitemap.xml" lang="en">Sitemap</a><a href="../about/" lang="en">About</a></footer>
</main>"""
    page = (
        '<!doctype html>\n<html lang="fa" dir="rtl">\n<head>\n<meta charset="utf-8" />\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1" />\n'
        '<meta name="theme-color" content="#e9e8e3" />\n<link rel="icon" href="../assets/favicon.ico" />\n'
        '<link rel="manifest" href="../manifest.json" />\n'
        '<link rel="preload" href="../assets/fonts/Shabnam-Regular.woff2" as="font" type="font/woff2" crossorigin />\n'
        '<link rel="preload" href="../assets/fonts/Vazirmatn-ExtraBold.woff2" as="font" type="font/woff2" crossorigin />\n'
        "<style>" + FA_CSS + "</style>\n" + head + "\n</head>\n<body>\n" + body + "\n</body>\n</html>\n"
    )
    out = ROOT / "fa/index.html"
    out.parent.mkdir(exist_ok=True)
    out.write_text(page, encoding="utf-8")


# -------------------------------------------------------------- llms.txt family

RIGHTS_NOTE = (
    "## Rights and external entries\n\n"
    "PLAYCHIVE distinguishes bundled libre/open-source content from local-file imports and external projects. Each "
    "catalog entry keeps upstream attribution and license information. Commercial copyrighted game data is not presented "
    "as bundled free content.\n\n"
    "Entries marked `EXTERNAL LINK` are link-only references: PLAYCHIVE does not mirror their code, WASM, game archives, "
    "maps, assets, trademarks or multiplayer services, and they are excluded from the Offline Pack. Agents must not "
    "describe them as local PLAYCHIVE runtimes or PLAYCHIVE-owned downloads.\n"
)


def write_llms():
    n = len(PLAYABLE)
    lines = [
        "# PLAYCHIVE",
        "",
        "> PLAYCHIVE is an independent, non-commercial browser hub for legally distributable open-source retro games, "
        "classic engines and experimental runtimes. Games run as WebAssembly or HTML5 directly in the browser, with no "
        "install and no account.",
        "",
        f"Facts: {n} playable runtimes ({len(FREE_PLAYABLE)} with free bundled content), {len(GAMES)} catalog records in total, "
        "keyboard, touch (PSP-style), gamepad and fullscreen support, saves stored locally in the browser. Created by "
        "Mahan Tavakoli (MahanKenway). Languages: English and Persian (fa). Site: https://playchive.ir",
        "",
        "## Play now",
        "",
    ]
    for g in PLAYABLE:
        note = " Requires your own lawful game data." if needs_local_data(g) else ""
        lines.append(f"- [{g['name']}]({url_for(g['runtimeUrl'])}): {g['genre']}. {first_sentence(g['description'], 170)}{note}")
    lines += [
        "",
        "## Guides and data",
        "",
        f"- [PLAYCHIVE home]({BASE}/): Searchable catalog with a static, crawlable game list.",
        f"- [Full catalog for LLMs]({BASE}/llms-full.txt): Every record with license, controls and rights status.",
        f"- [Catalog JSON]({BASE}/data/games.json): Machine-readable records for all {len(GAMES)} entries.",
        f"- [Agent guide]({BASE}/agent/): No-login discovery page for browser agents.",
        f"- [OpenAPI description]({BASE}/openapi.json): OpenAPI 3.1 spec of the read-only JSON endpoints (also listed in /.well-known/api-catalog).",
        f"- [Persian guide]({BASE}/fa/): Persian landing page (hreflang pair of the home page).",
        f"- [Privacy]({BASE}/privacy/): What is and is not collected.",
        f"- [About and contact]({BASE}/about/): Operator, imprint, licensing and how to reach the maintainer.",
        f"- [Agent skills]({BASE}/.well-known/agent-skills/index.json): Skills for browsing the catalog, launching games and describing rights.",
        f"- [MCP server]({BASE}/mcp): Read-only MCP endpoint (Streamable HTTP, POST JSON-RPC) with tools search_games, get_game, list_genres; card at {BASE}/.well-known/mcp-server-card.",
        f"- [Authentication]({BASE}/auth.md): No authentication or registration is needed; all endpoints are public and read-only.",
        "",
        RIGHTS_NOTE.rstrip(),
        "",
        "## Optional",
        "",
        f"- [Sitemap]({BASE}/sitemap.xml)",
        f"- [Source repository]({REPO_URL})",
        f"- [Agent manifest]({BASE}/agent-manifest.json)",
        "",
    ]
    (ROOT / "llms.txt").write_text("\n".join(lines), encoding="utf-8")

    full = ["# PLAYCHIVE: complete catalog", "",
            "> Every catalog record on https://playchive.ir with license, controls and rights status. "
            "Generated from data/games.json.", ""]
    groups = [("Playable in the browser", "play"), ("Doom-engine campaigns and local import", "local"),
              ("External browser projects (link only, not hosted by PLAYCHIVE)", "external")]
    for title, key in groups:
        full += [f"## {title}", ""]
        for g in [x for x in GAMES if classify(x) == key]:
            full.append(f"### {g['name']}")
            full.append("")
            full.append(" ".join(g["description"].split()))
            full.append("")
            full.append(f"- Genre: {g['genre']}")
            full.append(f"- Developer: {g['studio']}")
            full.append(f"- License: {g['license']}")
            full.append(f"- Status: {g['status']}")
            full.append(f"- Runtime: {g['runtimeType']}")
            if key == "play":
                full.append(f"- Play: {url_for(g['runtimeUrl'])}")
                full.append(f"- Controls: {', '.join(g['controls'])}")
            elif key == "external":
                full.append(f"- External link (not hosted by PLAYCHIVE): {g.get('projectUrl') or g.get('publicUrl')}")
            full.append("")
    full.append(RIGHTS_NOTE)
    (ROOT / "llms-full.txt").write_text("\n".join(full), encoding="utf-8")


# ------------------------------------------------------------------ agent files

def update_agent():
    (ROOT / "agent/catalog.json").write_text((ROOT / "data/games.json").read_text(encoding="utf-8"), encoding="utf-8")
    p = ROOT / "agent/index.html"
    t = p.read_text(encoding="utf-8")
    arts = []
    for g in GAMES:
        k = classify(g)
        href = g["runtimeUrl"] if k == "play" else (g.get("projectUrl") if k == "external" else None)
        title = esc(g["name"])
        if href:
            title = f'<a href="{esc("../" + href if k == "play" else href)}">{title}</a>'
        controls = ", ".join(g["controls"]) if k == "play" else "External page or local import"
        arts.append(
            f'<article class="agent-game" data-game-id="{esc(g["id"])}"><h2>{title}</h2>'
            f'<p>{esc(" ".join(g["description"].split()))}</p><dl><div><dt>Genre</dt><dd>{esc(g["genre"])}</dd></div>'
            f'<div><dt>Status</dt><dd>{esc(g["catalogState"])}</dd></div><div><dt>Runtime</dt><dd>{esc(g["runtimeType"])}</dd></div>'
            f"<div><dt>Controls</dt><dd>{esc(controls)}</dd></div></dl></article>")
    sec = (f'<section aria-labelledby="catalog-title"><h2 id="catalog-title">Complete game catalog ({len(GAMES)} records)</h2>'
           + "".join(arts) + "</section>")
    t2 = re.sub(r'<section aria-labelledby="catalog-title">.*?</section>', lambda m: sec, t, count=1, flags=re.S)
    p.write_text(t2, encoding="utf-8")



# ------------------------------------------------------------- simple pages

def update_simple_page(rel, name, parent_name="PLAYCHIVE"):
    """Add canonical/OG/Twitter/JSON-LD to a hand-written page, keeping its own title and description."""
    p = ROOT / rel
    t = p.read_text(encoding="utf-8")
    m = re.search(r"<title>(.*?)</title>", t, re.S)
    title = html.unescape(m.group(1).strip()).replace(" \u2014 ", ": ")
    d = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', t)
    desc = html.unescape(d.group(1)) if d else title
    path = rel[: -len("index.html")] if rel.endswith("index.html") else rel
    url = url_for(path)
    graph = [
        {"@type": "WebPage", "@id": f"{url}#page", "url": url, "name": title, "description": desc, "inLanguage": "en",
         "isPartOf": {"@id": SITE_ID}, "publisher": {"@id": ORG_ID}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": parent_name, "item": f"{BASE}/"},
            {"@type": "ListItem", "position": 2, "name": name, "item": url}]},
    ]
    block = head_block(title=title, desc=desc, path=path, image=DEFAULT_OG,
                       image_alt="PLAYCHIVE browser arcade with classic open-source game worlds", extra_ld=graph)
    p.write_text(apply_head(t, block), encoding="utf-8")


# ------------------------------------------------------- agent skills discovery

def write_skills_index():
    """Agent Skills Discovery RFC v0.2.0: /.well-known/agent-skills/index.json (served by the Worker)."""
    import hashlib as _h
    skills = []
    for d in sorted((ROOT / "agent-skills").iterdir()):
        f = d / "SKILL.md"
        if not f.is_file():
            continue
        raw = f.read_bytes()
        text = raw.decode("utf-8")
        m = re.match(r"---\n(.*?)\n---\n", text, re.S)
        assert m, f"{f}: missing frontmatter"
        fm = dict(re.findall(r"^(\w+):\s*(.+)$", m.group(1), re.M))
        assert fm["name"] == d.name, f"{f}: frontmatter name must equal folder name"
        skills.append({
            "name": fm["name"],
            "type": "skill-md",
            "description": fm["description"],
            "url": f"{BASE}/.well-known/agent-skills/{fm['name']}/SKILL.md",
            "digest": "sha256:" + _h.sha256(raw).hexdigest(),
        })
    doc = {"$schema": "https://schemas.agentskills.io/discovery/0.2.0/schema.json", "skills": skills}
    (ROOT / "agent-skills/index.json").write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

# ---------------------------------------------------------------------- sitemap

def build_sitemap(today):
    state_path = ROOT / "data/seo-state.json"
    state = json.loads(state_path.read_text(encoding="utf-8")) if state_path.exists() else {}
    pages = [("", "index.html", "weekly", "1.0", True, DEFAULT_OG),
             ("fa/", "fa/index.html", "monthly", "0.8", True, DEFAULT_OG)]
    for g in PLAYABLE:
        if g["runtimeUrl"] == "openresident.html":
            continue
        pages.append((g["runtimeUrl"], g["runtimeUrl"], "monthly", "0.7", False, g["artwork"]))
    pages += [("agent/", "agent/index.html", "monthly", "0.4", False, None),
              ("privacy/", "privacy/index.html", "yearly", "0.3", False, None),
              ("about/", "about/index.html", "yearly", "0.3", False, None)]
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
           'xmlns:xhtml="http://www.w3.org/1999/xhtml" '
           'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">']
    new_state = {}
    for path, file, freq, prio, alt, img in pages:
        h = hashlib.sha256((ROOT / file).read_bytes()).hexdigest()
        prev = state.get(path or "/")
        lastmod = prev["lastmod"] if prev and prev["hash"] == h else today
        new_state[path or "/"] = {"hash": h, "lastmod": lastmod}
        out.append("  <url>")
        out.append(f"    <loc>{esc(url_for(path))}</loc>")
        out.append(f"    <lastmod>{lastmod}</lastmod>")
        out.append(f"    <changefreq>{freq}</changefreq>")
        out.append(f"    <priority>{prio}</priority>")
        if alt:
            out.append(f'    <xhtml:link rel="alternate" hreflang="en" href="{BASE}/" />')
            out.append(f'    <xhtml:link rel="alternate" hreflang="fa" href="{BASE}/fa/" />')
            out.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{BASE}/" />')
        if img:
            rel, _, _ = image_info(img)
            out.append(f"    <image:image><image:loc>{esc(url_for(rel))}</image:loc></image:image>")
        out.append("  </url>")
    out.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(out) + "\n", encoding="utf-8")
    state_path.write_text(json.dumps(new_state, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def write_markdown():
    """md/<page>.md for `Accept: text/markdown` (the Worker maps URLs to these files)."""
    import shutil, sys
    sys.path.insert(0, str(ROOT / "scripts"))
    import htmlmd
    out = ROOT / "md"
    shutil.rmtree(out, ignore_errors=True)
    pages = ["index.html", "fa/index.html", "about/index.html", "privacy/index.html", "agent/index.html"]
    pages += [g["runtimeUrl"] for g in PLAYABLE if g["runtimeUrl"] != "openresident.html"]
    for rel in pages:
        src = (ROOT / rel).read_text(encoding="utf-8")
        path = rel[: -len("index.html")] if rel.endswith("index.html") else rel
        dest = out / ((path + "index.md") if path == "" or path.endswith("/") else rel[: -len(".html")] + ".md")
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(htmlmd.page_to_markdown(src, url_for(path)), encoding="utf-8")


def write_indexnow():
    (ROOT / f"{INDEXNOW_KEY}.txt").write_text(INDEXNOW_KEY, encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=datetime.date.today().isoformat())
    args = ap.parse_args()
    global UPDATED
    UPDATED = args.date
    for g in PLAYABLE:
        update_game_page(g)
    update_hub()
    fa_page()
    update_agent()
    update_simple_page("agent/index.html", "Agent guide")
    update_simple_page("privacy/index.html", "Privacy")
    update_simple_page("about/index.html", "About")
    write_skills_index()
    write_llms()
    write_indexnow()
    write_markdown()
    build_sitemap(args.date)
    print(f"playable pages: {len(PLAYABLE)}, catalog records: {len(GAMES)}")


if __name__ == "__main__":
    main()
