// Software product page: renders each product in products.js as a landing
// section (hero, key numbers, gallery, how it works, features, security,
// editions, delivery, requirements, FAQ). Sections without data are skipped.
// All user-visible text lives in products.js, so this file stays ASCII-only.
(function () {
  "use strict";

  var root = document.getElementById("software");
  var D = window.SOFTWARE_DATA;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function str(v) { return typeof v === "string" ? v.trim() : ""; }
  function list(v) { return Array.isArray(v) ? v : []; }
  function faDigits(s) {
    return String(s).replace(/[0-9]/g, function (d) { return String.fromCharCode(0x06F0 + Number(d)); });
  }
  function money(n) {
    var grouped = String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return faDigits(grouped).replace(/,/g, "\u066C");
  }
  function fill(tpl, obj) {
    return String(tpl || "").replace(/\{(\w+)\}/g, function (_, k) { return obj[k] != null ? obj[k] : ""; });
  }

  if (!D || typeof D !== "object" || !Array.isArray(D.products)) {
    root.innerHTML = '<p class="load-error">' + esc(fill(
      (D && D.ui && D.ui.loadError) || root.getAttribute("data-load-error") || "", { tg: "saberk14z" })) + "</p>";
    if (window.console) console.error("[software] window.SOFTWARE_DATA is missing or has no products list; check software/products.js");
    return;
  }

  var UI = D.ui || {};
  var CFG = D.config || {};
  var TG = str(CFG.telegram).replace(/^@/, "") || "saberk14z";
  function t(k) { return typeof UI[k] === "string" ? UI[k] : ""; }
  var TONES = ["locked", "open", "done", "warn", "bad"];
  function tone(v) { return TONES.indexOf(v) >= 0 ? v : "locked"; }

  // ---------- normalize data (skip broken entries instead of failing) ----------
  var products = [];
  D.products.forEach(function (p, i) {
    if (!p || !str(p.id) || !str(p.name)) {
      if (window.console) console.warn("[software] product #" + (i + 1) + " skipped: it needs an id and a name");
      return;
    }
    var tl = p.timeline && typeof p.timeline === "object" ? p.timeline : null;
    var sec = p.security && typeof p.security === "object" ? p.security : null;
    products.push({
      id: str(p.id), name: str(p.name), tagline: str(p.tagline), summary: str(p.summary),
      platform: str(p.platform), version: str(p.version),
      stats: list(p.stats).filter(function (s) { return s && str(s.value) && str(s.label); }),
      shots: list(p.screenshots).filter(function (s) { return s && str(s.src); })
        .map(function (s) { return { src: str(s.src), caption: str(s.caption), bare: !!s.bare, failed: false }; }),
      banner: p.banner && str(p.banner.src) ? { src: str(p.banner.src), alt: str(p.banner.alt) } : null,
      timeline: tl && list(tl.phases).length ? {
        title: str(tl.title), text: str(tl.text), fork: str(tl.fork), note: str(tl.note),
        phases: list(tl.phases).filter(function (x) { return x && str(x.name); }),
        results: list(tl.results).filter(function (x) { return x && str(x.name); })
      } : null,
      features: list(p.features).filter(function (f) { return f && str(f.title); })
        .map(function (f) { return { title: str(f.title), text: str(f.text), points: list(f.points).map(str).filter(Boolean) }; }),
      security: sec && list(sec.rows).length ? {
        title: str(sec.title), note: str(sec.note),
        rows: list(sec.rows).filter(function (r) { return Array.isArray(r) && str(r[0]) && str(r[1]); })
      } : null,
      editions: list(p.editions).filter(function (e) { return e && str(e.name); })
        .map(function (e) {
          var price = typeof e.price === "number" && isFinite(e.price) && e.price >= 0 ? e.price : null;
          return { id: str(e.id), name: str(e.name), price: price, priceNote: str(e.priceNote), cta: str(e.cta),
                   highlight: !!e.highlight, items: list(e.items).map(str).filter(Boolean) };
        }),
      delivery: list(p.delivery).map(str).filter(Boolean),
      requirements: list(p.requirements).filter(function (r) { return Array.isArray(r) && str(r[0]) && str(r[1]); }),
      faq: list(p.faq).filter(function (f) { return f && str(f.q) && str(f.a); })
    });
  });
  var byId = {};
  products.forEach(function (p) { byId[p.id] = p; });

  // ---------- pieces ----------
  function tgIcon() {
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.5 4.5L2.9 11.7c-.9.4-.9 1.6.1 1.9l4.6 1.4 1.8 5.6c.3.8 1.3 1 1.9.4l2.6-2.5 4.8 3.5c.7.5 1.7.1 1.9-.7l3.2-15.2c.2-1-.8-1.9-1.8-1.6zM9.6 14.3l8.6-6.9-6.9 8.3-.3 3.1-1.4-4.5z" fill="currentColor"/></svg>';
  }

  // Drawn stand-in for a screenshot: a Windows-style window with a skeleton UI.
  function placeholder(p) {
    return '<div class="win" dir="ltr">' +
      '<div class="win-bar"><span class="win-title"><span class="win-logo" aria-hidden="true"></span>' + esc(p.name) + "</span>" +
      '<span class="win-ctl" aria-hidden="true"><i class="c-min"></i><i class="c-max"></i><i class="c-close"></i></span></div>' +
      '<div class="win-body"><div class="win-skeleton" aria-hidden="true"><span class="sk-side"></span><span class="sk-main">' +
      '<i></i><i></i><i></i><b></b><b></b><b></b></span></div>' +
      '<span class="win-soon">' + esc(t("shotSoon")) + "</span></div></div>";
  }

  function priceHtml(e) {
    var note = e.priceNote ? ' <span class="ed-note">' + esc(e.priceNote) + "</span>" : "";
    if (e.price === 0) return '<span class="ed-price"><b>' + esc(t("free")) + "</b>" + note + "</span>";
    if (e.price == null) return '<span class="ed-price ed-ask">' + esc(t("askPrice")) + note + "</span>";
    return '<span class="ed-price"><b>' + money(e.price) + "</b> " + esc(t("toman")) + note + "</span>";
  }

  function orderText(p, e) { return fill(t("msgOrder"), { name: p.name, edition: e ? e.name : "" }); }

  function orderBtn(p, e, primary) {
    return '<a class="' + (primary ? "btn" : "btn-ghost") + '" href="' +
      esc("https://t.me/" + TG + "?text=" + encodeURIComponent(orderText(p, e))) + '" target="_blank" rel="noopener"' +
      ' data-order="' + esc(p.id) + '" data-edition="' + esc(e.id) + '">' + tgIcon() + esc(e.cta || e.name) + "</a>";
  }

  function section(title, inner, cls) {
    return '<section class="sec ' + (cls || "") + '">' + (title ? '<h2 class="sec-h">' + esc(title) + "</h2>" : "") + inner + "</section>";
  }

  // ---------- one product ----------
  function productHtml(p) {
    var main = p.shots[0] || null;
    var eds = p.editions.slice().sort(function (a, b) { return (b.highlight ? 1 : 0) - (a.highlight ? 1 : 0); });

    var chips = "";
    if (p.platform) chips += '<span class="chip"><span class="chip-k">' + esc(t("platform")) + "</span>" + esc(p.platform) + "</span>";
    if (p.version) chips += '<span class="chip"><span class="chip-k">' + esc(t("version")) + '</span><bdi dir="ltr">' + esc(p.version) + "</bdi></span>";

    var heroShot = main
      ? '<button type="button" class="p-hero-shot' + (main.bare ? " is-bare" : "") + '" data-shot="' + esc(p.id) + '" data-i="0" aria-label="' + esc(t("galleryTitle")) + '">' +
        '<img class="shot-img" src="' + esc(main.src) + '" alt="' + esc(main.caption || p.name) + '" decoding="async" data-pid="' + esc(p.id) + '" data-k="0" data-hero="1"></button>' +
        '<div class="p-hero-ph" hidden>' + placeholder(p) + "</div>"
      : '<div class="p-hero-ph">' + placeholder(p) + "</div>";

    // Optional wide cover. The text name stays in the page for screen readers
    // and search engines, and is shown again if the banner file is missing.
    var banner = p.banner
      ? '<figure class="p-banner"><img src="' + esc(p.banner.src) + '" alt="' + esc(p.banner.alt || p.name) +
        '" decoding="async" data-banner="' + esc(p.id) + '"></figure>'
      : "";

    var hero =
      '<header class="p-hero">' +
      '<div class="p-hero-text">' +
      '<h1 class="p-name" dir="ltr">' + esc(p.name) + "</h1>" +
      (p.tagline ? '<p class="p-tagline">' + esc(p.tagline) + "</p>" : "") +
      (p.summary ? '<p class="p-summary">' + esc(p.summary) + "</p>" : "") +
      (chips ? '<div class="chips">' + chips + "</div>" : "") +
      (eds.length ? '<div class="cta-row">' + eds.map(function (e, i) { return orderBtn(p, e, i === 0); }).join("") + "</div>" : "") +
      '<p class="hint" data-hint="' + esc(p.id) + '" role="status" hidden>' + esc(t("sentHint")) + "</p>" +
      "</div>" +
      '<div class="p-hero-media">' + heroShot + "</div>" +
      "</header>";

    var stats = p.stats.length ? '<div class="stats">' + p.stats.map(function (s) {
      return '<div class="stat"><b dir="ltr">' + esc(s.value) + "</b><span>" + esc(s.label) + "</span></div>";
    }).join("") + "</div>" : "";

    var gallery = "";
    if (p.shots.length > 1) {
      gallery = section(t("galleryTitle"), '<div class="gallery">' + p.shots.map(function (s, i) {
        if (i === 0) return "";
        return '<figure data-fig="' + i + '"><button type="button" class="shot-btn" data-shot="' + esc(p.id) + '" data-i="' + i + '">' +
          '<img class="shot-img" src="' + esc(s.src) + '" alt="' + esc(s.caption || p.name) + '" loading="lazy" decoding="async" data-pid="' +
          esc(p.id) + '" data-k="' + i + '"></button>' + (s.caption ? "<figcaption>" + esc(s.caption) + "</figcaption>" : "") + "</figure>";
      }).join("") + "</div>", "sec-gallery");
    }

    var timeline = "";
    if (p.timeline) {
      var tl = p.timeline;
      timeline = section(tl.title,
        (tl.text ? '<p class="sec-lead">' + esc(tl.text) + "</p>" : "") +
        '<div class="tl">' +
        '<div class="tl-track">' + tl.phases.map(function (x) {
          return '<div class="tl-phase tone-' + tone(x.tone) + '">' +
            (str(x.time) ? '<span class="tl-time" dir="ltr">' + esc(x.time) + "</span>" : "") +
            "<b>" + esc(x.name) + "</b>" + (str(x.note) ? "<small>" + esc(x.note) + "</small>" : "") +
            (tone(x.tone) === "open" ? '<span class="tl-sweep" aria-hidden="true"></span>' : "") + "</div>";
        }).join("") + "</div>" +
        (tl.results.length ? '<div class="tl-fork">' + (tl.fork ? "<span>" + esc(tl.fork) + "</span>" : "") +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
          '<div class="tl-results">' + tl.results.map(function (x) {
            return '<div class="tl-res tone-' + tone(x.tone) + '"><b>' + esc(x.name) + "</b>" + (str(x.note) ? "<small>" + esc(x.note) + "</small>" : "") + "</div>";
          }).join("") + "</div>" : "") +
        "</div>" +
        (tl.note ? '<p class="sec-note">' + esc(tl.note) + "</p>" : ""), "sec-tl");
    }

    var features = p.features.length ? section(t("featuresTitle"), '<div class="features">' + p.features.map(function (f) {
      return '<div class="feature"><h3>' + esc(f.title) + "</h3>" + (f.text ? "<p>" + esc(f.text) + "</p>" : "") +
        (f.points.length ? "<ul>" + f.points.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") + "</div>";
    }).join("") + "</div>") : "";

    var security = "";
    if (p.security) {
      security = section(p.security.title,
        '<div class="threats"><div class="th-head" aria-hidden="true"><span>' + esc(t("threat")) + "</span><span>" + esc(t("defence")) + "</span></div>" +
        p.security.rows.map(function (r) {
          return '<div class="th-row"><b>' + esc(r[0]) + "</b><p>" + esc(r[1]) + "</p></div>";
        }).join("") + "</div>" +
        (p.security.note ? '<p class="sec-note">' + esc(p.security.note) + "</p>" : ""));
    }

    var editions = p.editions.length ? section(t("editionsTitle"), '<div class="editions">' + p.editions.map(function (e) {
      return '<div class="edition' + (e.highlight ? " is-hl" : "") + '">' +
        (e.highlight && t("recommended") ? '<span class="ed-badge">' + esc(t("recommended")) + "</span>" : "") +
        "<h3>" + esc(e.name) + "</h3>" + priceHtml(e) +
        (e.items.length ? '<ul class="ed-list">' + e.items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
        orderBtn(p, e, e.highlight) + "</div>";
    }).join("") + "</div>", "sec-editions") : "";

    var steps = p.delivery.length ? p.delivery : list(UI.deliverySteps).map(str).filter(Boolean);
    var delivery = steps.length ? section(t("deliveryTitle"), '<ol class="steps">' + steps.map(function (s, i) {
      return '<li><span class="step-n">' + faDigits(i + 1) + "</span><span>" + esc(s) + "</span></li>";
    }).join("") + "</ol>" + '<p class="alt">' + esc(fill(t("altContact"), { phone: CFG.phoneDisplay || "" })) + "</p>") : "";

    var req = p.requirements.length ? section(t("requirementsTitle"), '<dl class="specs">' + p.requirements.map(function (r) {
      return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>";
    }).join("") + "</dl>") : "";

    var faq = p.faq.length ? section(t("faqTitle"), '<div class="faq">' + p.faq.map(function (f) {
      return "<details><summary>" + esc(f.q) + "</summary><p>" + esc(f.a) + "</p></details>";
    }).join("") + "</div>") : "";

    return '<article class="product" id="' + esc(p.id) + '">' + banner + hero + stats + gallery + timeline + features + security +
      editions + delivery + req + faq + "</article>";
  }

  root.innerHTML = products.map(productHtml).join('<hr class="sep">');

  // ---------- screenshots that are not on the server yet ----------
  // Image errors do not bubble, so listen in the capture phase. A missing file
  // hides its thumbnail (or swaps the hero to the drawn placeholder) and is
  // skipped by the lightbox.
  document.addEventListener("load", function (e) {
    var img = e.target;
    if (img && img.tagName === "IMG" && img.hasAttribute("data-banner")) img.closest(".product").classList.add("has-banner");
  }, true);

  document.addEventListener("error", function (e) {
    var img = e.target;
    if (img && img.tagName === "IMG" && img.hasAttribute("data-banner")) { img.closest(".p-banner").hidden = true; return; }
    if (!img || img.tagName !== "IMG" || !img.hasAttribute("data-pid")) return;
    var p = byId[img.getAttribute("data-pid")];
    var k = Number(img.getAttribute("data-k"));
    if (p && p.shots[k]) p.shots[k].failed = true;
    if (img.hasAttribute("data-hero")) {
      var media = img.closest(".p-hero-media");
      img.closest(".p-hero-shot").hidden = true;
      media.querySelector(".p-hero-ph").hidden = false;
    } else {
      var fig = img.closest("figure");
      if (fig) fig.hidden = true;
      var sec = img.closest(".sec-gallery");
      if (sec && !sec.querySelector("figure:not([hidden])")) sec.hidden = true;
    }
  }, true);

  // ---------- lightbox ----------
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbCap = document.getElementById("lbCap");
  var lbCount = document.getElementById("lbCount");
  var cur = { p: null, k: 0 };

  function visible(p) {
    var out = [];
    p.shots.forEach(function (s, k) { if (!s.failed) out.push(k); });
    return out;
  }
  function showShot() {
    var s = cur.p.shots[cur.k];
    var vis = visible(cur.p);
    lbImg.src = s.src;
    lbImg.classList.toggle("is-bare", s.bare);
    lbImg.alt = s.caption || cur.p.name;
    lbCap.textContent = s.caption;
    lbCap.hidden = !s.caption;
    lbCount.textContent = fill(t("shotOf"), { i: faDigits(vis.indexOf(cur.k) + 1), n: faDigits(vis.length) });
    var many = vis.length > 1;
    document.getElementById("lbPrev").hidden = !many;
    document.getElementById("lbNext").hidden = !many;
    lbCount.hidden = !many;
  }
  function openShot(pid, k) {
    var p = byId[pid];
    if (!p || !p.shots[k] || p.shots[k].failed) return;
    cur = { p: p, k: k };
    showShot();
    if (!lb.open) { if (typeof lb.showModal === "function") lb.showModal(); else lb.setAttribute("open", ""); }
  }
  function step(d) {
    if (!cur.p) return;
    var vis = visible(cur.p);
    if (!vis.length) return;
    var pos = vis.indexOf(cur.k);
    cur.k = vis[(pos + d + vis.length) % vis.length];
    showShot();
  }
  function closeLb() { if (lb.open) { if (typeof lb.close === "function") lb.close(); else lb.removeAttribute("open"); } }

  // ---------- events ----------
  function copyText(text) {
    try { navigator.clipboard.writeText(text).then(function () {}, function () {}); } catch (e) { /* ignore */ }
  }

  document.addEventListener("click", function (e) {
    var shot = e.target.closest("[data-shot]");
    if (shot) { openShot(shot.getAttribute("data-shot"), Number(shot.getAttribute("data-i"))); return; }
    // RTL: "previous" sits on the right and "next" on the left.
    if (e.target.closest("#lbPrev")) { step(-1); return; }
    if (e.target.closest("#lbNext")) { step(1); return; }
    if (e.target.closest("[data-lb-close]") || e.target === lb) { closeLb(); return; }

    var order = e.target.closest("[data-order]");
    if (order) {
      var p = byId[order.getAttribute("data-order")];
      var ed = null;
      p.editions.forEach(function (x) { if (x.id === order.getAttribute("data-edition")) ed = x; });
      // Copy as a backup in case the Telegram client ignores the draft text.
      copyText(orderText(p, ed));
      var hint = document.querySelector('[data-hint="' + p.id + '"]');
      if (hint) hint.hidden = false;
    }
  });

  document.addEventListener("keydown", function (e) {
    if (!lb.open) return;
    if (e.key === "ArrowLeft") step(1);
    else if (e.key === "ArrowRight") step(-1);
  });

  // ---------- static text ----------
  function setText(id, text) { var n = document.getElementById(id); if (n && text) n.textContent = text; }
  setText("brandSub", t("brandSub"));
  setText("backText", t("back"));
  setText("footText", t("footer"));
  document.getElementById("lbPrev").setAttribute("aria-label", t("prev"));
  document.getElementById("lbNext").setAttribute("aria-label", t("next"));
  document.querySelector("[data-lb-close]").setAttribute("aria-label", t("close"));

  if (location.hash && byId[location.hash.slice(1)]) {
    var target = document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView();
  }
})();
