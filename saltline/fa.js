/*
 * Saltline, Persian edition layer (PLAYCHIVE).
 * Follows the language saved by PLAYCHIVE ("playchive:lang"), or ?lang=fa / ?lang=en.
 * English stays the default and the game code is not touched: this file only
 * translates visible text (menus, HUD, radio, prompts) and swaps in Persian fonts.
 * In-world signage painted onto textures stays in English on purpose.
 * Written by Mahan Kenway for PLAYCHIVE. The game itself is MIT, see LICENSE.txt.
 */
(function (root) {
  'use strict';

  var DASH = '—';
  var DOT = '·';

  var DICT = {
    // boot
    'Raising the terminal': 'راه‌اندازی ترمینال',
    'Stacking containers': 'چیدن کانتینرها',
    'Raising the cranes': 'بالا بردن جرثقیل‌ها',
    'Flooding the apron': 'آب انداختن روی اسکله',
    'Waking the renderer': 'بیدار کردن رندرر',
    'Mixing paint, rust and rain': 'قاطی کردن رنگ، زنگ و باران',
    'Loading tracers and smoke': 'بارگذاری ردگلوله و دود',
    'Checking the rifle': 'بررسی تفنگ',
    'Waking the Harbormaster': 'بیدار کردن هاربرمستر',
    'Waiting for first light': 'منتظر اولین نور',
    'Ready': 'آماده',

    // title screen
    'Port Authority Breach Unit': 'یگان رخنهٔ اداره‌ی بندر',
    ['Saltline Terminal ' + DOT + ' 05:42']: 'ترمینال Saltline ' + DOT + ' ۰۵:۴۲',
    'The port’s security net has gone feral. Cut its three uplinks. Reach the boat.':
      'شبکهٔ امنیتی بندر وحشی شده. سه لینک ارتباطیش رو قطع کن و خودت رو به قایق برسون.',
    'Deploy': 'شروع مأموریت',
    'Settings': 'تنظیمات',
    'Controls': 'کنترل‌ها',
    'Every surface, machine and sound is generated in your browser. Nothing is downloaded.':
      'همهٔ سطح‌ها، ماشین‌ها و صداها توی مرورگر خودت ساخته می‌شن. چیزی دانلود نمی‌شه.',
    ['Persian edition and PLAYCHIVE port by Mahan Kenway ' + DOT + ' Original game by Claude Fable 5.2 (MIT)']:
      'نسخهٔ فارسی و پورت PLAYCHIVE: Mahan Kenway ' + DOT + ' بازی اصلی: Claude Fable 5.2 (MIT)',
    'Controls at a glance': 'کنترل‌ها در یک نگاه',
    'Move': 'حرکت',
    'Look': 'نگاه',
    'Fire': 'شلیک',
    'Aim': 'نشانه‌گیری',
    'Reload': 'پر کردن خشاب',
    'Cut relay': 'قطع رله',
    'Jump': 'پرش',
    'Sprint': 'دویدن',
    'Crouch': 'خم شدن',
    'Melee': 'ضربهٔ نزدیک',
    'Pause': 'توقف',
    'Mouse': 'ماوس',
    'Left button': 'دکمهٔ چپ',
    'Right button': 'دکمهٔ راست',
    'or': 'یا',
    'Hold': 'نگه دار',
    'Touch': 'لمسی',
    'Left thumb moves': 'انگشت چپ حرکت می‌ده',
    'Right thumb looks': 'انگشت راست نگاه می‌کنه',
    ['Fire ' + DOT + ' Aim ' + DOT + ' Reload ' + DOT + ' Jump on screen']: 'شلیک ' + DOT + ' نشانه‌گیری ' + DOT + ' خشاب ' + DOT + ' پرش روی صفحه',
    'Left thumb, anywhere': 'انگشت چپ، هرجای صفحه',
    'Drag the right side': 'سمت راست رو بکش',
    'Hold FIRE, drag to track': 'FIRE رو نگه دار و بکش تا دنبالش کنی',
    'AIM toggles': 'AIM روشن و خاموش می‌کنه',
    'Hold USE at a relay': 'کنار رله USE رو نگه دار',
    'Push the stick fully forward': 'استیک رو تا ته جلو بده',

    // cards
    'Operation on hold': 'عملیات متوقف شد',
    'Paused': 'توقف',
    'Resume': 'ادامه',
    'Restart mission': 'شروع دوبارهٔ مأموریت',
    'Breacher down': 'رخنه‌گر از پا افتاد',
    'Signal lost': 'سیگنال قطع شد',
    'Time survived': 'مدت زنده‌ماندن',
    'Relays cut': 'رله‌های قطع‌شده',
    'Retry': 'دوباره',
    ['Berth 4 ' + DOT + ' Debrief']: 'اسکلهٔ ۴ ' + DOT + ' گزارش',
    'Saltline is dark': 'Saltline خاموش شد',
    'Rating': 'رتبه',
    'Time': 'زمان',
    'Accuracy': 'دقت',
    'Machines destroyed': 'ماشین‌های نابودشده',
    'Retries': 'تلاش دوباره',
    'Redeploy': 'اجرای دوباره',
    'Messy': 'شلخته',
    'Loud': 'پرسروصدا',
    'Steady': 'آرام و پایدار',
    'Clean': 'تمیز',
    'Sharp': 'تیز',
    'Surgical': 'جراحی‌وار',

    // panel
    'Settings and controls': 'تنظیمات و کنترل‌ها',
    'Close': 'بستن',
    'Graphics quality': 'کیفیت گرافیک',
    'low': 'کم', 'medium': 'متوسط', 'high': 'زیاد', 'ultra': 'فوق‌العاده',
    'Mouse sensitivity': 'حساسیت ماوس',
    'Invert Y': 'وارونهٔ محور عمودی',
    'On': 'روشن',
    'Off': 'خاموش',
    'Master volume': 'صدای کل',
    'Field of view': 'میدان دید',
    'Display': 'نمایش',
    'Enter fullscreen': 'تمام‌صفحه',
    'Exit fullscreen': 'خروج از تمام‌صفحه',
    'Fullscreen is not available here': 'تمام‌صفحه اینجا در دسترس نیست',
    'Quality changes apply at once; shadows and reflections may take a moment to rebuild.':
      'تغییر کیفیت همون لحظه اعمال می‌شه. ساخت دوبارهٔ سایه‌ها و بازتاب‌ها ممکنه چند لحظه طول بکشه.',
    ['Keyboard ' + DOT + ' Mouse']: 'کیبورد ' + DOT + ' ماوس',
    'Gamepad': 'دستهٔ بازی',
    'If the browser will not capture the mouse, hold a mouse button and drag to look (left also fires, right also aims). Arrow keys or':
      'اگه مرورگر ماوس رو قفل نکرد، یه دکمهٔ ماوس رو نگه دار و بکش تا دور بزنی (چپ شلیک هم می‌کنه، راست نشانه‌گیری). کلیدهای جهت‌دار یا',
    'turn,': 'هم می‌چرخونن،',
    'fires.': 'شلیک می‌کنه.',
    ['Sticks move and look ' + DOT + ' RT fire ' + DOT + ' LT aim ' + DOT + ' A jump ' + DOT + ' B crouch ' + DOT + ' X reload ' + DOT + ' Y cut relay ' + DOT + ' L3 sprint ' + DOT + ' Start pause.']:
      'استیک‌ها حرکت و نگاه ' + DOT + ' RT شلیک ' + DOT + ' LT نشانه‌گیری ' + DOT + ' A پرش ' + DOT + ' B خم‌شدن ' + DOT + ' X خشاب ' + DOT + ' Y قطع رله ' + DOT + ' L3 دویدن ' + DOT + ' Start توقف.',
    ['Saltline Terminal ' + DOT + ' Berth 4 ' + DOT + ' 05:42']: 'ترمینال Saltline ' + DOT + ' اسکلهٔ ۴ ' + DOT + ' ۰۵:۴۲',
    ['Port Authority Breach Unit ' + DASH + ' one breacher, no backup']: 'یگان رخنهٔ اداره‌ی بندر، یک رخنه‌گر، بدون پشتیبان',

    // look mode
    'Touch controls active': 'کنترل لمسی فعاله',
    ['Mouse capture unavailable ' + DASH + ' move the mouse to look, rest it at a screen edge to keep turning ' + DOT + ' click fires ' + DOT + ' arrows or IJKL also turn']:
      'قفل ماوس در دسترس نیست. ماوس رو حرکت بده تا دور بزنی، کنار صفحه نگهش دار تا بچرخه ' + DOT + ' کلیک شلیک می‌کنه ' + DOT + ' کلیدهای جهت‌دار یا IJKL هم می‌چرخونن',
    ['Mouse captured ' + DASH + ' Esc releases it']: 'ماوس قفل شد. با Esc آزاد می‌شه',
    'Click the view to capture the mouse': 'برای قفل کردن ماوس روی صحنه کلیک کن',
    'Resume recaptures the mouse.': 'با «ادامه» ماوس دوباره قفل می‌شه.',

    // HUD
    'Objective': 'هدف',
    'Relays': 'رله‌ها',
    'Vitals': 'سلامتی',
    'Control': 'کنترل',
    'Weak point': 'نقطهٔ ضعف',
    'destroyed': 'نابود شد',
    'GULL': 'پهپاد مرغی',
    'HOUND': 'سگ رباتیک',
    'MACHINE': 'ماشین',
    'Reloading': 'در حال پر کردن',
    'Empty': 'خالی',
    ['R ' + DASH + ' Reload']: 'R ' + DOT + ' پر کردن',
    'Low ammo': 'فشنگ کم',
    'Cut the three uplink relays': 'سه رلهٔ ارتباطی رو قطع کن',
    'Cut the last relay': 'آخرین رله رو قطع کن',
    'Get to the boat': 'خودت رو به قایق برسون',
    ['Relays still live ' + DASH + ' the boat will not wait under fire']: 'رله‌ها هنوز فعالن. قایق زیر آتش منتظر نمی‌مونه',
    'Hauled out of the water': 'از آب کشیده شدی بیرون',

    // radio
    ['Breacher, this is Control. The Harbormaster holds the berth. Cut its three uplinks ' + DASH + ' yard, shed, quay.']:
      'رخنه‌گر، اینجا کنترل. هاربرمستر اسکله رو گرفته. سه لینکش رو قطع کن: حیاط، سوله و اسکله‌ی ساحلی.',
    'It has seen you. Gulls fly, Hounds walk. Put them down.': 'دیدتت. پهپادها پرواز می‌کنن، سگ‌ها راه می‌رن. بزن زمینشون.',
    ['One relay dark. It felt that ' + DASH + ' machines inbound.']: 'یه رله خاموش شد. حسش کرد. ماشین‌ها دارن میان.',
    'Two dark. It is throwing everything it has left at you.': 'دو تا خاموش شد. هرچی براش مونده رو به سمتت پرت می‌کنه.',
    'All three dark. The boat is holding at the quay ladder, south end. Run.': 'هر سه خاموش شد. قایق کنار نردبان اسکله‌ی ساحلی، سمت جنوب، منتظره. بدو.',
    'You are hit hard. Get behind steel and breathe.': 'سخت خوردی. برو پشت فولاد و نفس بگیر.',
    'Breacher is aboard. Saltline is dark. Good work.': 'رخنه‌گر سوار شد. Saltline خاموشه. کارت عالی بود.',

    // directions (warning line)
    'NORTH': 'شمال', 'NORTH-EAST': 'شمال‌شرق', 'EAST': 'شرق', 'SOUTH-EAST': 'جنوب‌شرق',
    'SOUTH': 'جنوب', 'SOUTH-WEST': 'جنوب‌غرب', 'WEST': 'غرب', 'NORTH-WEST': 'شمال‌غرب'
  };

  var PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
  function faDigits(s) { return String(s).replace(/\d/g, function (d) { return PERSIAN_DIGITS[d]; }); }

  var RULES = [
    [/^Cut the remaining (\d+) relays$/, function (m) { return faDigits(m[1]) + ' رلهٔ دیگه رو قطع کن'; }],
    [/^Quality was picked for this device \((.*)\)\. Lower it if the frame rate struggles\.$/,
      function (m) { return 'کیفیت برای این دستگاه خودکار انتخاب شد (' + m[1] + '). اگه فریم‌ریت افت کرد، پایین‌ترش بیار.'; }],
    [/^Hold (\S+) — Cut relay (.+)$/, function (m) { return 'برای قطع رلهٔ ' + m[2] + '، ' + m[1] + ' رو نگه دار'; }],
    [/^Contact — (.+)$/, function (m) { return 'تماس دشمن، ' + (DICT[m[1]] || m[1]); }],
    [/^Saltline could not start: (.*)$/, function (m) { return 'Saltline اجرا نشد: ' + m[1]; }],
    [/^Relay ([A-C]) — (Yard|Shed|Quay)$/, function (m) {
      return 'رلهٔ ' + m[1] + ' ' + DOT + ' ' + { Yard: 'حیاط', Shed: 'سوله', Quay: 'اسکلهٔ ساحلی' }[m[2]];
    }]
  ];

  var numericOnly = /^[\s\d\/%.:+\-—x]*$/;
  var hasDict = Object.prototype.hasOwnProperty;

  function translate(text) {
    if (typeof text !== 'string' || !text) return text;
    var trimmed = text.trim();
    if (!trimmed || numericOnly.test(trimmed)) return text;
    var out = null;
    if (hasDict.call(DICT, trimmed)) out = DICT[trimmed];
    else {
      for (var i = 0; i < RULES.length; i++) {
        var m = RULES[i][0].exec(trimmed);
        if (m) { out = RULES[i][1](m); break; }
      }
    }
    if (out == null) return text;
    var lead = text.slice(0, text.indexOf(trimmed));
    var tail = text.slice(text.indexOf(trimmed) + trimmed.length);
    return lead + out + tail;
  }

  function currentLang() {
    try {
      var q = new URLSearchParams(root.location.search).get('lang');
      if (q === 'fa' || q === 'en') return q;
    } catch (e) { /* ignore */ }
    try { return root.localStorage.getItem('playchive:lang') === 'fa' ? 'fa' : 'en'; } catch (e) { return 'en'; }
  }

  var api = { translate: translate, DICT: DICT, faDigits: faDigits, lang: 'en' };

  // Node (tests): export and stop. Browser: wire up.
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  if (!root.document) return;

  api.lang = currentLang();
  root.slT = function (s) { return api.lang === 'fa' ? translate(s) : s; };
  root.slLang = api.lang;
  if (api.lang !== 'fa') return;

  var doc = root.document;
  doc.documentElement.classList.add('fa');
  doc.documentElement.lang = 'fa';

  var ATTRS = ['aria-label', 'title'];
  var busy = false;
  var ARABIC = /[\u0600-\u06FF]/;
  var AUTO_DIR = /(^|\s)(h-obj-t|comms-t|h-msg|h-warn|h-fl|h-plabel|h-cue|m-line|m-premise|m-note|m-credit|panel-note)(\s|$)/;

  function fixNode(node) {
    if (node.nodeType === 3) {
      var t = translate(node.nodeValue);
      if (t !== node.nodeValue) {
        node.nodeValue = t;
        var par = node.parentElement;
        if (par && !par.hasAttribute('dir') && ARABIC.test(t)) par.setAttribute('dir', 'auto');
      }
      return;
    }
    if (node.nodeType !== 1) return;
    if (!node.hasAttribute('dir') && AUTO_DIR.test(node.getAttribute('class') || '')) node.setAttribute('dir', 'auto');
    for (var i = 0; i < ATTRS.length; i++) {
      var v = node.getAttribute(ATTRS[i]);
      if (v) { var tv = translate(v); if (tv !== v) node.setAttribute(ATTRS[i], tv); }
    }
    var kids = node.childNodes;
    for (var k = 0; k < kids.length; k++) fixNode(kids[k]);
  }

  function observe() {
    var targets = [doc.getElementById('ui'), doc.getElementById('boot')].filter(Boolean);
    if (!targets.length) return false;
    var mo = new MutationObserver(function (list) {
      if (busy) return;
      busy = true;
      try {
        for (var i = 0; i < list.length; i++) {
          var r = list[i];
          if (r.type === 'characterData') fixNode(r.target);
          else if (r.type === 'attributes') fixNode(r.target);
          else for (var j = 0; j < r.addedNodes.length; j++) fixNode(r.addedNodes[j]);
        }
      } finally { busy = false; }
    });
    targets.forEach(function (el) {
      fixNode(el);
      mo.observe(el, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    });
    return true;
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', observe);
  else observe();
})(typeof window !== 'undefined' ? window : globalThis);
