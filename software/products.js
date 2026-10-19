// Software products and UI text for software/index.html and the products hub.
//
// Add a screenshot: put the PNG/JPG in images/software/ and add an entry to
// "screenshots": { src: "../images/software/<file>.png", caption: "..." }.
// Raw window captures are fine: the page draws a Windows-style frame around
// them. The first screenshot is the main image on the page and on the hub.
//
// editions[].price: toman as a plain number, 0 for free, or null for "ask price".
// Every entry ends with a comma except the last one in its list.
window.SOFTWARE_DATA = {
  config: {
    telegram: "saberk14z",
    phoneDisplay: "0922 598 0729"
  },

  ui: {
    brandSub: "محصولات نرم‌افزاری",
    back: "بازگشت به سایت اصلی",
    platform: "بستر",
    version: "نسخه",
    free: "رایگان",
    askPrice: "استعلام قیمت",
    toman: "تومان",
    galleryTitle: "تصاویر برنامه",
    featuresTitle: "امکانات",
    editionsTitle: "نسخه‌ها",
    recommended: "پیشنهادی",
    deliveryTitle: "خرید و نصب چطور انجام می‌شود",
    deliverySteps: [
      "نسخه را انتخاب کن و پیام آماده را در تلگرام بفرست.",
      "زمان نصب را با هم هماهنگ می‌کنیم.",
      "برنامه را حضوری یا از راه دور روی سیستم تو نصب و فعال می‌کنم."
    ],
    requirementsTitle: "پیش‌نیازها",
    faqTitle: "پرسش‌های رایج",
    shotSoon: "تصویر برنامه به‌زودی",
    prev: "تصویر قبلی",
    next: "تصویر بعدی",
    close: "بستن",
    shotOf: "{i} از {n}",
    sentHint: "تلگرام باز شد و متن پیام هم کپی شد. اگر متن در کادر پیام نیامد، Paste کن و بفرست.",
    altContact: "تلگرام باز نمی‌شود؟ با شماره‌ی {phone} تماس بگیر.",
    msgOrder: "سلام، از سایت درخواست {name} ({edition}) دارم.",
    footer: "خرید و نصب پس از هماهنگی در تلگرام انجام می‌شود.",
    loadError: "اطلاعات نرم‌افزارها الان در دسترس نیست. برای سفارش در تلگرام پیام بده: @{tg}"
  },

  products: [
    {
      id: "ampercard",
      name: "AmperCard",
      tagline: "",
      summary: "",
      platform: "ویندوز",
      version: "",
      screenshots: [],
      features: [],
      editions: [
        {
          id: "free",
          name: "نسخه‌ی رایگان",
          price: 0,
          items: [],
          cta: "درخواست نسخه‌ی رایگان"
        },
        {
          id: "pro",
          name: "نسخه‌ی حرفه‌ای",
          price: null,
          items: [],
          cta: "سفارش نسخه‌ی حرفه‌ای",
          highlight: true
        }
      ],
      requirements: [
        ["سیستم‌عامل", "ویندوز"]
      ],
      faq: []
    }
  ]
};
