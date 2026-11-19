/*
 * Emberhold (烬堡), English and Persian layer for PLAYCHIVE.
 * The original game is Chinese only. This file translates its visible text:
 *   - static and JS-set DOM text through a MutationObserver (HUD, menus, prompts),
 *   - text painted onto the floor runes (canvas) and the title markup through the
 *     small hooks slT / slH that index.html calls.
 * Language: ?lang=en|fa|zh, else localStorage "playchive:lang" (fa), else English.
 * ?lang=zh keeps the original Chinese untouched.
 * Persian edition and PLAYCHIVE port by Mahan Kenway. See LICENSE.txt.
 */
(function (root) {
  'use strict';

  var DOT = '·';
  var FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
  function faDigits(s) { return String(s).replace(/\d/g, function (d) { return FA_DIGITS[d]; }); }

  // zh : [en, fa]
  var D = {
    // loading lines
    '正在砌石': ['Laying the stones', 'سنگ‌ها رو می‌چینم'],
    '正在铺地': ['Paving the floor', 'کف رو سنگ‌فرش می‌کنم'],
    '正在锻铁': ['Forging iron', 'آهن رو می‌کوبم'],
    '正在搭关卡': ['Building the level', 'مرحله رو می‌سازم'],
    '正在铸甲': ['Casting armor', 'زره می‌ریزم'],
    '正在点灯': ['Lighting the lamps', 'چراغ‌ها رو روشن می‌کنم'],

    // menu
    '开始': ['Begin', 'شروع'],
    '继续': ['Resume', 'ادامه'],
    '再来一次': ['Play again', 'دوباره'],
    '移动': ['Move', 'حرکت'],
    '视角': ['Look', 'دید'],
    '轻击': ['Light attack', 'ضربهٔ سبک'],
    '重击': ['Heavy attack', 'ضربهٔ سنگین'],
    '翻滚': ['Roll', 'غلت'],
    '奔跑': ['Sprint', 'دویدن'],
    '锁定': ['Lock on', 'قفل هدف'],
    '余烬瓶': ['Flask', 'بطری'],
    '互动': ['Interact', 'تعامل'],
    '画质': ['Quality', 'کیفیت'],
    '震动': ['Shake', 'لرزش'],
    '静音': ['Mute', 'بی‌صدا'],
    '暂停': ['Pause', 'توقف'],
    '鼠标': ['Mouse', 'ماوس'],
    '左键': ['L-Click', 'چپ‌کلیک'],
    '右键': ['R-Click', 'راست‌کلیک'],
    '空格': ['Space', 'Space'],
    '守门者已陨 · 前路未开': ['The Gatekeeper has fallen · the road ahead is still sealed', 'نگهبان دروازه افتاد · راه جلو هنوز بسته‌ست'],
    '波斯语版与 PLAYCHIVE 移植：Mahan Kenway · 原作：烬堡（经作者许可发布）': [
      'Persian edition and PLAYCHIVE port by Mahan Kenway ' + DOT + ' Original game: Emberhold (used with the author’s permission)',
      'نسخهٔ فارسی و پورت PLAYCHIVE: Mahan Kenway ' + DOT + ' بازی اصلی: Emberhold (با اجازهٔ سازنده)'
    ],

    // HUD
    '余烬瓶 R': ['Flask R', 'بطری R'],
    '灰烬': ['Ash', 'خاکستر'],
    '灯火旁': ['At the Flame', 'کنار شعله'],
    '体魄': ['Vigor', 'بنیه'],
    '耐力': ['Endurance', 'استقامت'],
    '力量': ['Strength', 'قدرت'],
    '按': ['Press', ''],
    '起身': ['to stand up', 'رو بزن تا بلند شی'],

    // zones
    '无名囚室': ['The Nameless Cell', 'سلول بی‌نام'],
    '石柱厅': ['Hall of Pillars', 'تالار ستون‌ها'],
    '旧军械库': ['The Old Armory', 'اسلحه‌خانهٔ کهنه'],
    '长阶': ['The Long Stair', 'پلکان بلند'],
    '门前': ['Before the Gate', 'پیش از دروازه'],
    '灰冕之间': ['Ashen Crown Hall', 'تالار تاج خاکستری'],
    '守门者 · 灰冕': ['Gatekeeper ' + DOT + ' Ashen Crown', 'دروازه‌بان ' + DOT + ' تاج خاکستری'],

    // floor runes (canvas)
    '移 动': ['Move', 'حرکت'],
    'W A S D  ·  鼠标转动视角': ['W A S D  ' + DOT + '  Mouse to look', 'W A S D  ' + DOT + '  ماوس برای دید'],
    '挥 剑': ['Strike', 'ضربه'],
    '左键 轻击  ·  右键 重击': ['Left click: light  ' + DOT + '  Right click: heavy', 'چپ‌کلیک: سبک  ' + DOT + '  راست‌کلیک: سنگین'],
    '翻 滚': ['Roll', 'غلت'],
    '空格 翻滚躲避  ·  Shift 奔跑': ['Space: dodge roll  ' + DOT + '  Shift: sprint', 'Space: غلت  ' + DOT + '  Shift: دویدن'],
    '锁 定': ['Lock on', 'قفل هدف'],
    'Q 盯住敌人  ·  R 喝余烬瓶': ['Q: lock on  ' + DOT + '  R: drink flask', 'Q: قفل روی دشمن  ' + DOT + '  R: نوشیدن بطری'],
    '雾 门': ['Fog Gate', 'دروازهٔ مه'],
    '守门者在门后  ·  E 穿过': ['The Gatekeeper waits beyond  ' + DOT + '  E: enter', 'نگهبان پشت دروازه‌ست  ' + DOT + '  E: عبور'],

    // prompts and messages
    '在灯火旁休息': ['Rest at the flame', 'کنار شعله استراحت کن'],
    '点燃灯火': ['Light the flame', 'شعله رو روشن کن'],
    '穿过雾门': ['Pass through the fog gate', 'از دروازهٔ مه رد شو'],
    '拾取 瓶之碎片': ['Pick up Flask Shard', 'تکهٔ بطری رو بردار'],
    '点一下画面，抓住鼠标': ['Click the screen to capture the mouse', 'روی صفحه کلیک کن تا ماوس قفل بشه'],
    '灯火已燃': ['Flame Lit', 'شعله روشن شد'],
    '瓶之碎片': ['Flask Shard', 'تکهٔ بطری'],
    '余烬瓶可用次数 +1': ['Flask charges +1', 'تعداد دفعات بطری +۱'],
    '灰烬已取回': ['Ash Recovered', 'خاکستر پس گرفته شد'],
    '余烬熄灭': ['The Ember Fades', 'اخگر خاموش شد'],
    '守门者已陨': ['The Gatekeeper Has Fallen', 'نگهبان دروازه افتاد'],
    '灰冕之间重归寂静': ['Silence returns to the Ashen Crown Hall', 'سکوت دوباره به تالار تاج خاکستری برگشت'],
    '大厅中央出现了一处灯火': ['A flame has appeared at the center of the hall', 'وسط تالار یه شعله پیدا شد'],
    '余烬瓶空了': ['The flask is empty', 'بطری خالیه'],
    '灰烬不够': ['Not enough ash', 'خاکستر کافی نیست'],
    '已静音': ['Muted', 'صدا قطع شد'],
    '声音开': ['Sound on', 'صدا روشن شد'],
    '换成光刃': ['Switched to the light blade', 'تیغ نوری برداشتی'],
    '换回长剑': ['Back to the longsword', 'دوباره شمشیر بلند'],
    '作弊已开': ['Cheat On', 'تقلب روشن شد'],
    '作弊已关': ['Cheat Off', 'تقلب خاموش شد'],
    '光刃 · 伤害加倍 · 破盾 · F 换回长剑 · C 换颜色': [
      'Light blade ' + DOT + ' double damage ' + DOT + ' breaks shields ' + DOT + ' F: back to sword ' + DOT + ' C: change color',
      'تیغ نوری ' + DOT + ' آسیب دو برابر ' + DOT + ' شکستن سپر ' + DOT + ' F: برگشت به شمشیر ' + DOT + ' C: عوض کردن رنگ'
    ],

    // quality and shake labels (used inside rules)
    '极致': ['Ultra', 'فوق‌العاده'],
    '高': ['High', 'بالا'],
    '流畅': ['Smooth', 'روان'],
    '关': ['Off', 'خاموش'],
    '弱': ['Weak', 'ضعیف'],
    '强（带色散）': ['Strong (chromatic)', 'قوی (با پراکندگی رنگ)'],
    '蓝': ['Blue', 'آبی'],
    '绿': ['Green', 'سبز'],
    '红': ['Red', 'قرمز'],
    '紫': ['Purple', 'بنفش'],
    '灯芯': ['Wick', 'فتیله']
  };

  // Titles that contain markup (innerHTML).
  var H = {
    '烬<span>堡</span>': ['EMBER<span>HOLD</span>', 'دژ <span>اخگر</span>'],
    '暂 <span>停</span>': ['PAUS<span>ED</span>', 'توقف'],
    '第一关 <span>完</span>': ['LEVEL 1 <span>CLEAR</span>', 'مرحلهٔ ۱ <span>تمام شد</span>']
  };

  var lang = 'en';
  function detect() {
    try {
      var q = new URLSearchParams(root.location.search).get('lang');
      if (q === 'fa' || q === 'en' || q === 'zh') return q;
    } catch (e) { /* ignore */ }
    try { return root.localStorage.getItem('playchive:lang') === 'fa' ? 'fa' : 'en'; } catch (e) { return 'en'; }
  }
  function pick(v) { return lang === 'fa' ? v[1] : v[0]; }
  function num(n) { return lang === 'fa' ? faDigits(n) : String(n); }
  function label(zh) { return D[zh] ? pick(D[zh]) : zh; }

  var RULES = [
    [/^EMBERHOLD\s*·\s*第一关 无名囚室$/, function () {
      return lang === 'fa' ? 'EMBERHOLD ' + DOT + ' مرحلهٔ ۱: سلول بی‌نام' : 'EMBERHOLD ' + DOT + ' Level 1: The Nameless Cell';
    }],
    [/^画质 · (.+)$/, function (m) { return (lang === 'fa' ? 'کیفیت ' : 'Quality ') + DOT + ' ' + label(m[1]); }],
    [/^画质 (\S+?)(?:\s+·\s+(\d+)%)?$/, function (m) {
      return (lang === 'fa' ? 'کیفیت ' : 'Quality ') + label(m[1]) + (m[2] ? '  ' + DOT + '  ' + num(m[2]) + '%' : '');
    }],
    [/^打击震动 · (.+)$/, function (m) { return (lang === 'fa' ? 'لرزش ضربه ' : 'Hit shake ') + DOT + ' ' + label(m[1]); }],
    [/^光刃 · (蓝|绿|红|紫)$/, function (m) { return (lang === 'fa' ? 'تیغ نوری ' : 'Light blade ') + DOT + ' ' + label(m[1]); }],
    [/^灰烬 \+(\d+)$/, function (m) { return (lang === 'fa' ? 'خاکستر ' : 'Ash ') + '+' + num(m[1]); }],
    [/^持有灰烬 (\d+)　·　升一级要 (\d+)$/, function (m) {
      return lang === 'fa'
        ? 'خاکستر داری: ' + num(m[1]) + '  ' + DOT + '  هزینهٔ ارتقا: ' + num(m[2])
        : 'Ash held: ' + m[1] + '  ' + DOT + '  Cost to level up: ' + m[2];
    }],
    [/^Lv (\d+)　(生命|耐力) (\d+) → (\d+)$/, function (m) {
      var n = { '生命': ['Health', 'جان'], '耐力': ['Stamina', 'توان'] }[m[2]];
      return lang === 'fa'
        ? 'سطح ' + num(m[1]) + '  ' + n[1] + ' ' + num(m[3]) + ' ← ' + num(m[4])
        : 'Lv ' + m[1] + '  ' + n[0] + ' ' + m[3] + ' → ' + m[4];
    }],
    [/^Lv (\d+)　伤害 \+(\d+)% → \+(\d+)%$/, function (m) {
      return lang === 'fa'
        ? 'سطح ' + num(m[1]) + '  آسیب ' + num(m[2]) + '٪+ ← ' + num(m[3]) + '٪+'
        : 'Lv ' + m[1] + '  Damage +' + m[2] + '% → +' + m[3] + '%';
    }],
    [/^用时　(\S+)\n阵亡　(\d+) 次　　　击倒　(\d+)$/, function (m) {
      return lang === 'fa'
        ? 'زمان  ' + faDigits(m[1]) + '\nمرگ  ' + num(m[2]) + '   کشته‌ها  ' + num(m[3])
        : 'Time  ' + m[1] + '\nDeaths  ' + m[2] + '   Kills  ' + m[3];
    }]
  ];

  var numericOnly = /^[\s\d\/%.:+\-]*$/;
  var CJK = /[一-鿿]/;
  var has = Object.prototype.hasOwnProperty;

  function translate(text) {
    if (typeof text !== 'string' || lang === 'zh' || !CJK.test(text)) return text;
    var norm = text.replace(/ /g, ' ');
    var trimmed = norm.trim();
    if (!trimmed || numericOnly.test(trimmed)) return text;
    var out = null;
    if (has.call(D, trimmed)) out = pick(D[trimmed]);
    else {
      for (var i = 0; i < RULES.length; i++) {
        var m = RULES[i][0].exec(trimmed);
        if (m) { out = RULES[i][1](m); break; }
      }
    }
    if (out == null) return text;
    var at = norm.indexOf(trimmed);
    return norm.slice(0, at) + out + norm.slice(at + trimmed.length);
  }

  var api = { translate: translate, D: D, H: H, RULES: RULES, setLang: function (l) { lang = l; }, faDigits: faDigits };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (!root.document) return;

  lang = detect();
  root.slLang = lang;
  root.slT = function (s) { return translate(s); };
  root.slH = function (h) { return lang !== 'zh' && has.call(H, h) ? pick(H[h]) : h; };
  root.slDir = lang === 'fa' ? 'rtl' : 'ltr';
  root.slFont = lang === 'fa'
    ? '"SL Persian Head","SL Persian",Georgia,"Times New Roman",serif'
    : lang === 'en' ? 'Georgia,"Times New Roman",serif' : null;

  var doc = root.document;
  var htmlEl = doc.documentElement;
  htmlEl.classList.add(lang);
  htmlEl.lang = lang === 'zh' ? 'zh-CN' : lang;
  if (lang === 'zh') { root.slReady = Promise.resolve(); return; }

  // Fonts must be ready before the rune textures are painted at boot.
  if (lang === 'fa' && doc.fonts && doc.fonts.load) {
    root.slReady = Promise.race([
      Promise.all([
        doc.fonts.load('600 62px "SL Persian Head"', 'آب'),
        doc.fonts.load('400 40px "SL Persian Head"', 'آب'),
        doc.fonts.load('400 16px "SL Persian"', 'آب')
      ]),
      new Promise(function (r) { setTimeout(r, 4000); })
    ]);
  } else root.slReady = Promise.resolve();

  doc.title = lang === 'fa' ? 'دژ اخگر (Emberhold)' : 'Emberhold';

  var busy = false;
  function fix(node) {
    if (node.nodeType === 3) {
      var t = translate(node.nodeValue);
      if (t !== node.nodeValue) node.nodeValue = t;
      return;
    }
    if (node.nodeType !== 1) return;
    var k = node.childNodes;
    for (var i = 0; i < k.length; i++) fix(k[i]);
  }
  var mo = new MutationObserver(function (list) {
    if (busy) return;
    busy = true;
    try {
      for (var i = 0; i < list.length; i++) {
        var r = list[i];
        if (r.type === 'characterData') fix(r.target);
        else for (var j = 0; j < r.addedNodes.length; j++) fix(r.addedNodes[j]);
      }
    } finally { busy = false; }
  });
  mo.observe(htmlEl, { subtree: true, childList: true, characterData: true });

  function initTitle() {
    var mt = doc.getElementById('mt');
    if (mt) mt.innerHTML = root.slH('烬<span>堡</span>');
    var cr = doc.getElementById('credit');
    if (cr) cr.textContent = lang === 'fa'
      ? 'نسخهٔ فارسی و پورت PLAYCHIVE: Mahan Kenway ' + DOT + ' بازی اصلی: Emberhold (با اجازهٔ سازنده)'
      : 'Persian edition and PLAYCHIVE port by Mahan Kenway ' + DOT + ' Original game: Emberhold (used with the author\'s permission)';
    fix(doc.body);
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', initTitle); else initTitle();
})(typeof window !== 'undefined' ? window : globalThis);
