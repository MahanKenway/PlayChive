import { applyLang, getLang, onLangChange, setText, sourceText } from './i18n.js?v=1';
// Header interactions: sliding nav indicator, scroll condense and progress, brand
// morph, scramble text, magnetic buttons, offline progress ring and the eye easter egg.
// Pure CSS and Web Animations. Existing element ids stay wired to their own modules.
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const GLYPHS = '▮▯▒░#/\\<>_+';
const SECRET_KEY = 'playchive:secrets';

function scramble(el, to, ms = 650) {
  if (!el) return;
  if (reduced() || getLang() === 'fa') { cancelAnimationFrame(el._scr || 0); setText(el, to); return; }
  const start = performance.now();
  cancelAnimationFrame(el._scr || 0);
  const tick = (now) => {
    const p = Math.min(1, (now - start) / ms);
    const n = Math.floor(p * to.length);
    let out = '';
    for (let i = 0; i < to.length; i += 1) out += i < n || to[i] === ' ' ? to[i] : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    el.textContent = out;
    if (p < 1) el._scr = requestAnimationFrame(tick); else setText(el, to);
  };
  el._scr = requestAnimationFrame(tick);
}

function initNav(header, scroller) {
  const nav = header.querySelector('.pc-nav');
  const pill = nav.querySelector('.pc-pill');
  const ghost = nav.querySelector('.pc-ghost');
  const buttons = [...nav.querySelectorAll('button')];
  const place = (el, btn) => {
    el.style.width = `${btn.offsetWidth}px`;
    el.style.height = `${btn.offsetHeight}px`;
    el.style.transform = `translate(${btn.offsetLeft}px, ${btn.offsetTop}px)`;
  };
  const current = () => nav.querySelector('.is-active') ?? buttons[0];
  const sync = () => place(pill, current());
  const activate = (btn) => {
    buttons.forEach((b) => { b.classList.toggle('is-active', b === btn); b.toggleAttribute('aria-current', b === btn); });
    if (btn.hasAttribute('aria-current')) btn.setAttribute('aria-current', 'true');
    sync();
  };
  buttons.forEach((btn) => {
    const label = btn.querySelector('.pc-label');
    const text = label ? sourceText(label) : '';
    const enter = () => { place(ghost, btn); ghost.style.opacity = '1'; if (label) scramble(label, text, 380); };
    btn.addEventListener('pointerenter', enter);
    btn.addEventListener('focus', enter);
    btn.addEventListener('click', () => {
      activate(btn);
      // #wad-picker is the real scrolling viewport. A normal
      // scrollIntoView call can leave the user at the top of the hub while
      // the catalog grid remains far below the genre-navigation section.
      // Send Collections directly to the catalog section inside that box.
      if (btn.dataset.retroNav === 'catalog') {
        const section = document.getElementById('catalog');
        if (section) scroller.scrollTo({
          top: Math.max(0, section.offsetTop - 12),
          behavior: reduced() ? 'auto' : 'smooth',
        });
      }
    });
  });
  nav.addEventListener('pointerleave', () => { ghost.style.opacity = '0'; });
  nav.addEventListener('focusout', () => { ghost.style.opacity = '0'; });
  window.addEventListener('resize', sync);
  document.fonts?.ready.then(sync);
  sync();
  requestAnimationFrame(sync);

  // Scroll spy: highlight the section that is in view.
  const map = new Map(buttons.map((b) => [b.dataset.retroNav, b]));
  if ('IntersectionObserver' in window) {
    const visible = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
      let best = null; let ratio = 0.05;
      visible.forEach((r, id) => { if (r > ratio && map.has(id)) { best = id; ratio = r; } });
      if (best && map.get(best) !== current()) activate(map.get(best));
    }, { root: scroller, threshold: [0.05, 0.2, 0.4, 0.6] });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }
}

function initScroll(header, scroller) {
  const bar = header.querySelector('.pc-progress i');
  let ticking = false;
  const update = () => {
    ticking = false;
    const max = scroller.scrollHeight - scroller.clientHeight;
    const p = max > 0 ? scroller.scrollTop / max : 0;
    header.classList.toggle('is-condensed', scroller.scrollTop > 48);
    bar.style.transform = `scaleX(${p})`;
  };
  scroller.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

function initBrand(header) {
  const home = header.querySelector('.pc-home');
  const wm = header.querySelector('.pc-wm');
  const sub = header.querySelector('#pc-sub');
  if (!home || !wm) return;
  const base = sub?.dataset.text ?? '';
  const open = () => { wm.classList.add('is-open'); scramble(sub, 'PLAY. ARCHIVE. REPEAT.', 700); };
  const close = () => { wm.classList.remove('is-open'); scramble(sub, base.toUpperCase(), 500); };
  home.addEventListener('pointerenter', open);
  home.addEventListener('pointerleave', close);
  home.addEventListener('focus', open);
  home.addEventListener('blur', close);
}

function initMagnet(header) {
  if (reduced() || !window.matchMedia('(hover: hover)').matches) return;
  header.querySelectorAll('.pc-ibtn, .pc-search, .pc-theme').forEach((el) => {
    let raf = 0;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * 0.28;
      const y = (e.clientY - (r.top + r.height / 2)) * 0.28;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { el.style.transform = `translate(${x}px, ${y}px)`; });
    });
    el.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); el.style.transform = ''; });
  });
}

function initTools(header) {
  // Audio popover.
  const wrap = header.querySelector('.retro-audio');
  const toggle = document.getElementById('retro-audio-toggle');
  const pop = header.querySelector('.pc-pop');
  if (wrap && toggle && pop) {
    const sync = () => pop.classList.toggle('is-open', toggle.classList.contains('is-audio-active'));
    new MutationObserver(sync).observe(toggle, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('pointerdown', (e) => { if (!wrap.contains(e.target)) pop.classList.remove('is-open'); });
    toggle.addEventListener('click', () => requestAnimationFrame(() => { if (toggle.classList.contains('is-audio-active')) pop.classList.add('is-open'); }));
    sync();
  }
  // Offline ring follows the percentage the offline module writes into the status text.
  const btn = document.getElementById('offline-pack-button');
  const status = document.getElementById('offline-pack-status');
  const ring = header.querySelector('.pc-ring circle');
  if (btn && status && ring) {
    const apply = () => {
      const m = /(\d+)%/.exec(status.textContent);
      const state = btn.dataset.offlineState;
      const pct = state === 'ready' ? 100 : (m ? Number(m[1]) : 0);
      ring.style.strokeDashoffset = String(100 - pct);
    };
    new MutationObserver(apply).observe(status, { childList: true, characterData: true, subtree: true });
    new MutationObserver(apply).observe(btn, { attributes: true, attributeFilter: ['data-offline-state'] });
    apply();
  }
  // Library count bump.
  const count = document.getElementById('library-count');
  if (count) {
    let last = count.textContent;
    new MutationObserver(() => {
      if (count.textContent === last) return;
      last = count.textContent;
      count.classList.remove('is-bump'); void count.offsetWidth; count.classList.add('is-bump');
    }).observe(count, { childList: true, characterData: true, subtree: true });
  }
  // Search jumps to the catalog search field.
  const focusSearch = () => {
    const input = document.getElementById('search-input');
    document.getElementById('catalog')?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    window.setTimeout(() => input?.focus({ preventScroll: true }), 450);
  };
  header.querySelector('.pc-search')?.addEventListener('click', focusSearch);
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(input|textarea|select)$/i.test(e.target?.tagName ?? '') || e.target?.isContentEditable) return;
    e.preventDefault();
    focusSearch();
  });
}

function initEye(header) {
  const eye = header.querySelector('.pc-eye');
  if (!eye) return;
  const toast = document.createElement('div');
  toast.className = 'pc-toast'; toast.setAttribute('role', 'status');
  const crt = document.createElement('div'); crt.className = 'pc-crt'; crt.setAttribute('aria-hidden', 'true');
  document.body.append(toast, crt);
  let timer = 0; let clicks = []; let found = 0;
  try { found = Number(localStorage.getItem(SECRET_KEY)) || 0; } catch { /* storage unavailable */ }
  const say = (text) => { toast.textContent = text; toast.classList.add('is-show'); clearTimeout(timer); timer = window.setTimeout(() => toast.classList.remove('is-show'), 2300); };
  eye.addEventListener('click', () => {
    const r = eye.getBoundingClientRect();
    if (!reduced()) {
      const ripple = document.createElement('i');
      ripple.className = 'pc-ripple';
      ripple.style.left = `${r.left + r.width / 2}px`; ripple.style.top = `${r.top + r.height / 2}px`;
      document.body.append(ripple);
      window.setTimeout(() => ripple.remove(), 1000);
    }
    eye.classList.remove('is-awake'); void eye.offsetWidth; eye.classList.add('is-awake');
    const now = Date.now();
    clicks = clicks.filter((t) => now - t < 1500); clicks.push(now);
    if (clicks.length >= 3) {
      clicks = []; found += 1;
      try { localStorage.setItem(SECRET_KEY, String(found)); } catch { /* ignore */ }
      crt.classList.remove('is-go'); void crt.offsetWidth; crt.classList.add('is-go');
      say(`Secret found // ${String(Math.min(found, 99)).padStart(2, '0')}`);
    } else if (clicks.length === 1) say('// the eye sees you');
  });
}


function initLang(header) {
  const box = header.querySelector('#pc-lang');
  if (!box) return;
  const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage can be blocked */ } };
  const sync = (lang) => {
    box.dataset.lang = lang;
    box.querySelectorAll('.pc-lang-seg').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  };
  sync(getLang());
  onLangChange(sync);
  box.addEventListener('click', (e) => {
    const btn = e.target.closest('.pc-lang-seg');
    if (!btn || btn.dataset.lang === getLang()) return;
    dismiss();
    applyLang(btn.dataset.lang);
  });

  // Gentle, dismissible hint for Persian-language browsers that never chose a language. Never switches by itself.
  let hint = null;
  function dismiss() {
    if (!hint) return;
    write('playchive:lang-hint', '1');
    hint.remove();
    hint = null;
  }
  const wantsFa = (navigator.languages || [navigator.language || '']).some((l) => /^fa\b/i.test(l));
  if (!wantsFa || getLang() === 'fa' || read('playchive:lang') || read('playchive:lang-hint')) return;
  hint = document.createElement('div');
  hint.className = 'pc-lang-hint';
  hint.setAttribute('role', 'status');
  hint.lang = 'fa';
  hint.dir = 'rtl';
  hint.dataset.noI18n = '';
  const go = document.createElement('button');
  go.type = 'button';
  go.className = 'pc-lang-hint-go';
  go.textContent = 'فارسی';
  go.addEventListener('click', () => { dismiss(); applyLang('fa'); });
  const text = document.createElement('span');
  text.append('این سایت فارسی هم دارد: ', go);
  const close = document.createElement('button');
  close.type = 'button';
  close.setAttribute('aria-label', 'بستن');
  close.textContent = '×';
  close.addEventListener('click', dismiss);
  hint.addEventListener('keydown', (e) => { if (e.key === 'Escape') dismiss(); });
  hint.append(text, close);
  box.append(hint);
  setTimeout(dismiss, 12000);
}

export function initHeader() {
  const header = document.getElementById('pc-header');
  const scroller = document.getElementById('wad-picker');
  if (!header || !scroller) return;
  initNav(header, scroller);
  initScroll(header, scroller);
  initBrand(header);
  initMagnet(header);
  initTools(header);
  initEye(header);
  initLang(header);
}
