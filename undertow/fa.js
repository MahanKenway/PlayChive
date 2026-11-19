/*
 * Undertow, Persian edition layer (PLAYCHIVE).
 * Follows the language saved by PLAYCHIVE ("playchive:lang"), or ?lang=fa / ?lang=en.
 * English stays the default and the game code is only touched at two hooks
 * (radio lines and objective text). This file translates visible text (menus,
 * HUD, radio, prompts) and swaps in Persian fonts through CSS.
 * Written by Mahan Kenway for PLAYCHIVE. See LICENSE.txt for the origin of the game.
 */
(function (root) {
  'use strict';

  var DOT = '·';

  var DICT = {
    // boot
    'Lighting the harbour': 'روشن کردن بندر',
    'Mixing paint, rust and rain': 'قاطی کردن رنگ، زنگ و باران',
    'Stacking containers': 'چیدن کانتینرها',
    'Raising the cranes': 'بالا بردن جرثقیل‌ها',
    'Flooding the apron': 'آب انداختن روی اسکله',
    'Brewing the storm': 'ساختن طوفان',
    'Rigging the tow line': 'بستن طناب یدک',
    'Waiting for first light': 'منتظر اولین نور',
    'Ready': 'آماده',

    // title and menus
    'Begin': 'شروع',
    'Chapters': 'فصل‌ها',
    'Storm Shift': 'شیفت طوفان',
    'Throttle': 'گاز',
    'Rudder': 'سکان',
    'Full ahead': 'تمام‌قدرت',
    'Hook / release': 'قلاب / رها کردن',
    'Horn': 'بوق',
    'Drag': 'کشیدن',
    'Look': 'نگاه',
    'Pause': 'توقف',
    ['Persian edition and PLAYCHIVE port by Mahan Kenway ' + DOT + ' Original game: Undertow (used with the author\'s permission)']:
      'نسخهٔ فارسی و پورت PLAYCHIVE: Mahan Kenway ' + DOT + ' بازی اصلی: Undertow (با اجازهٔ سازنده)',
    'PAUSED': 'توقف',
    'Resume': 'ادامه',
    'Restart chapter': 'شروع دوبارهٔ فصل',
    'Quit to title': 'خروج به منوی اصلی',
    'Try again': 'دوباره',
    'LOST': 'از دست رفت',
    'SHIFT OVER': 'شیفت تموم شد',
    'DAWN': 'سپیده‌دم',
    'Title': 'منوی اصلی',
    'boxes on the barge': 'جعبه روی بارج',
    'stowaway home': 'مسافر پنهان، سالم به خونه رسید',
    'ferry passengers': 'مسافر کشتی',
    'minutes': 'دقیقه',

    // chapters
    'Cast Off': 'جدا شدن از اسکله',
    'Flotsam': 'بار شناور',
    'Knocking': 'ضربه‌ها',
    'The Channel': 'کانال',
    'Lee Shore': 'ساحل بادخور',
    'CAST OFF': 'جدا شدن از اسکله',
    'FLOTSAM': 'بار شناور',
    'KNOCKING': 'ضربه‌ها',
    'THE CHANNEL': 'کانال',
    'LEE SHORE': 'ساحل بادخور',

    // HUD
    'HULL': 'بدنه',
    'HEAT': 'دما',
    'LINE': 'طناب',
    'HOOK': 'قلاب',
    'BOOST': 'تقویت',
    'HORN': 'بوق',
    'HARBOUR': 'بندر',
    'ALBATROSS': 'آلباتروس',
    'NICO': 'نیکو',
    'MEDICS': 'امدادگرها',
    'PEN': 'حصار',
    'STORM SHIFT': 'شیفت طوفان',

    // objectives
    'Run the gates': 'از دروازه‌ها رد شو',
    'Tow boxes into the pen': 'جعبه‌ها رو بکش توی حصار',
    'Find the knocking box': 'جعبهٔ ضربه‌زن رو پیدا کن',
    'Follow the pings': 'دنبال بیپ‌ها برو',
    'Bring the box to the medics': 'جعبه رو ببر پیش امدادگرها',
    'Keep the line slack': 'طناب رو شل نگه دار',
    'Clear the ferry channel': 'کانال کشتی رو خالی کن',
    'Lane clear': 'مسیر خالیه',
    'Keep the Albatross off the breakwater': 'نذار آلباتروس به موج‌شکن بخوره',
    'Push her north': 'هلش بده سمت شمال',
    'The Ash is still shedding boxes. Pen them, keep the channel clear. Ferry every two minutes.':
      'اَش هنوز داره جعبه می‌ریزه. بچپونشون توی حصار و کانال رو خالی نگه دار. هر دو دقیقه یه کشتی می‌رسه.',

    // radio
    'Petrel, Harbour. The Meridian Ash rolled off the breakwater and dropped her deck stack.':
      'پترل، اینجا بندر. مریدین اَش از موج‌شکن سُر خورد و بار عرشه‌اش ریخت.',
    'Boxes are drifting in on the tide. Slip your lines and run the yellow gates, let me see you still steer.':
      'جعبه‌ها با جزر و مد دارن میان. طناب‌ها رو باز کن و از دروازه‌های زرد رد شو. ببینم هنوز بلدی فرمون بگیری.',
    'Hook gear is live. Get a line on a box and drag it into the barrel pen by the salvage barge.':
      'قلاب آماده‌ست. به یه جعبه طناب بنداز و بکشش توی حصار بشکه‌ها، کنار بارج نجات.',
    'The crane will do the rest. Mind your speed, a snapped line goes nowhere.':
      'بقیه‌اش با جرثقیل. حواست به سرعت باشه، طناب پاره دیگه به درد نمی‌خوره.',
    'That’s a line. Easy on the throttle when it starts to sing.':
      'این شد طناب. وقتی زوزه کشید، گاز رو آروم‌تر بده.',
    'Line’s parted! Ease off and hook her again.': 'طناب پاره شد! گاز رو بکش و دوباره قلاب بنداز.',
    'You snapped it. Gentler this time.': 'پاره‌ش کردی. این بار نرم‌تر.',
    'Line gone. Throttle down when it sings.': 'طناب رفت. وقتی زوزه می‌کشه، گاز رو کم کن.',
    'Petrel, the hydrophone is picking up knocking. Three short, three long, three short.':
      'پترل، هیدروفون صدای ضربه می‌گیره. سه کوتاه، سه بلند، سه کوتاه.',
    'Someone is inside one of those boxes. Follow the pings, they get louder when you’re close.':
      'یکی توی یکی از اون جعبه‌هاست. دنبال بیپ‌ها برو، نزدیک که بشی بلندتر می‌شن.',
    'Hello? Is someone there? The water’s coming in at the doors—': 'الو؟ کسی اون‌جاست؟ آب داره از درها میاد تو...',
    'Easy, easy. That box can’t take a hard pull. Bring it to the medic pontoon by the quay.':
      'آروم، آروم. اون جعبه کشیدن تند رو تحمل نمی‌کنه. ببرش پیش پل شناور امدادگرها، کنار اسکله.',
    'Not that one. Listen for the knocking.': 'اون نه. به صدای ضربه گوش بده.',
    'Harbour, Albatross. Inbound with three hundred souls, ETA four minutes.':
      'بندر، اینجا آلباتروس. با سیصد نفر در راهیم، چهار دقیقهٔ دیگه می‌رسیم.',
    'Petrel, five boxes are sitting in her channel. Drag them out of the lane, anywhere outside the buoys.':
      'پترل، پنج تا جعبه وسط کانالشه. از مسیر بکششون بیرون، هرجا خارج از شناورها.',
    'Harbour, Albatross! Total blackout. No engines, no steering!':
      'بندر، آلباتروس! برق کامل رفته. نه موتور داریم، نه فرمون!',
    'She’s being set onto the breakwater. Petrel, get your bow on her south side and push!':
      'دارن می‌برنش سمت موج‌شکن. پترل، دماغهٔ قایقت رو بذار روی سمت جنوبیش و هل بده!',
    'Albatross inbound. Keep that lane clear!': 'آلباتروس داره میاد. اون مسیر رو خالی نگه دار!',
    'We hit something! Petrel, that lane was supposed to be clear!':
      'به یه چیزی خوردیم! پترل، قرار بود اون مسیر خالی باشه!',
    'Petrel, you’re outside the harbour. Come back in.': 'پترل، از بندر بیرون زدی. برگرد تو.',
    'Penned. That’s out of her way too.': 'توی حصار رفت. این هم از سر راهش کنار رفت.',
    'Medics have the doors open… we’ve got him. A kid, frozen half to death, but breathing.':
      'امدادگرها درها رو باز کردن... گرفتیمش. یه بچه‌ست، نیمه‌جون از سرما، ولی نفس می‌کشه.',
    'Thank you. Thank you. I’m Nico.': 'ممنون. ممنون. من نیکوام.',
    'Still got it. The spill is east of the barge. Let’s go fishing.':
      'هنوز دستت گرمه. بارِ ریخته شرقِ بارجه. بریم ماهی‌گیری.',
    'That’s three on the barge. Wait… Petrel, do you hear that?':
      'سه تا روی بارج نشست. صبر کن... پترل، اینو می‌شنوی؟',
    'Albatross, one minute out. I can see the breakwater light.':
      'آلباتروس، یه دقیقه مونده. چراغ موج‌شکن رو می‌بینم.',
    'One left in the lane!': 'یکی هنوز توی مسیره!',
    'Channel’s clear. Albatross, you’re good to come in.': 'کانال خالیه. آلباتروس، می‌تونی وارد شی.',
    'Thank you, Petrel. We owe you a pint.': 'ممنون پترل. یه نوشیدنی بهت بدهکاریم.',
    'Chief has one generator turning over. Keep her off!': 'سرمهندس یه ژنراتور رو روشن کرده. دورش نگه دار!',
    'Gust coming through. Lean on her, Petrel!': 'تندباد داره میاد. بهش فشار بیار پترل!',
    'We have power! Steering answers! Petrel, you beautiful little boat.':
      'برق اومد! فرمون جواب می‌ده! پترل، ای قایق کوچولوی نازنین.',
    'That’s the night, Petrel. Nico’s asking for the captain who found him. Bring her home.':
      'شب تموم شد پترل. نیکو دنبال کاپیتانی می‌گرده که پیداش کرد. برش گردون خونه.',
    'We lost one. It went straight down.': 'یکی رو از دست دادیم. مستقیم رفت ته آب.',
    'Box gone. That’s money on the seabed.': 'جعبه رفت. پول ریخت ته دریا.',
    'Another one sank.': 'یکی دیگه هم غرق شد.',
    'That one’s gone. Plenty more out there.': 'اون رفت. هنوز کلی جعبه اون بیرونه.',

    // cargo chatter
    'Two thousand rubber ducks. Of course it is.': 'دوهزار تا اردک پلاستیکی. معلومه که همینه.',
    'Two thousand rubber ducks. Of course it is.': 'دوهزار تا اردک پلاستیکی. معلومه که همینه.',
    'Frozen prawns. Smells like it, too.': 'میگوی یخ‌زده. بوش هم همینو می‌گه.',
    'Somebody ordered a grand piano.': 'یکی پیانوی گرند سفارش داده بود.',
    'Tractor tyres. Forty of them.': 'لاستیک تراکتور. چهل تا.',
    'Office chairs. Four hundred office chairs.': 'صندلی اداری. چهارصد تا صندلی اداری.',
    'Wedding dresses, bound for the islands.': 'لباس عروس، مقصد جزیره‌ها.',
    'Bicycle frames. Somebody will be happy.': 'شاسی دوچرخه. یکی خوشحال می‌شه.',
    'Coffee beans. Imogen says keep that one dry.': 'دانهٔ قهوه. ایموجن می‌گه این یکی رو خشک نگه دار.',
    'Garden gnomes. I am not joking.': 'کوتوله‌های باغچه. شوخی نمی‌کنم.',
    'Medical saline. That one matters.': 'سرم پزشکی. این یکی مهمه.',
    'Christmas lights in November.': 'چراغ کریسمس توی نوامبر.',
    'School desks for the north shore.': 'میز مدرسه برای ساحل شمالی.',

    // fail reasons
    'The Petrel is holed and taking on water.': 'بدنهٔ پترل سوراخ شده و آب برمی‌داره.',
    'Too many boxes on the seabed.': 'خیلی جعبه رفته ته دریا.',
    'The box with Nico in it went under.': 'جعبه‌ای که نیکو توش بود غرق شد.',
    'The Albatross ran onto a box in the channel.': 'آلباتروس توی کانال به یه جعبه خورد.',
    'The Albatross went onto the breakwater.': 'آلباتروس به موج‌شکن خورد.',
    'The Albatross hit one too many boxes.': 'آلباتروس به جعبه‌های زیادی خورد.'
  };

  var PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
  function faDigits(s) { return String(s).replace(/\d/g, function (d) { return PERSIAN_DIGITS[d]; }); }

  function tr(s) { return Object.prototype.hasOwnProperty.call(DICT, s) ? DICT[s] : s; }

  var RULES = [
    [/^Boxes saved: (\d+)$/, function (m) { return 'جعبهٔ نجات‌یافته: ' + faDigits(m[1]); }],
    [/^Lives (\d+)$/, function (m) { return 'جان‌ها: ' + faDigits(m[1]); }],
    [/^best (\d+)$/, function (m) { return 'بهترین: ' + faDigits(m[1]); }],
    [/^(\d+) boxes? in the lane$/, function (m) { return faDigits(m[1]) + ' جعبه توی مسیر'; }],
    [/^Engines (\d+)%\s+·\s+(\d+) m to the rocks$/, function (m) {
      return 'موتورها ' + faDigits(m[1]) + '٪ ' + DOT + ' ' + faDigits(m[2]) + ' متر تا صخره‌ها';
    }],
    [/^(I|II|III|IV|V) · (.+)$/, function (m) { return m[1] + ' ' + DOT + ' ' + tr(m[2]); }],
    [/^(I|II|III|IV|V)\s{2}(.+)$/, function (m) { return m[1] + '  ' + tr(m[2]); }],
    [/^(.+) · (\d+) boxes saved$/, function (m) { return tr(m[1]) + ' ' + DOT + ' ' + faDigits(m[2]) + ' جعبه نجات پیدا کرد'; }],
    [/^(E|HOOK)\s+Release$/, function (m) { return m[1] + '  رها کن'; }],
    [/^(E|HOOK)\s+Hook$/, function (m) { return m[1] + '  قلاب'; }]
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
    var at = text.indexOf(trimmed);
    return text.slice(0, at) + out + text.slice(at + trimmed.length);
  }

  function currentLang() {
    try {
      var q = new URLSearchParams(root.location.search).get('lang');
      if (q === 'fa' || q === 'en') return q;
    } catch (e) { /* ignore */ }
    try { return root.localStorage.getItem('playchive:lang') === 'fa' ? 'fa' : 'en'; } catch (e) { return 'en'; }
  }

  var api = { translate: translate, DICT: DICT, faDigits: faDigits, lang: 'en' };

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
  var ARABIC = /[؀-ۿ]/;
  var AUTO_DIR = /(^|\s)(ut-ot|ut-os|ut-ch|ut-say|ut-who|ut-ct|ut-why|ut-prompt|ut-credit|ut-mark|ut-chapters)(\s|$)/;

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
          if (r.type === 'characterData' || r.type === 'attributes') fixNode(r.target);
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
