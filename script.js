// Section Navigation (replaces Swiper)
// Order matches the section order: Resume, Procedures, Instruments, Standards, Portfolio, Contact
const sectionIds = ["hero", "procedures", "instruments", "standards", "portfolio", "contact"];
const sectionLabels = ["Resume", "Procedures", "Instruments", "Standards", "Portfolio", "Contact"];

// Jump to Specific Section via Navigation Menu (same name/signature as before,
// so the header's onclick="goToSlide(N)" buttons keep working unchanged)
function goToSlide(index) {
    const target = document.getElementById(sectionIds[index]);
    if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    closeMobileMenuIfOpen();
}

// Mobile Menu Toggle
// The desktop nav (in the header) is hidden below the 'md' breakpoint, so
// this hamburger + panel is the only labeled navigation on mobile —
// pagination dots alone aren't a substitute since they carry no visible
// text label on touch devices (their tooltip only shows on :hover).
function toggleMobileMenu() {
    const menu = document.getElementById("mobile-menu");
    const toggleBtn = document.getElementById("mobile-menu-toggle");
    const iconOpen = document.getElementById("mobile-menu-icon-open");
    const iconClose = document.getElementById("mobile-menu-icon-close");
    if (!menu || !toggleBtn || !iconOpen || !iconClose) return;

    const isHidden = menu.classList.contains("hidden");
    menu.classList.toggle("hidden", !isHidden);
    iconOpen.classList.toggle("hidden", isHidden);
    iconClose.classList.toggle("hidden", !isHidden);
    toggleBtn.setAttribute("aria-expanded", isHidden ? "true" : "false");
}

// Closes the mobile menu unconditionally if it happens to be open — used
// after any navigation (e.g. clicking a pagination dot) so a stale open
// menu never lingers over the newly-scrolled-to section. Does nothing if
// the menu is already closed (unlike toggleMobileMenu, which would open it).
function closeMobileMenuIfOpen() {
    const menu = document.getElementById("mobile-menu");
    const toggleBtn = document.getElementById("mobile-menu-toggle");
    const iconOpen = document.getElementById("mobile-menu-icon-open");
    const iconClose = document.getElementById("mobile-menu-icon-close");
    if (!menu || menu.classList.contains("hidden")) return;

    menu.classList.add("hidden");
    if (iconOpen) iconOpen.classList.remove("hidden");
    if (iconClose) iconClose.classList.add("hidden");
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
}

// Build the pagination dots once the page is ready
function buildSectionPagination() {
    const nav = document.getElementById("section-pagination");
    if (!nav) return;

    sectionIds.forEach((id, index) => {
        const bullet = document.createElement("button");
        bullet.type = "button";
        bullet.className = "section-pagination-bullet";
        bullet.setAttribute("data-hover", sectionLabels[index]);
        bullet.setAttribute("aria-label", sectionLabels[index]);
        bullet.addEventListener("click", () => goToSlide(index));
        nav.appendChild(bullet);
    });
}

// Highlight the pagination dot matching whichever section is in view.
// This replaces Swiper's automatic active-bullet behavior.
function initSectionScrollSpy() {
    const bullets = document.querySelectorAll(".section-pagination-bullet");
    if (!bullets.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const idx = sectionIds.indexOf(entry.target.id);
                    if (idx === -1) return;
                    bullets.forEach((b, i) => {
                        b.classList.toggle("active", i === idx);
                    });
                }
            });
        },
        { threshold: 0.5 }
    );

    sectionIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
    });
}

buildSectionPagination();
initSectionScrollSpy();

// Test Procedures Database
const testsData = {
    continuity: {
        title: "تست پیوستگی هادی‌های حفاظتی (Continuity Test)",
        standard: "IEC 60364-6",
        overview: "این تست برای اطمینان از اتصال کامل، بدون قطعی و کم‌مقاومت تمامی هادی‌های حفاظتی (PE)، هادی‌های هم‌پتانسیل‌سازی اصلی و فرعی به زمین اجرا می‌شود.",
        instrument: "دستگاه تستر چندمنظوره یا Low-Ohm Meter با جریان حداقل 200mA",
        limit: "مقاومت هادی حفاظتی باید کمتر از 1 اهم (معمولاً کمتر از 0.2 اهم در طول‌های کوتاه) باشد.",
        steps: [
            "قطع کامل جریان برق و اطمینان از عدم وجود ولتاژ در مدار",
            "تنظیم دستگاه تستر روی حالت Low-Ohm / Continuity",
            "صفر کردن مقاومت پروب‌ها (Lead Zero / Null)",
            "اندازه‌گیری مقاومت بین شینه ارت اصلی و انتهای هادی‌های حفاظتی"
        ]
    },
    insulation: {
        title: "تست مقاومت عایقی (Insulation Resistance Test)",
        standard: "IEC 60364-6",
        overview: "تست مگاومتر (مگر) جهت سنجش سلامت عایق‌بندی سیم‌ها و کابل‌ها بین هادی‌های برق‌دار و زمین، و همچنین بین هادی‌های فاز با یکدیگر استفاده می‌شود.",
        instrument: "دستگاه مگاومتر (Insulation Tester) با ولتاژ تزریقی 250V / 500V / 1000V DC",
        limit: "حداقل مقاومت عایقی طبق IEC 60364 برابر با 1 مگااهم (1MΩ) در ولتاژ تست 500V است.",
        steps: [
            "جدا کردن تجهیزات حساس الکترونیکی از مدار جهت جلوگیری از آسیب",
            "اعمال ولتاژ تزریقی DC (مثلاً 500 ولت) بین هادی‌ها و ارت به مدت 60 ثانیه",
            "ثبت مقدار مقاومت خوانده شده و اطمینان از بالاتربودن آن از حد مجاز"
        ]
    },
    rcd: {
        title: "تست کلیدهای محافظ جان (RCD Testing)",
        standard: "IEC 61008 / 61009",
        overview: "ارزیابی عملکرد ایمنی کلیدهای دیفرانسیل جهت اطمینان از قطع سریع مدار هنگام بروز جریان نشتی و جلوگیری از برق‌گرفتگی.",
        instrument: "دستگاه RCD Tester یا تستر چندمنظوره Chauvin Arnoux / Habotest",
        limit: "زمان قطع در جریان نامی (1xIΔn) باید کمتر از 300 میلی‌ثانیه باشد.",
        steps: [
            "اعمال جریان نیم‌برابر نامی (0.5xIΔn) و اطمینان از عدم قطع کلید",
            "اعمال جریان نامی (1xIΔn) در زوایای فاز 0 و 180 درجه و ثبت زمان قطع (ms)",
            "اعمال جریان 5 برابری (5xIΔn) برای تست قطع سریع (Fast Trip)"
        ]
    },
    polarity: {
        title: "تست پلاریته (Polarity Test)",
        standard: "IEC 60364-6",
        overview: "صحت‌سنجی قرارگیری کلیدها، فیوزها و ترمینال‌های حفاظتی دقیقاً در مسیر هادی فاز (و نه نول) جهت ایمنی کامل هنگام خاموش بودن کلید.",
        instrument: "مولتی‌متر یا تستر پیوستگی کم‌مقاومت",
        limit: "اتصال مستقیم فاز به پایه مرکزی سرپیچ لامپ‌ها و قطب اصلی کلیدها.",
        steps: [
            "قطع تغذیه اصلی تابلو برق",
            "چک کردن اتصال هادی فاز ورودی به ورودی کلید تک‌قطبی",
            "اطمینان از متصل نبودن هادی نول به کلیدهای تک‌قطبی و سرپیچ‌ها"
        ]
    },
    phase: {
        title: "تست توالی فاز (Phase Sequence Test)",
        standard: "IEC 60364-6",
        overview: "تایید راست‌گرد بودن توالی فازها (R-S-T / L1-L2-L3) پیش از برق‌دار کردن الکتروموتورها و تجهیزات سه‌فاز حساس.",
        instrument: "دستگاه Phase Rotation Indicator (RST سنج)",
        limit: "توالی استاندارد جهت چرخش راست‌گرد (Clockwise)",
        steps: [
            "اتصال سه پروب دستگاه به سه فاز ورودی تابلو یا ورودی موتور",
            "برق‌دار کردن مدار و مشاهده نشانگر چرخش روی دستگاه",
            "در صورت چپ‌گرد بودن، تعویض جای دو فاز ورودی با یکدیگر"
        ]
    },
    earth: {
        title: "تست مقاومت الکترود زمین (Earth Resistance)",
        standard: "IEC 60364-6",
        overview: "اندازه‌گیری مقاومت الکتریکی چاه ارت یا شبکه مش نسبت به جرم عمومی زمین جهت تخلیه ایمن جریان‌های خطا و صاعقه.",
        instrument: "دستگاه ارت‌سنج Mastech / Chauvin Arnoux ۳ یا ۴ سیمه",
        limit: "برای سیستم‌های توزیع معمولاً کمتر از 5 اهم (ترجیحاً زیر 2 اهم)",
        steps: [
            "جداسازی شینه ارت از چاه ارت (فتح سیم‌گیر تست)",
            "کوبیدن میله‌های کمکی ولتاژ و جریان در فواصل استاندارد (مثلاً 10 و 15 متری)",
            "اعمال جریان توسط ارت‌سنج و ثبت مقاومت چاه برحسب اهم (Ω)"
        ]
    }
};

// Open Dynamic Test Detail View
function openTestDetail(testKey) {
    const test = testsData[testKey];
    if (!test) return;

    document.getElementById('detail-title').innerText = test.title;
    document.getElementById('detail-overview').innerText = test.overview;
    document.getElementById('detail-instrument').innerText = test.instrument;
    document.getElementById('detail-limit').innerText = test.limit;

    const badge = document.getElementById('detail-badge');
    if (badge) {
        badge.innerText = 'استاندارد ' + test.standard;
    }

    const stepsList = document.getElementById('detail-steps');
    stepsList.innerHTML = '';
    test.steps.forEach(step => {
        const li = document.createElement('li');
        li.innerText = step;
        stepsList.appendChild(li);
    });

    document.getElementById('tests-grid-view').classList.add('hidden');
    document.getElementById('test-detail-view').classList.remove('hidden');
}


// Close Detail View and Return to Grid
function closeTestDetail() {
    document.getElementById('test-detail-view').classList.add('hidden');
    document.getElementById('tests-grid-view').classList.remove('hidden');
}

// Digital Business Card (vCard) Download
// Builds a vCard 3.0 file in-browser and triggers a download — no server
// round-trip, so it works offline and can never be "down". VERSION 3.0
// (rather than 4.0) is used for the widest compatibility across Android
// and iOS contact apps. CHARSET=UTF-8 is set explicitly on the
// Persian-text fields per the vCard 3.0 spec, since omitting it can cause
// some contact apps to render Persian names as garbled text.
function downloadVCard() {
    const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        "N;CHARSET=UTF-8:خاک‌بیز;صابر;;;",
        "FN;CHARSET=UTF-8:صابر خاک‌بیز",
        "TITLE;CHARSET=UTF-8:مجری تست و تحویل تاسیسات برقی",
        "TEL;TYPE=CELL,VOICE:+989225980729",
        "EMAIL;TYPE=INTERNET:saberkhakbiz73@gmail.com",
        "URL:https://t.me/saberk14z",
        "ADR;TYPE=WORK;CHARSET=UTF-8:;;;گیلان;;;ایران",
        "END:VCARD"
    ];
    const vcfContent = lines.join("\r\n");
    const blob = new Blob([vcfContent], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "Saber-Khakbiz.vcf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}