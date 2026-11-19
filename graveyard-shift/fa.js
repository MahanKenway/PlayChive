/*
 * Graveyard Shift, Persian edition layer (PLAYCHIVE).
 * Follows the language saved by PLAYCHIVE ("playchive:lang"), or ?lang=fa / ?lang=en.
 * English stays the default. This file translates exact UI strings (menus, loading tips,
 * objectives, info panel, end screen) through a MutationObserver. Weapon, perk and
 * enemy names stay in English on purpose. Written by Mahan Kenway for PLAYCHIVE.
 * Not translated yet: the short in-game hint lines that mix text and key icons.
 */
(function (root) {
  'use strict';
  var DOT = '·';
  var DICT = {
    // menus
    'Clock in': 'شروع شیفت',
    'Back on shift': 'برگشت به شیفت',
    'Clocked out': 'شیفت تموم شد',
    'On break': 'استراحت',
    'Back office': 'دفتر پشتی',
    'Main menu': 'منوی اصلی',
    'Pause menu': 'منوی توقف',
    'Shift over': 'شیفت تموم شد',
    'Shift paused': 'شیفت متوقف شد',
    'End of shift': 'پایان شیفت',
    'House rules': 'قانون‌های خونه',
    ['Picture ' + DOT + ' Controls ' + DOT + ' Sound']: 'تصویر ' + DOT + ' کنترل‌ها ' + DOT + ' صدا',
    ['Nightjar truck stop ' + DOT + ' Open all night']: 'پمپ‌بنزین Nightjar ' + DOT + ' تمام شب بازه',
    'One truck stop, ten guns, and a night that does not end.': 'یه ایستگاه کامیون، ده تا اسلحه و شبی که تموم نمی‌شه.',
    'Aim assist': 'کمک نشانه‌گیری',
    'Auto-fire assist': 'شلیک خودکار',
    'Shoots when the crosshair is on one': 'وقتی نشانه روی زامبی باشه شلیک می‌کنه',
    'Drag sensitivity': 'حساسیت کشیدن',
    'Field of view': 'میدان دید',
    'Full screen': 'تمام‌صفحه',
    'Hides the browser bars': 'نوار مرورگر رو مخفی می‌کنه',
    'Low, Medium and High may run slowly on phones.': 'کم، متوسط و زیاد ممکنه روی گوشی کند باشه.',
    'Dismiss hint': 'بستن راهنما',
    'Dismiss (H)': 'بستن (H)',
    'H to hide': 'H برای مخفی کردن',
    'Show hints again': 'نمایش دوبارهٔ راهنماها',
    'Report a problem': 'گزارش مشکل',
    'Round-based survival at the last stop on the highway': 'بقا راند به راند توی آخرین ایستگاه بزرگراه',
    'Tip': 'نکته',
    'Source on GitHub': 'کد منبع روی GitHub',
    'Persian edition and PLAYCHIVE port by Mahan Kenway': 'نسخهٔ فارسی و پورت PLAYCHIVE: Mahan Kenway',
    'Built by Fable 5.2, prompted by': 'ساخته‌شده با Fable 5.2، به درخواست',
    'Post text': 'متن پست',
    'Select and copy': 'انتخاب و کپی',
    'Turn your phone sideways for a bigger view': 'گوشی رو بچرخون تا صفحه بزرگ‌تر بشه',
    'Fire: hold to keep shooting': 'شلیک: نگه دار تا ادامه بده',
    'Fire: tap to shoot': 'شلیک: لمس کن',

    // end screen
    'Best round': 'بهترین راند',
    'Round reached': 'راند رسیده',
    'Points earned': 'امتیاز گرفته‌شده',
    'Points spent': 'امتیاز خرج‌شده',
    'Doors opened': 'درهای بازشده',
    'New best': 'رکورد جدید',
    'save your stats': 'ذخیرهٔ آمار',

    // objectives
    'Bring down the brute': 'غول رو بندازش',
    'Find the last one': 'آخری رو پیدا کن',
    'Find the power switch in the garage': 'کلید برق رو توی گاراژ پیدا کن',
    'Out of ammo: buy at the wall': 'فشنگ تموم شد: از دیوار بخر',
    'Press R to reload': 'R برای پر کردن خشاب',
    'Tap RELOAD': 'RELOAD رو بزن',

    // info panel
    'Wall weapons': 'اسلحه‌های دیوار',
    'Machine guns': 'مسلسل‌ها',
    'Ammo crate': 'جعبهٔ مهمات',
    'Fire rate': 'سرعت شلیک',
    'Rare find': 'پیدایش نادر',
    'Running past': 'دویدن از کنارشون',
    'Through the line': 'عبور از صف',
    'Power-up drops': 'دراپ پاورآپ',
    'Buy a gun from the wall. Stand at one you own to buy its ammo, which costs less.': 'اسلحه رو از دیوار بخر. کنار اسلحه‌ای که داری بایستی مهماتش رو ارزون‌تر می‌خری.',
    'Your starting gun. Light and accurate.': 'اسلحهٔ اولت. سبک و دقیق.',
    'A shotgun that fires fast. Burns through shells.': 'یه شاتگان تندشلیک که فشنگ رو آب می‌کنه.',
    'Fast and easy to hold on target. Strong up close.': 'تندشلیک و آسون برای نشانه‌گیری. از نزدیک قویه.',
    'Full auto with reach and a steady aim.': 'تمام‌اتوماتیک با برد و نشانهٔ ثابت.',
    'Lobbed. Bursts into a fire that burns zombies standing in it.': 'پرتابی. منفجر می‌شه و آتیشی می‌سازه که زامبی‌های توش رو می‌سوزونه.',
    'One shot at a time, each one heavy. Long range.': 'هر بار یه تیر، هر کدوم سنگین. بُرد بلند.',
    'Six heavy shots. Slow to fire, slow to reload.': 'شش تیر سنگین. شلیکش کنده، پر کردنش هم.',
    'Wide blast, brutal up close, weak at range. Reloads one shell at a time.': 'انفجار پهن، از نزدیک وحشتناک، از دور ضعیف. فشنگ‌ها یکی‌یکی پر می‌شن.',
    'Bullets pass through zombies standing in a line, weaker each time. Only the first one pays': 'گلوله از زامبی‌های توی صف رد می‌شه و هر بار ضعیف‌تر می‌شه. فقط برای اولی امتیاز می‌گیری',
    'Kills sometimes drop a power-up. Walk over it before it fades.': 'گاهی کشتن زامبی یه پاورآپ می‌ندازه. قبل از محو شدنش ازش رد شو.',
    'Zombies can hit you as you run past them.': 'زامبی‌ها وقتی ازشون رد می‌شی می‌تونن بزننت.',
    'Find the power switch and turn it on. It is free. Perks and the upgrade bench do nothing without it': 'کلید برق رو پیدا کن و روشنش کن. مجانیه. بدون برق، پرک‌ها و میز ارتقا کار نمی‌کنن',

    // loading tips
    'Armour plates take the damage before your health does. You can wear three.': 'صفحه‌های زره قبل از جونت ضربه می‌گیرن. می‌تونی سه تا بپوشی.',
    'Every hit pays 10 points, a kill 60, a headshot kill 100. Aim for the head.': 'هر ضربه ۱۰ امتیاز می‌ده، هر کشتن ۶۰ و کشتن با شلیک به سر ۱۰۰. سر رو نشونه بگیر.',
    'Hold F at a broken window to nail the boards back: 10 points a board, up to 200 a round.': 'پشت پنجرهٔ شکسته F رو نگه دار تا تخته‌ها رو دوباره بکوبی: هر تخته ۱۰ امتیاز، تا ۲۰۰ توی هر راند.',
    'Hold F to search a car or a crate. Each one can be searched once.': 'برای گشتن ماشین یا جعبه F رو نگه دار. هر کدوم رو فقط یک بار می‌شه گشت.',
    'Hold REPAIR at a broken window to nail the boards back: 10 points a board, up to 200 a round.': 'پشت پنجرهٔ شکسته REPAIR رو نگه دار تا تخته‌ها رو دوباره بکوبی: هر تخته ۱۰ امتیاز، تا ۲۰۰ توی هر راند.',
    'Hold SEARCH at a car or a crate. Each one can be searched once.': 'کنار ماشین یا جعبه SEARCH رو نگه دار. هر کدوم رو فقط یک بار می‌شه گشت.',
    'Hold Shift to sprint, but you can’t shoot while you’re sprinting.': 'برای دویدن Shift رو نگه دار، ولی موقع دویدن نمی‌شه شلیک کرد.',
    'Hold Shift to sprint, but you can\'t shoot while you\'re sprinting.': 'برای دویدن Shift رو نگه دار، ولی موقع دویدن نمی‌شه شلیک کرد.',
    'Knife kills pay 130. When one gets close, press V.': 'کشتن با چاقو ۱۳۰ امتیاز می‌ده. وقتی یکی نزدیک شد V رو بزن.',
    'Knife kills pay 130. When one gets close, tap the knife.': 'کشتن با چاقو ۱۳۰ امتیاز می‌ده. وقتی یکی نزدیک شد چاقو رو لمس کن.',
    'Power-ups glow on the ground for 25 seconds. Walk over one to take it.': 'پاورآپ‌ها ۲۵ ثانیه روی زمین می‌درخشن. از روشون رد شو تا برشون داری.',
    'Push the stick all the way to sprint, but you can’t shoot while you’re sprinting.': 'استیک رو تا ته فشار بده تا بدوی، ولی موقع دویدن نمی‌شه شلیک کرد.',
    'Push the stick all the way to sprint, but you can\'t shoot while you\'re sprinting.': 'استیک رو تا ته فشار بده تا بدوی، ولی موقع دویدن نمی‌شه شلیک کرد.',
    'The power switch is in the garage. The machines and the upgrade bench do nothing until it is on.': 'کلید برق توی گاراژه. تا روشنش نکنی ماشین‌ها و میز ارتقا کار نمی‌کنن.',
    'The weapon box is 950 for a random gun. Take it within 10 seconds or it is gone.': 'جعبهٔ اسلحه ۹۵۰ امتیازه و یه اسلحهٔ تصادفی می‌ده. ظرف ۱۰ ثانیه برش دار وگرنه می‌پره.',
    'With the power on, the upgrade bench makes any gun stronger for 4000.': 'وقتی برق روشنه، میز ارتقا هر اسلحه‌ای رو با ۴۰۰۰ امتیاز قوی‌تر می‌کنه.',

    // found / panels
    'Found something': 'یه چیزی پیدا کردی',
    'Left behind': 'جا موند',
    'Nothing here': 'اینجا چیزی نیست',
    'Power-up lost': 'پاورآپ از دست رفت',
    'The offer ran out': 'پیشنهاد تموم شد',
    'Already have it': 'از قبل داری',
    'Ammo full': 'مهمات پره',
    'Needs power': 'برق می‌خواد',
    'Not enough points': 'امتیاز کافی نیست',
    'Wait a moment': 'یه لحظه صبر کن',
    'Use / buy': 'استفاده / خرید',
    'Swap gun': 'عوض کردن اسلحه'
  };
  var RULES = [
    [/^Round (\d+) · (\d+) points$/, function (m) { return 'راند ' + fd(m[1]) + ' ' + DOT + ' ' + fd(m[2]) + ' امتیاز'; }],
    [/^Round (\d+)$/, function (m) { return 'راند ' + fd(m[1]); }]
  ];
  var DIG = '۰۱۲۳۴۵۶۷۸۹';
  function fd(s) { return String(s).replace(/\d/g, function (d) { return DIG[d]; }); }
  var has = Object.prototype.hasOwnProperty;
  var numericOnly = /^[\s\d\/%.:+\-]*$/;

  function translate(text) {
    if (typeof text !== 'string' || !text) return text;
    var t = text.trim().replace(/’/g, '’');
    if (!t || numericOnly.test(t)) return text;
    var out = has.call(DICT, t) ? DICT[t] : null;
    if (out == null) for (var i = 0; i < RULES.length; i++) { var m = RULES[i][0].exec(t); if (m) { out = RULES[i][1](m); break; } }
    if (out == null) return text;
    var at = text.indexOf(t);
    return text.slice(0, at) + out + text.slice(at + t.length);
  }

  var api = { translate: translate, DICT: DICT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (!root.document) return;
  var lang = 'en';
  try {
    var q = new URLSearchParams(root.location.search).get('lang');
    lang = q === 'fa' || q === 'en' ? q : (root.localStorage.getItem('playchive:lang') === 'fa' ? 'fa' : 'en');
  } catch (e) { /* ignore */ }
  root.gsLang = lang;
  if (lang !== 'fa') return;
  var doc = root.document, htmlEl = doc.documentElement;
  htmlEl.classList.add('fa'); htmlEl.lang = 'fa';
  var ARABIC = /[؀-ۿ]/, busy = false;
  function fix(node) {
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
    ['aria-label', 'title', 'placeholder'].forEach(function (a) {
      var v = node.getAttribute(a);
      if (v) { var tv = translate(v); if (tv !== v) node.setAttribute(a, tv); }
    });
    var k = node.childNodes;
    for (var i = 0; i < k.length; i++) fix(k[i]);
  }
  var mo = new MutationObserver(function (list) {
    if (busy) return; busy = true;
    try {
      for (var i = 0; i < list.length; i++) {
        var r = list[i];
        if (r.type === 'characterData' || r.type === 'attributes') fix(r.target);
        else for (var j = 0; j < r.addedNodes.length; j++) fix(r.addedNodes[j]);
      }
    } finally { busy = false; }
  });
  function start() {
    fix(doc.body);
    mo.observe(doc.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['aria-label', 'title'] });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
})(typeof window !== 'undefined' ? window : globalThis);
