// Tailwind CSS Dynamic Color Configuration
tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                sans: ['Vazirmatn', 'sans-serif'],
            },
            colors: {
                navy: {
                    base: '#0a1128',
                    card: '#101f42',
                    border: '#1c2d5a',
                },
                amber: {
                    hazard: '#f59e0b',
                    glow: '#fbbf24',
                }
            }
        }
    }
};


// Initialize Swiper with responsive breakpoints (Disabled on mobile for smooth scrolling)
var swiper = new Swiper(".mySwiper", {
    direction: "vertical",
    slidesPerView: 1,
    spaceBetween: 0,
    mousewheel: true,
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
        renderBullet: function (index, className) {
            var menuNames = ["Resume", "Procedures", "Instruments", "Standards", "Contact"];
            return '<span class="' + className + '" data-hover="' + menuNames[index] + '"></span>';
        }
    },
    keyboard: {
        enabled: true,
    },
    // Disable vertical swiper on mobile devices (< 768px) for native scrolling
    breakpoints: {
        320: {
            enabled: false,
            direction: "horizontal",
        },
        768: {
            enabled: true,
            direction: "vertical",
        }
    }
});

// Test Procedures Database
const testsData = {
    continuity: {
        title: "تست پیوستگی هادی‌های حفاظتی (Continuity Test)",
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