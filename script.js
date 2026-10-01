// Page behavior: mobile menu, side navigation dots + scroll-spy,
// test procedure detail view, vCard download and copyright year.
//
// All user-visible text lives in index.html (data-* attributes and markup),
// so this file stays ASCII-only and content can be edited without touching JS.
(function () {
    "use strict";

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scrollBehavior = () => (reducedMotion.matches ? "auto" : "smooth");

    // ------------------------------------------------------------------
    // Mobile / tablet menu
    // ------------------------------------------------------------------
    const menu = document.getElementById("mobile-menu");
    const menuToggle = document.getElementById("mobile-menu-toggle");
    const iconOpen = document.getElementById("mobile-menu-icon-open");
    const iconClose = document.getElementById("mobile-menu-icon-close");

    function setMobileMenu(open) {
        if (!menu || !menuToggle) return;
        menu.classList.toggle("hidden", !open);
        if (iconOpen) iconOpen.classList.toggle("hidden", open);
        if (iconClose) iconClose.classList.toggle("hidden", !open);
        menuToggle.setAttribute("aria-expanded", String(open));
    }

    if (menu && menuToggle) {
        menuToggle.addEventListener("click", () => {
            setMobileMenu(menu.classList.contains("hidden"));
        });

        // Close the menu after any in-page link is followed. This runs during
        // the click dispatch, before the browser scrolls to the anchor, so the
        // scroll target is computed with the menu already collapsed.
        document.addEventListener("click", (event) => {
            if (event.target.closest('a[href^="#"]')) setMobileMenu(false);
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && !menu.classList.contains("hidden")) {
                setMobileMenu(false);
                menuToggle.focus();
            }
        });
    }

    // ------------------------------------------------------------------
    // Side navigation dots + scroll-spy
    // ------------------------------------------------------------------
    // Sections are discovered from the DOM, so adding/reordering a section in
    // index.html needs no change here (no index-based coupling).
    const sections = Array.from(document.querySelectorAll("main section[id][data-nav-label]"));
    const dotsNav = document.getElementById("section-pagination");
    const headerLinks = Array.from(document.querySelectorAll("[data-nav-link]"));

    const dots = sections.map((section) => {
        const dot = document.createElement("a");
        dot.href = "#" + section.id;
        dot.className = "section-pagination-bullet";
        dot.setAttribute("data-hover", section.dataset.navLabel);
        dot.setAttribute("aria-label", section.dataset.navLabel);
        if (dotsNav) dotsNav.appendChild(dot);
        return dot;
    });

    function setActiveSection(id) {
        const hash = "#" + id;
        dots.forEach((dot) => {
            const isActive = dot.getAttribute("href") === hash;
            dot.classList.toggle("active", isActive);
            if (isActive) dot.setAttribute("aria-current", "true");
            else dot.removeAttribute("aria-current");
        });
        headerLinks.forEach((link) => {
            if (link.getAttribute("href") === hash) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
        });
    }

    // The root is shrunk to a horizontal line through the middle of the
    // viewport, so "active" means "the section currently crossing the centre
    // line". Unlike a ratio threshold, this works for sections of any height
    // (a section taller than 2x the viewport can never be 50% visible).
    if ("IntersectionObserver" in window && sections.length) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActiveSection(entry.target.id);
                });
            },
            { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
        );
        sections.forEach((section) => observer.observe(section));
    }

    // ------------------------------------------------------------------
    // Test procedure detail view
    // ------------------------------------------------------------------
    const gridView = document.getElementById("tests-grid-view");
    const detailView = document.getElementById("test-detail-view");
    const detailArticles = Array.from(document.querySelectorAll("[data-test-detail]"));
    let lastTrigger = null;

    function openTestDetail(key, trigger) {
        const target = detailArticles.find((article) => article.dataset.testDetail === key);
        if (!target || !gridView || !detailView) return;

        detailArticles.forEach((article) => {
            article.hidden = article !== target;
        });
        lastTrigger = trigger || null;
        gridView.classList.add("hidden");
        detailView.classList.remove("hidden");

        // The grid collapses when it is hidden, so without this the reader is
        // left wherever the tapped card used to be (often below the detail).
        detailView.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
        const heading = target.querySelector("h3");
        if (heading) heading.focus({ preventScroll: true });
    }

    function closeTestDetail() {
        if (!gridView || !detailView) return;
        detailView.classList.add("hidden");
        gridView.classList.remove("hidden");

        // Return the reader (and keyboard focus) to the card they opened.
        if (lastTrigger) {
            lastTrigger.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
            lastTrigger.focus({ preventScroll: true });
        }
    }

    document.querySelectorAll("[data-test-open]").forEach((button) => {
        button.addEventListener("click", () => openTestDetail(button.dataset.testOpen, button));
    });
    document.querySelectorAll("[data-test-close]").forEach((button) => {
        button.addEventListener("click", closeTestDetail);
    });

    // ------------------------------------------------------------------
    // Digital business card (vCard 3.0)
    // ------------------------------------------------------------------
    // Built in-browser from the button's data-* attributes. VERSION 3.0 is the
    // most widely supported by Android and iOS contact apps; CHARSET=UTF-8 is
    // set explicitly on non-ASCII fields so names are not garbled.
    const vcardButton = document.getElementById("vcard-download");

    if (vcardButton) {
        vcardButton.addEventListener("click", () => {
            const d = vcardButton.dataset;
            const isWeb = location.protocol === "http:" || location.protocol === "https:";

            // ADR components: PO box; extended; street; locality; region; postal code; country
            const lines = [
                "BEGIN:VCARD",
                "VERSION:3.0",
                "N;CHARSET=UTF-8:" + d.familyName + ";" + d.givenName + ";;;",
                "FN;CHARSET=UTF-8:" + d.givenName + " " + d.familyName,
                "TITLE;CHARSET=UTF-8:" + d.title,
                "TEL;TYPE=CELL,VOICE:" + d.tel,
                "EMAIL;TYPE=INTERNET:" + d.email,
                "ADR;TYPE=WORK;CHARSET=UTF-8:;;;;" + d.region + ";;" + d.country
            ];
            if (isWeb) lines.push("URL:" + location.origin + location.pathname);
            if (d.telegram) lines.push("URL:" + d.telegram);
            lines.push("END:VCARD");

            const blob = new Blob([lines.join("\r\n")], { type: "text/vcard;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = d.fileName || "contact.vcf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Revoking synchronously can cancel the download in some browsers.
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        });
    }

    // ------------------------------------------------------------------
    // Copyright year (Solar Hijri, Persian digits) - keeps the footer current.
    // ------------------------------------------------------------------
    const yearEl = document.getElementById("copyright-year");
    if (yearEl) {
        try {
            yearEl.textContent = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric" }).format(new Date());
        } catch (error) {
            // Keep the static year from the HTML if Intl calendars are unavailable.
        }
    }
})();