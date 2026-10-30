"""Tiny HTML -> Markdown converter for PLAYCHIVE pages (stdlib only, Python 3.10 safe).

Used by generate-seo.py to write md/<page>.md files that the Worker serves when a client
sends `Accept: text/markdown`.
"""
from __future__ import annotations

import html
import re
from html.parser import HTMLParser
from urllib.parse import urljoin

SKIP = {"script", "style", "noscript", "template", "svg", "iframe"}


class _MD(HTMLParser):
    def __init__(self, base: str):
        super().__init__(convert_charrefs=True)
        self.base = base
        self.out: list[str] = []
        self.skip = 0
        self.href: list[str | None] = []
        self.list_depth = 0

    def _w(self, s: str):
        self.out.append(s)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in SKIP or "hidden" in a:
            if tag not in {"br", "img", "meta", "link", "input"}:
                self.skip += 1
            return
        if self.skip:
            return
        if tag in {"h1", "h2", "h3", "h4"}:
            self._w("\n\n" + "#" * int(tag[1]) + " ")
        elif tag in {"p", "section", "div", "dl", "details"}:
            self._w("\n\n")
        elif tag == "li":
            self._w("\n" + "  " * max(self.list_depth - 1, 0) + "- ")
        elif tag in {"ul", "ol"}:
            self.list_depth += 1
            self._w("\n")
        elif tag == "dt":
            self._w("\n- **")
        elif tag == "dd":
            pass
        elif tag == "summary":
            self._w("\n\n### ")
        elif tag == "br":
            self._w("  \n")
        elif tag in {"strong", "b"}:
            self._w("**")
        elif tag in {"em", "i"}:
            self._w("*")
        elif tag == "code":
            self._w("`")
        elif tag == "a":
            self.href.append(a.get("href"))
            self._w("[")

    def handle_endtag(self, tag):
        if tag in SKIP:
            if self.skip:
                self.skip -= 1
            return
        if self.skip:
            return
        if tag in {"h1", "h2", "h3", "h4", "p", "section", "dl", "details", "summary"}:
            self._w("\n\n" if tag != "summary" else "\n\n")
        elif tag in {"ul", "ol"}:
            self.list_depth = max(self.list_depth - 1, 0)
            self._w("\n")
        elif tag == "dt":
            self._w(":** ")
        elif tag in {"strong", "b"}:
            self._w("**")
        elif tag in {"em", "i"}:
            self._w("*")
        elif tag == "code":
            self._w("`")
        elif tag == "a":
            href = self.href.pop() if self.href else None
            if href and not href.startswith(("#", "javascript:")):
                self._w(f"]({urljoin(self.base, href)})")
            else:
                self._w("]")
                # drop the dangling "[" so plain anchors read as text
                for i in range(len(self.out) - 1, -1, -1):
                    if self.out[i] == "[":
                        self.out[i] = ""
                        self.out[-1] = ""
                        break

    def handle_data(self, data):
        if self.skip:
            return
        self._w(re.sub(r"\s+", " ", data))


def convert(fragment: str, base: str) -> str:
    p = _MD(base)
    p.feed(fragment)
    text = "".join(p.out)
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\[\s*\]\([^)]*\)", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip() + "\n"


def page_to_markdown(src: str, url: str) -> str:
    """Title, description and the main readable content of one page."""
    t = re.search(r"<title>(.*?)</title>", src, re.S)
    title = html.unescape(t.group(1).strip()) if t else url
    d = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', src)
    desc = html.unescape(d.group(1)) if d else ""
    body = ""
    m = re.search(r'<section id="static-catalog".*?</section>', src, re.S)
    if m:
        body = m.group(0)
    else:
        m = re.search(r'<section class="seo-about".*?</section>', src, re.S)
        if m:
            body = m.group(0)
        else:
            m = re.search(r"<main[^>]*>(.*?)</main>", src, re.S)
            body = m.group(1) if m else ""
    md = convert(body, url)
    head = f"# {title}\n\n"
    if desc:
        head += f"> {desc}\n\n"
    head += f"Source: {url}\n\n"
    if md.lstrip().startswith("# "):  # page already starts with its own H1
        head = f"> {desc}\n\nSource: {url}\n\n" if desc else f"Source: {url}\n\n"
    return head + md
