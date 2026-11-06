#!/usr/bin/env python3
"""Make small WebP tiles for the boot screen's image wall (assets/loading/*.webp).

The wall shows every catalog artwork, so tiles must be tiny (about 6-12 KB each) to keep the first paint fast.
Run again whenever a game is added:  python3 scripts/make-loading-thumbs.py
"""
import json, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/loading"
OUT.mkdir(exist_ok=True)
games = json.loads((ROOT / "data/games.json").read_text(encoding="utf-8"))["games"]
seen, total = set(), 0
for g in games:
    art = g.get("artwork")
    if not art or art in seen:
        continue
    seen.add(art)
    src = ROOT / art
    if not src.exists():
        continue
    im = Image.open(src).convert("RGB")
    w, h = im.size
    target = 16 / 9
    if w / h > target:
        nw = int(h * target); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = int(w / target); im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    im = im.resize((384, 216), Image.LANCZOS)
    dest = OUT / (src.stem + ".webp")
    im.save(dest, "WEBP", quality=66, method=6)
    total += dest.stat().st_size
print(f"{len(seen)} tiles, {total/1024:.0f} KB total")
