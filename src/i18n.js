/**
 * i18n.js: in-place language switch (English / Persian), the same way theme.js switches light / dark.
 *
 * How it works
 *   - The page is authored in English. The Persian dictionary (src/i18n/fa.js) maps each exact English string
 *     to its Persian text, so the markup and the JS templates stay plain English and nothing is duplicated.
 *   - applyLang('fa') sets <html lang="fa" dir="rtl"> and swaps text nodes and the aria-label, title,
 *     placeholder and alt attributes. A MutationObserver translates anything the app renders later
 *     (catalog cards, dialogs, boot log). Switching back restores the originals.
 *   - Patterns (regex to function) cover strings with numbers in them, such as "13 records".
 *   - Subtrees marked data-no-i18n (and the no-JS #static-catalog list) are left alone.
 * Persisted in localStorage as "playchive:lang"; the inline script in <head> applies it before first paint.
 */
import { FA, FA_PATTERNS } from './i18n/fa.js?v=1';

const KEY = 'playchive:lang';
const ATTRS = ['aria-label', 'title', 'placeholder', 'alt'];
const SKIP = 'script,style,svg,canvas,[data-no-i18n],#static-catalog,noscript';
const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const listeners = new Set();

const textOriginals = new WeakMap(); // Text node -> { en, fa }
const attrOriginals = new WeakMap(); // Element -> { [attr]: { en, fa } }
let observer = null;
let lang = document.documentElement.lang === 'fa' ? 'fa' : 'en';

export const faDigits = (value) => String(value).replace(/\d/g, (d) => FA_DIGITS[+d]);
export const getLang = () => lang;
export const isRtl = () => lang === 'fa';
export const onLangChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

/** Translate one English string. Unknown strings come back unchanged. */
export function t(en) {
  if (lang !== 'fa' || typeof en !== 'string') return en;
  return translate(en) ?? en;
}

const PREFIXES = ['> ', '⇩ ', '// '];
const JOINERS = [' · ', ' / '];

function translate(raw) {
  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  if (Object.hasOwn(FA, text)) return FA[text];
  for (const [re, fn] of FA_PATTERNS) {
    const m = text.match(re);
    if (m) return fn(...m.slice(1), (part) => translate(part) ?? part);
  }
  // "> boot line", "⇩ Download X": translate the rest and keep the marker.
  for (const prefix of PREFIXES) {
    if (text.startsWith(prefix)) {
      const rest = translate(text.slice(prefix.length));
      if (rest != null) return prefix + rest;
    }
  }
  // "BKcore · Pinned WebGL runtime": translate each part, keep the separators.
  for (const joiner of JOINERS) {
    if (text.includes(joiner)) {
      const parts = text.split(joiner);
      const out = parts.map((part) => translate(part));
      if (out.some((x) => x != null)) return out.map((x, i) => x ?? parts[i]).join(joiner);
    }
  }
  return null;
}

function translateTextNode(node) {
  const rec = textOriginals.get(node);
  const current = node.nodeValue;
  if (rec && current === rec.fa) return; // already ours
  const fa = translate(current);
  if (fa == null) return;
  const lead = current.match(/^\s*/)[0];
  const trail = current.match(/\s*$/)[0];
  const out = lead + fa + trail;
  textOriginals.set(node, { en: current, fa: out });
  node.nodeValue = out;
  markPersian(node.parentElement);
}

// Persian needs different type than the English UI (no tracking, taller lines, a size floor). CSS keys off these marks.
function markPersian(el) {
  if (!el || el.hasAttribute('data-fa')) return;
  el.setAttribute('data-fa', '');
  if (parseFloat(getComputedStyle(el).fontSize) < 12) el.setAttribute('data-fa-sm', '');
}

function translateAttrs(el) {
  for (const attr of ATTRS) {
    if (!el.hasAttribute(attr)) continue;
    const current = el.getAttribute(attr);
    const rec = attrOriginals.get(el)?.[attr];
    if (rec && current === rec.fa) continue;
    const fa = translate(current);
    if (fa == null) continue;
    const bag = attrOriginals.get(el) || {};
    bag[attr] = { en: current, fa };
    attrOriginals.set(el, bag);
    el.setAttribute(attr, fa);
  }
}

function walk(root) {
  if (root.nodeType === 3) {
    if (!root.parentElement?.closest(SKIP)) translateTextNode(root);
    return;
  }
  if (root.nodeType !== 1) return;
  if (root.matches(SKIP) || root.parentElement?.closest(SKIP)) return;
  translateAttrs(root);
  for (const child of root.childNodes) walk(child);
}

function restore(root) {
  const tree = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node = tree.currentNode;
  while (node) {
    if (node.nodeType === 3) {
      const rec = textOriginals.get(node);
      if (rec && node.nodeValue === rec.fa) node.nodeValue = rec.en;
      textOriginals.delete(node);
    } else if (node.nodeType === 1) {
      const bag = attrOriginals.get(node);
      if (bag) for (const [attr, rec] of Object.entries(bag)) {
        if (node.getAttribute(attr) === rec.fa) node.setAttribute(attr, rec.en);
      }
      attrOriginals.delete(node);
    }
    node = tree.nextNode();
  }
}

function startObserver() {
  if (observer) return;
  observer = new MutationObserver((records) => {
    if (lang !== 'fa') return;
    for (const r of records) {
      if (r.type === 'childList') r.addedNodes.forEach(walk);
      else if (r.type === 'characterData') walk(r.target);
      else if (r.type === 'attributes') translateAttrs(r.target);
    }
  });
  observer.observe(document.documentElement, {
    childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS,
  });
}

const metaDescription = () => document.querySelector('meta[name="description"]');

/** Switch language in place. `persist` stores the choice; `sync` updates the address bar (/ or /fa/). */
export function applyLang(next, { persist = true, sync = true } = {}) {
  next = next === 'fa' ? 'fa' : 'en';
  const html = document.documentElement;
  const changed = next !== lang;
  lang = next;
  html.lang = next;
  html.dir = next === 'fa' ? 'rtl' : 'ltr';
  if (persist) { try { localStorage.setItem(KEY, next); } catch { /* storage can be blocked */ } }
  if (next === 'fa') { walk(document.body); startObserver(); } else { restore(document.body); }
  const desc = metaDescription();
  if (desc) {
    desc.dataset.en ||= desc.content;
    desc.content = next === 'fa' ? (FA['meta:description'] || desc.dataset.en) : desc.dataset.en;
  }
  if (sync && changed) {
    try {
      const base = new URL(document.baseURI);
      const target = new URL(next === 'fa' ? 'fa/' : '', base);
      target.hash = location.hash;
      history.replaceState(history.state, '', target);
    } catch { /* ignore */ }
  }
  if (changed) listeners.forEach((fn) => fn(next));
}

/** Call once at startup: honours the language chosen earlier (the inline script already set <html>). */
export function initI18n() {
  if (lang === 'fa') {
    try { localStorage.setItem(KEY, 'fa'); } catch { /* ignore */ }
    walk(document.body);
    startObserver();
  }
}
