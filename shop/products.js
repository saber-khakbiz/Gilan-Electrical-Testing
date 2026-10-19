// Shop catalog and UI text.
//
// Add a product: copy one object in "products", give it a unique id
// (English letters, digits, "-" or "_"), and fill in the fields.
//   category : one of the ids in "categories" below
//   price    : toman as a plain number (e.g. 450000), or null for "ask price"
//   status   : "available" | "made-to-order" | "soon"
//   image    : "../images/shop/<file>.jpg", or "" for the drawn placeholder
//   art      : placeholder drawing when there is no image:
//              "buzzer" | "magnet" | "generic"
//
// Second order channel: Telegram is filtered in Iran, so a domestic messenger
// can be added in config.altMessengers, e.g.
//   altMessengers: [ { name: "...", url: "https://ble.ir/your_id" } ]
// Each entry adds a button that copies the order text and opens that chat.
//
// Check your edits: open shop/index.html#check in the browser. It lists every
// product with a problem; products with an error are hidden from visitors,
// products with a warning are shown with a safe default.
// Every entry ends with a comma except the last one in its list.
window.SHOP_DATA = {
  config: {
    telegram: "saberk14z",
    phoneDisplay: "0922 598 0729",
    altMessengers: []
  },

  // Filter chips appear only for categories that have at least one product.
  categories: [
    { id: "circuit", name: "شناسایی مدار" },
    { id: "probe", name: "پراب و رابط" },
    { id: "earth", name: "ارت و همبندی" },
    { id: "accessory", name: "لوازم جانبی" }
  ],

  ui: {
    brandSub: "محصولات سخت‌افزاری",
    back: "بازگشت به سایت اصلی",
    cart: "سبد",
    heroEyebrow: "ساخت خودم، امتحان‌شده در کارگاه",
    heroTitle: "ابزارهای کوچکی که کار تست را راحت می‌کنند",
    heroLead: "این‌ها ابزارهایی‌اند که برای کار روزمره‌ی تست و تحویل ساخته‌ام و خودم هر روز از آن‌ها استفاده می‌کنم. پرداخت آنلاین در کار نیست؛ سفارش را در تلگرام ثبت می‌کنی و هماهنگی ارسال و پرداخت همان‌جا انجام می‌شود.",
    stepsTitle: "سفارش در سه قدم",
    steps: [
      "ابزار را به سبد اضافه کن",
      "نام و شهرت را در سبد بنویس",
      "سفارش آماده را در تلگرام بفرست"
    ],
    status: {
      "available": "موجود",
      "made-to-order": "ساخت پس از سفارش",
      "soon": "به‌زودی"
    },
    askPrice: "استعلام قیمت",
    toman: "تومان",
    add: "افزودن به سبد",
    inCart: "{q} عدد در سبد",
    addedToast: "{name} به سبد اضافه شد",
    preview: "پیش‌نمایش پیام",
    details: "جزئیات",
    notAvailable: "فعلاً قابل سفارش نیست",
    features: "ویژگی‌ها",
    specs: "مشخصات",
    howTo: "روش استفاده",
    safety: "نکته‌ی ایمنی",
    photoSoon: "عکس به‌زودی",
    filterLabel: "دسته‌بندی ابزارها",
    filterAll: "همه",
    emptyCat: "در این دسته فعلاً ابزاری نیست.",
    checkTitle: "بررسی فایل محصولات",
    checkOk: "هر {n} محصول سالم‌اند و نمایش داده می‌شوند.",
    checkSummary: "{shown} محصول نمایش داده می‌شود. {e} محصول به‌خاطر خطا پنهان شده و {w} محصول هشدار دارد.",
    checkItem: "محصول شماره‌ی {n}",
    checkError: "خطا؛ پنهان شد",
    checkWarn: "هشدار؛ با مقدار پیش‌فرض نمایش داده شد",
    checkHint: "شماره‌ی محصول یعنی ترتیبش در فهرست products فایل shop/products.js. پس از اصلاح، صفحه را دوباره بارگذاری کن.",
    shareCopy: "کپی لینک این ابزار",
    shareCopied: "لینک کپی شد",
    close: "بستن",
    qty: "تعداد",
    remove: "حذف",
    cartTitle: "سبد سفارش",
    cartEmpty: "سبد خالی است. ابزار مورد نظرت را از فهرست اضافه کن.",
    subtotal: "جمع اقلام قیمت‌دار",
    subtotalAsk: "قیمت {n} قلم در تلگرام اعلام می‌شود.",
    formTitle: "مشخصات گیرنده",
    fName: "نام و نام خانوادگی",
    fCity: "شهر",
    fPhone: "شماره تماس (اختیاری)",
    fNote: "توضیحات (اختیاری)",
    needName: "نام را بنویس تا سفارش کامل باشد.",
    sendTg: "ارسال سفارش در تلگرام",
    sendAlt: "ارسال سفارش در {name}",
    altHint: "متن سفارش کپی شد. در {name} آن را Paste کن و بفرست.",
    copyOrder: "کپی متن سفارش",
    copiedOrder: "متن سفارش کپی شد",
    sentHint: "تلگرام باز شد و متن سفارش هم کپی شد. اگر متن در کادر پیام نیامد، آن را Paste کن و بفرست.",
    copyFallback: "متن سفارش انتخاب شد؛ کپی کن و در تلگرام @{tg} بفرست.",
    altContact: "تلگرام باز نمی‌شود؟ متن سفارش را کپی کن و با شماره‌ی {phone} تماس بگیر.",
    askTitle: "سؤالی درباره‌ی ابزارها داری؟",
    askText: "درباره‌ی کاربرد، سازگاری با دستگاهت یا زمان ارسال، مستقیم در تلگرام بپرس.",
    askBtn: "پیام در تلگرام",
    footer: "پرداخت و ارسال پس از ثبت سفارش، در تلگرام هماهنگ می‌شود. سبد فقط در مرورگر خودت ذخیره می‌شود.",
    msgHello: "سلام، سفارش از سایت:",
    msgLine: "{i}) {name} × {q}",
    msgPrice: " — {p} تومان",
    msgTotal: "جمع: {p} تومان",
    msgAsk: "استعلام قیمت: {n} قلم",
    msgName: "نام: {v}",
    msgCity: "شهر: {v}",
    msgPhone: "تماس: {v}",
    msgNote: "توضیحات: {v}"
  },

  products: [
    {
      id: "circuit-finder",
      category: "circuit",
      name: "سرخط‌یاب صوتی",
      tagline: "پیدا کردن کلید هر پریز در تابلو، یک‌نفره",
      art: "buzzer",
      image: "",
      price: null,
      status: "available",
      summary: "دوشاخه‌ای با بیزر؛ تا پریز برق دارد صدا می‌دهد و با قطع کلید مربوط ساکت می‌شود.",
      howTo: "دوشاخه را به پریز مورد نظر بزن؛ تا وقتی پریز برقدار است بیزر صدا می‌دهد. کنار تابلو کلیدها را یکی‌یکی قطع کن؛ هر وقت صدا قطع شد، سرخط همان پریز را پیدا کرده‌ای. برای این کار نفر دوم یا تماس تلفنی لازم نیست.",
      features: [
        "کار یک‌نفره، بدون بی‌سیم و هماهنگی تلفنی",
        "صدای بلند که از کنار تابلو شنیده می‌شود",
        "تغذیه از خود پریز؛ باتری ندارد"
      ],
      specs: [
        ["تغذیه", "پریز ۲۲۰ ولت تک‌فاز"],
        ["کاربرد", "شناسایی کلید یا فیوز مدار پریز"],
        ["ساخت", "دست‌ساز، تست‌شده پیش از تحویل"]
      ],
      safety: "پیدا کردن کلید یعنی پیدا کردن مدار، نه اطمینان از قطع برق. پیش از کار روی مدار، بی‌برق‌بودن را با تستر معتبر تأیید کن."
    },
    {
      id: "magnetic-probe",
      category: "probe",
      name: "پراب مغناطیسی",
      tagline: "اتصال بدون دست به بدنه‌ها، تابلوها و شینه‌ها",
      art: "magnet",
      image: "",
      price: null,
      status: "available",
      summary: "آهنربای قوی با فیش موزی؛ روی بدنه‌ی فولادی می‌چسبد و سیم دستگاه به آن وصل می‌شود.",
      howTo: "پراب را به بدنه‌ی تابلو، بدنه‌ی موتور یا هر سطح فولادی بچسبان و سیم رابط دستگاه را با فیش موزی به آن بزن. یک سر اندازه‌گیری ثابت می‌ماند و هر دو دستت برای کار با دستگاه و پراب دیگر آزاد است.",
      features: [
        "سازگار با سیم‌های رابط فیش موزی مولتی‌متر، میگر و ارت‌سنج",
        "چسبندگی محکم روی فولاد، بدون گیره و پیچ",
        "مناسب آزمون پیوستگی هادی حفاظتی و همبندی"
      ],
      specs: [
        ["اتصال", "فیش موزی"],
        ["سطح نگهداری", "آهن و فولاد (فرومغناطیس)"],
        ["کاربرد", "پیوستگی، همبندی، اندازه‌گیری روی بدنه"]
      ],
      safety: "روی آلومینیوم، مس و استیل غیرمغناطیسی نمی‌چسبد. آهنربا از روی رنگ هم می‌گیرد، ولی برای تماس الکتریکی درست، نقطه‌ی تماس باید فلز لخت و تمیز باشد."
    }
  ]
};
