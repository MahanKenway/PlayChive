#!/usr/bin/env node
// Fails when UI text has no Persian translation. Run: node scripts/check-i18n.mjs
// Every visible English string in index.html and every catalog field value needs an entry in src/i18n/*.js.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const strip = (u) => u.replace(/\?v=[^'"]*/g, '');
// The dictionary modules import each other with ?v= cache busters; load them from a temp copy without those.
const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'i18n-'));
for (const f of fs.readdirSync(path.join(root, 'src/i18n'))) {
  fs.writeFileSync(path.join(tmp, f), strip(fs.readFileSync(path.join(root, 'src/i18n', f), 'utf8')));
}
const { FA, FA_PATTERNS } = await import(pathToFileURL(path.join(tmp, 'fa.js')).href);
const norm = (s) => s.replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const PREFIXES = ['> ', '⇩ ', '// '];
function has(text) {
  if (Object.hasOwn(FA, text)) return true;
  for (const [re, fn] of FA_PATTERNS) { const m = text.match(re); if (m) return true; }
  for (const p of PREFIXES) if (text.startsWith(p) && has(text.slice(p.length))) return true;
  for (const j of [' · ', ' / ']) if (text.includes(j) && text.split(j).every((x) => has(x) || !/[A-Za-z]{3,}/.test(x))) return true;
  return false;
}
// Text that stays Latin on purpose: names, codes, file formats, decorative tokens.
const KEEP = /^(?:[A-Z]{1,6}|PLAY|CHIVE|HexGL|PLAYCHIVE|IWAD|PWAD|EN|E1M1|-- FPS|0 MB|L \/ R|\/\/ [A-Z]\d?|v[\d.]+.*|\d[\d\s/%.\-]*)$/;

const missing = new Set();
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let body = html.slice(html.indexOf('<body'));
body = body.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<svg[\s\S]*?<\/svg>/g, '')
  .replace(/<section id="static-catalog"[\s\S]*?<\/section>/, '').replace(/<canvas[\s\S]*?<\/canvas>/g, '')
  .replace(/<[^>]+\bdata-no-i18n\b[^>]*>[\s\S]*?<\/[a-z0-9]+>/g, '');
for (const m of body.matchAll(/>([^<>]*[A-Za-z][^<>]*)</g)) {
  const t = norm(m[1]);
  if (t && !KEEP.test(t) && !has(t)) missing.add('text: ' + t);
}
for (const m of body.matchAll(/\b(?:aria-label|title|placeholder|alt)="([^"]*[A-Za-z][^"]*)"/g)) {
  const t = norm(m[1]);
  if (!KEEP.test(t) && !has(t) && !/[؀-ۿ]/.test(t)) missing.add('attr: ' + t);
}
// catalog values
const src = fs.readFileSync(path.join(root, 'src/catalog.js'), 'utf8');
const start = src.indexOf('[', src.indexOf('export const COLLECTIONS'));
let depth = 0, i = start;
for (; i < src.length; i++) { if (src[i] === '[') depth++; else if (src[i] === ']' && --depth === 0) break; }
const games = (0, eval)(src.slice(start, i + 1));
const FIELDS = ['format', 'genre', 'duration', 'maps', 'status', 'license', 'description', 'runtimeLabel', 'catalogState', 'downloadLabel', 'downloadNote', 'projectLabel', 'playLabel'];
for (const g of games) for (const f of FIELDS) {
  const v = g[f];
  if (typeof v === 'string' && /[A-Za-z]{3,}/.test(v) && !has(norm(v))) missing.add(`game ${g.id}.${f}: ${v}`);
}
fs.rmSync(tmp, { recursive: true, force: true });
if (missing.size) {
  console.error(`i18n: ${missing.size} string(s) have no Persian translation (add them to src/i18n/fa-*.js):`);
  for (const m of [...missing].sort()) console.error('  ' + m);
  process.exit(1);
}
console.log('i18n: all UI strings and catalog fields have Persian text');
