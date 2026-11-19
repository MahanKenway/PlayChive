/*
 * Misremember, Persian edition layer (PLAYCHIVE).
 * Follows the language saved by PLAYCHIVE ("playchive:lang"), or ?lang=fa / ?lang=en.
 * English stays the default; the game code is only hooked at its text outputs
 * (in-world notes, caption, say lines, prompt). Written by Mahan Kenway for PLAYCHIVE.
 * The game itself is used with its author's permission, see LICENSE.txt.
 */
(function (root) {
  'use strict';
  var DOT = '·', DASH = '—';
  var NUM = { THREE: 'سه', FOUR: 'چهار', FIVE: 'پنج', SIX: 'شش', SEVEN: 'هفت', EIGHT: 'هشت' };

  var RAW = {
    // title and cards
    'something has rebuilt your home from what you remember of it': 'یه چیزی خونه‌ات رو از روی چیزی که ازش یادت مونده دوباره ساخته.',
    ['W A S D ' + DASH + ' walk ' + DOT + ' mouse ' + DASH + ' look ' + DOT + ' E ' + DASH + ' use']: 'راه رفتن: W A S D  ' + DOT + '  نگاه: ماوس  ' + DOT + '  استفاده: E',
    ['hold SPACE ' + DASH + ' close your eyes']: 'برای بستن چشم‌ها SPACE رو نگه دار',
    'headphones recommended': 'با هدفون بازی کن',
    ['hold SPACE ' + DASH + ' close your eyes ' + DOT + ' nod or shake the mouse to answer (or Y / N)']:
      'برای بستن چشم‌ها SPACE رو نگه دار  ' + DOT + '  برای جواب دادن ماوس رو بالا و پایین یا چپ و راست بکش (یا Y / N)',
    'loading': 'در حال بارگذاری',
    'click to come in': 'برای ورود کلیک کن',
    'click to open your eyes': 'برای باز کردن چشم‌هات کلیک کن',
    ['Persian edition and PLAYCHIVE port by Mahan Kenway ' + DOT + ' Original game: Misremember (used with the author\'s permission)']:
      'نسخهٔ فارسی و پورت PLAYCHIVE: Mahan Kenway  ' + DOT + '  بازی اصلی: Misremember (با اجازهٔ سازنده)',

    // end cards
    'END OF THE SECOND EVENING': 'پایان عصر دوم',
    'Three places were laid tonight. There were only ever three.': 'امشب سه جا چیده شد. از اول هم فقط سه تا بود.',
    'The table is still being counted.': 'میز هنوز شمرده می‌شه.',
    ['Evening three ' + DASH + ' OUTSIDE ' + DASH + ' has not been remembered yet.']: 'عصر سوم، بیرون، هنوز به یاد آورده نشده.',
    'EVENING TWO': 'عصر دوم',
    'count': 'بشمر',
    'The kitchen held still last night.': 'آشپزخونه دیشب سر جاش موند.',
    'You fell asleep holding the watch.': 'ساعت تو دستت بود که خوابت برد.',
    'The kitchen was still wrong when you slept.': 'وقتی خوابیدی، آشپزخونه هنوز غلط بود.',

    // say lines
    ['A wristwatch. It is still running ' + DASH + ' and it is right.']: 'یه ساعت مچی. هنوز کار می‌کنه و درست نشون می‌ده.',
    'Not yet. The table is waiting to be counted.': 'هنوز نه. میز منتظره که بشمریش.',
    'Not yet. Something is waiting in the kitchen.': 'هنوز نه. یه چیزی تو آشپزخونه منتظره.',
    'Three napkin rings. One each.': 'سه تا حلقهٔ دستمال‌سفره. برای هر نفر یکی.',

    // notes (paper notes in the house)
    'WELCOME HOME\n(home?)': 'خوش اومدی خونه\n(خونه؟)',
    'DINNER.\nYOU LIKE THIS.\n(yes?)': 'شام.\nاینو دوست داری.\n(آره؟)',
    'GOOD.\nI THOUGHT SO.\nEAT.': 'خوبه.\nفکر می‌کردم.\nبخور.',
    'SORRY.\nIS THIS IT?': 'ببخشید.\nهمینه؟',
    'IT IS WHAT YOU LIKE.\nEAT.': 'همینه که دوست داری.\nبخور.',
    'YOU MUST BE TIRED.\nYOUR ROOM IS\nACROSS THE HALL.': 'حتماً خسته‌ای.\nاتاقت اونور\nراهروئه.',
    'IT IS BEHIND YOU.\n(it always was)': 'پشت سرته.\n(همیشه بود)',
    'BED. YOURS.\nSLEEP WHEN YOU\nARE READY.': 'تخت. مال تو.\nهر وقت آماده‌ای\nبخواب.',
    'NOTHING HERE.\nPLEASE KEEP\nYOUR EYES OPEN.': 'اینجا هیچی نیست.\nلطفاً چشم‌هات رو\nباز نگه دار.',
    'I DID NOT MAKE THIS.\nIT WAS ALREADY TRUE.': 'من اینو نساختم.\nاز همون اول راست بود.',
    'OH.\nTHAT IS RIGHT.\nTHANK YOU.': 'آها.\nدرسته.\nمرسی.',
    'NOT YET.\nI AM STILL\nREMEMBERING THIS ONE.': 'هنوز نه.\nهنوز دارم این یکی رو\nبه یاد می‌آرم.',
    'GOOD EVENING.\n(it is always evening)': 'عصر بخیر.\n(همیشه عصره)',
    'I COUNTED AGAIN.\nTHERE WERE\nMORE DOORS.': 'دوباره شمردم.\nدرها بیشتر بودن.',
    'PANTRY.\nIT IS BEHIND YOU.\nIT IS ALWAYS\nBEHIND YOU.': 'انباری.\nپشت سرته.\nهمیشه\nپشت سرته.',
    'THREE.\nI DID NOT\nMAKE THESE.': 'سه تا.\nاینا رو من\nنساختم.',
    'THEN I MADE HER.\nYOU LOOKED\nLONELY IN IT.': 'پس اون رو ساختم.\nتوی عکس\nتنها به نظر می‌اومدی.',
    'GOOD.\nI WILL SET IT.': 'خوبه.\nمی‌چینمش.',
    'NO?\nI WILL COUNT AGAIN.': 'نه؟\nدوباره می‌شمرم.',
    'THREE.\nONLY THREE.': 'سه.\nفقط سه.',
    'THREE?': 'سه؟',

    // prompt labels
    'open': 'باز کن', 'eat': 'بخور', 'sleep': 'بخواب',
    'put the watch down': 'ساعت رو بذار زمین',
    'put the rings down': 'حلقه‌ها رو بذار زمین',
    'take the rings': 'حلقه‌ها رو بردار',
    'take the watch': 'ساعت رو بردار',
    ['nod ' + DASH + ' yes ' + DOT + ' shake ' + DASH + ' no']: 'ماوس بالا و پایین: آره  ' + DOT + '  ماوس چپ و راست: نه'
  };

  function norm(s) { return String(s).replace(/ |&nbsp;/g, ' ').replace(/\s*\n\s*/g, '\n').replace(/[ \t]+/g, ' ').trim(); }
  function flat(s) { return norm(s).replace(/\n/g, ' '); }
  var DICT = {};      // exact, with line breaks
  var FLAT = {};      // same keys with line breaks flattened (say lines, observer)
  Object.keys(RAW).forEach(function (k) { DICT[norm(k)] = RAW[k]; FLAT[flat(k)] = RAW[k].replace(/\n/g, ' '); });

  var RULES = [
    [/^HOW MANY WERE WE\?\n([A-Z]+)\? \(yes\?\)$/, function (m) { return 'چند نفر بودیم؟\n' + (NUM[m[1]] || m[1]) + '؟ (آره؟)'; }],
    [/^I COUNT ([A-Z]+)\.\n\1\? \(yes\?\)$/, function (m) { return 'من می‌شمرم: ' + (NUM[m[1]] || m[1]) + '.\n' + (NUM[m[1]] || m[1]) + '؟ (آره؟)'; }]
  ];

  function translate(text) {
    if (typeof text !== 'string' || !text) return text;
    var n = norm(text);
    if (!n) return text;
    if (Object.prototype.hasOwnProperty.call(DICT, n)) return DICT[n];
    if (Object.prototype.hasOwnProperty.call(FLAT, n)) return FLAT[n];
    for (var i = 0; i < RULES.length; i++) { var m = RULES[i][0].exec(n); if (m) return RULES[i][1](m); }
    return text;
  }
  // prompt innerHTML: "<b>E</b>label" or the nod/shake string (with &nbsp;)
  function translatePrompt(html) {
    if (typeof html !== 'string') return html;
    var m = /^<b>E<\/b>([\s\S]*)$/.exec(html);
    if (m) return '<b>E</b>' + translate(m[1]);
    return translate(html);
  }

  var api = { translate: translate, translatePrompt: translatePrompt, DICT: DICT, lang: 'en' };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (!root.document) return;

  function currentLang() {
    try { var q = new URLSearchParams(root.location.search).get('lang'); if (q === 'fa' || q === 'en') return q; } catch (e) { /* ignore */ }
    try { return root.localStorage.getItem('playchive:lang') === 'fa' ? 'fa' : 'en'; } catch (e) { return 'en'; }
  }
  api.lang = currentLang();
  root.slLang = api.lang;
  root.slT = function (s) { return api.lang === 'fa' ? translate(s) : s; };
  root.slP = function (s) { return api.lang === 'fa' ? translatePrompt(s) : s; };
  if (api.lang !== 'fa') return;

  var doc = root.document;
  doc.documentElement.classList.add('fa');
  doc.documentElement.lang = 'fa';
  // the in-world notes are painted on canvas textures, so the font must be ready first
  try { doc.fonts.load('600 40px "SL Persian"'); doc.fonts.load('400 16px "SL Persian"'); } catch (e) { /* ignore */ }

  var ARABIC = /[؀-ۿ]/, busy = false;
  function fixNode(node) {
    if (node.nodeType === 3) {
      var t = translate(node.nodeValue);
      if (t !== node.nodeValue) {
        node.nodeValue = t;
        var p = node.parentElement;
        if (p && !p.hasAttribute('dir') && ARABIC.test(t)) p.setAttribute('dir', 'auto');
      }
      return;
    }
    if (node.nodeType !== 1) return;
    var kids = node.childNodes;
    for (var k = 0; k < kids.length; k++) fixNode(kids[k]);
  }
  function observe() {
    var ids = ['title', 'hint', 'pause', 'end'], mo = new MutationObserver(function (list) {
      if (busy) return; busy = true;
      try {
        for (var i = 0; i < list.length; i++) {
          var r = list[i];
          if (r.type === 'characterData') fixNode(r.target);
          else for (var j = 0; j < r.addedNodes.length; j++) fixNode(r.addedNodes[j]);
        }
      } finally { busy = false; }
    });
    ids.forEach(function (id) {
      var el = doc.getElementById(id); if (!el) return;
      fixNode(el); mo.observe(el, { subtree: true, childList: true, characterData: true });
    });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', observe); else observe();
})(typeof window !== 'undefined' ? window : globalThis);
