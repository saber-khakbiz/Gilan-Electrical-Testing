// Software product page: renders each product in products.js as a landing
// section (hero, gallery, features, editions, delivery, requirements, FAQ).
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
    return faDigits(grouped).replace(/,/g, "٬");
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

  // ---------- normalize data (skip broken entries instead of failing) ----------
  var products = [];
  D.products.forEach(function (p, i) {
    if (!p || !str(p.id) || !str(p.name)) {
      if (window.console) console.warn("[software] product #" + (i + 1) + " skipped: it needs an id and a name");
      return;
    }
    products.push({
      id: str(p.id), name: str(p.name), tagline: str(p.tagline), summary: str(p.summary),
      platform: str(p.platform), version: str(p.version),
      shots: list(p.screenshots).filter(function (s) { return s && str(s.src); })
        .map(function (s) { return { src: str(s.src), caption: str(s.caption) }; }),
      features: list(p.features).filter(function (f) { return f && str(f.title); })
        .map(function (f) { return { title: str(f.title), text: str(f.text) }; }),
      editions: list(p.editions).filter(function (e) { return e && str(e.name); })
        .map(function (e) {
          var price = typeof e.price === "number" && isFinite(e.price) && e.price >= 0 ? e.price : null;
          return { id: str(e.id), name: str(e.name), price: price, cta: str(e.cta), highlight: !!e.highlight,
                   items: list(e.items).map(str).filter(Boolean) };
        }),
      requirements: list(p.requirements).filter(function (r) { return Array.isArray(r) && str(r[0]) && str(r[1]); }),
      faq: list(p.faq).filter(function (f) { return f && str(f.q) && str(f.a); })
    });
  });

  // ---------- pieces ----------
  function tgIcon() {
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.5 4.5L2.9 11.7c-.9.4-.9 1.6.1 1.9l4.6 1.4 1.8 5.6c.3.8 1.3 1 1.9.4l2.6-2.5 4.8 3.5c.7.5 1.7.1 1.9-.7l3.2-15.2c.2-1-.8-1.9-1.8-1.6zM9.6 14.3l8.6-6.9-6.9 8.3-.3 3.1-1.4-4.5z" fill="currentColor"/></svg>';
  }

  // A Windows-style window frame around a screenshot (or a drawn placeholder).
  function windowFrame(p, shot, opts) {
    opts = opts || {};
    var body;
    if (shot) {
      body = '<img src="' + esc(shot.src) + '" alt="' + esc(shot.caption || p.name) + '"' +
        (opts.eager ? "" : ' loading="lazy"') + ' decoding="async">';
    } else {
      body = '<div class="win-skeleton" aria-hidden="true"><span class="sk-side"></span><span class="sk-main">' +
        '<i></i><i></i><i></i><b></b><b></b><b></b></span></div>' +
        '<span class="win-soon">' + esc(t("shotSoon")) + "</span>";
    }
    return '<div class="win" dir="ltr">' +
      '<div class="win-bar"><span class="win-title"><span class="win-logo" aria-hidden="true"></span>' + esc(p.name) + "</span>" +
      '<span class="win-ctl" aria-hidden="true"><i class="c-min"></i><i class="c-max"></i><i class="c-close"></i></span></div>' +
      '<div class="win-body">' + body + "</div></div>";
  }

  function priceHtml(e) {
    if (e.price === 0) return '<span class="ed-price"><b>' + esc(t("free")) + "</b></span>";
    if (e.price == null) return '<span class="ed-price ed-ask">' + esc(t("askPrice")) + "</span>";
    return '<span class="ed-price"><b>' + money(e.price) + "</b> " + esc(t("toman")) + "</span>";
  }

  function orderUrl(p, e) {
    var text = fill(t("msgOrder"), { name: p.name, edition: e ? e.name : "" });
    return "https://t.me/" + TG + "?text=" + encodeURIComponent(text);
  }

  function orderBtn(p, e, primary) {
    return '<a class="' + (primary ? "btn" : "btn-ghost") + '" href="' + esc(orderUrl(p, e)) + '" target="_blank" rel="noopener"' +
      ' data-order="' + esc(p.id) + '" data-edition="' + esc(e ? e.id : "") + '">' + tgIcon() + esc((e && e.cta) || e.name) + "</a>";
  }

  function section(title, inner, cls) {
    return '<section class="sec ' + (cls || "") + '"><h2 class="sec-h">' + esc(title) + "</h2>" + inner + "</section>";
  }

  function productHtml(p) {
    var main = p.shots[0] || null;
    var editionsSorted = p.editions.slice().sort(function (a, b) { return (b.highlight ? 1 : 0) - (a.highlight ? 1 : 0); });

    var chips = "";
    if (p.platform) chips += '<span class="chip"><span class="chip-k">' + esc(t("platform")) + "</span>" + esc(p.platform) + "</span>";
    if (p.version) chips += '<span class="chip"><span class="chip-k">' + esc(t("version")) + '</span><span dir="ltr">' + esc(p.version) + "</span></span>";

    var hero =
      '<header class="p-hero">' +
      '<div class="p-hero-text">' +
      '<h1 class="p-name" dir="ltr">' + esc(p.name) + "</h1>" +
      (p.tagline ? '<p class="p-tagline">' + esc(p.tagline) + "</p>" : "") +
      (p.summary ? '<p class="p-summary">' + esc(p.summary) + "</p>" : "") +
      (chips ? '<div class="chips">' + chips + "</div>" : "") +
      '<div class="cta-row">' + editionsSorted.map(function (e, i) { return orderBtn(p, e, i === 0); }).join("") + "</div>" +
      '<p class="hint" data-hint="' + esc(p.id) + '" role="status" hidden>' + esc(t("sentHint")) + "</p>" +
      "</div>" +
      '<button type="button" class="p-hero-shot" data-shot="' + esc(p.id) + '" data-i="0"' + (main ? "" : " disabled") +
      ' aria-label="' + esc(t("galleryTitle")) + '">' + windowFrame(p, main, { eager: true }) + "</button>" +
      "</header>";

    var gallery = "";
    if (p.shots.length > 1) {
      gallery = section(t("galleryTitle"), '<div class="gallery">' + p.shots.map(function (s, i) {
        return '<figure><button type="button" class="shot-btn" data-shot="' + esc(p.id) + '" data-i="' + i + '">' +
          windowFrame(p, s) + "</button>" + (s.caption ? "<figcaption>" + esc(s.caption) + "</figcaption>" : "") + "</figure>";
      }).join("") + "</div>");
    }

    var features = "";
    if (p.features.length) {
      features = section(t("featuresTitle"), '<div class="features">' + p.features.map(function (f) {
        return '<div class="feature"><h3>' + esc(f.title) + "</h3>" + (f.text ? "<p>" + esc(f.text) + "</p>" : "") + "</div>";
      }).join("") + "</div>");
    }

    var editions = "";
    if (p.editions.length) {
      editions = section(t("editionsTitle"), '<div class="editions">' + p.editions.map(function (e) {
        return '<div class="edition' + (e.highlight ? " is-hl" : "") + '">' +
          (e.highlight && t("recommended") ? '<span class="ed-badge">' + esc(t("recommended")) + "</span>" : "") +
          "<h3>" + esc(e.name) + "</h3>" + priceHtml(e) +
          (e.items.length ? '<ul class="ed-list">' + e.items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
          orderBtn(p, e, e.highlight) + "</div>";
      }).join("") + "</div>");
    }

    var steps = list(UI.deliverySteps).map(str).filter(Boolean);
    var delivery = steps.length ? section(t("deliveryTitle"), '<ol class="steps">' + steps.map(function (s, i) {
      return '<li><span class="step-n">' + faDigits(i + 1) + "</span><span>" + esc(s) + "</span></li>";
    }).join("") + "</ol>" + '<p class="alt">' + esc(fill(t("altContact"), { phone: CFG.phoneDisplay || "" })) + "</p>") : "";

    var req = p.requirements.length ? section(t("requirementsTitle"), '<dl class="specs">' + p.requirements.map(function (r) {
      return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>";
    }).join("") + "</dl>") : "";

    var faq = p.faq.length ? section(t("faqTitle"), '<div class="faq">' + p.faq.map(function (f) {
      return "<details><summary>" + esc(f.q) + "</summary><p>" + esc(f.a) + "</p></details>";
    }).join("") + "</div>") : "";

    return '<article class="product" id="' + esc(p.id) + '">' + hero + gallery + features + editions + delivery + req + faq + "</article>";
  }

  root.innerHTML = products.map(productHtml).join('<hr class="sep">');

  // ---------- lightbox ----------
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbCap = document.getElementById("lbCap");
  var lbCount = document.getElementById("lbCount");
  var cur = { p: null, i: 0 };
  var byId = {};
  products.forEach(function (p) { byId[p.id] = p; });

  function showShot() {
    var s = cur.p.shots[cur.i];
    lbImg.src = s.src;
    lbImg.alt = s.caption || cur.p.name;
    lbCap.textContent = s.caption;
    lbCap.hidden = !s.caption;
    lbCount.textContent = fill(t("shotOf"), { i: faDigits(cur.i + 1), n: faDigits(cur.p.shots.length) });
    var many = cur.p.shots.length > 1;
    document.getElementById("lbPrev").hidden = !many;
    document.getElementById("lbNext").hidden = !many;
    lbCount.hidden = !many;
  }
  function openShot(pid, i) {
    var p = byId[pid];
    if (!p || !p.shots[i]) return;
    cur = { p: p, i: i };
    showShot();
    if (!lb.open) { if (typeof lb.showModal === "function") lb.showModal(); else lb.setAttribute("open", ""); }
  }
  function step(d) {
    if (!cur.p) return;
    var n = cur.p.shots.length;
    cur.i = (cur.i + d + n) % n;
    showShot();
  }
  function closeLb() { if (lb.open) { if (typeof lb.close === "function") lb.close(); else lb.removeAttribute("open"); } }

  // ---------- events ----------
  function copyText(text) {
    try { navigator.clipboard.writeText(text).then(function () {}, function () {}); } catch (e) { /* ignore */ }
  }

  document.addEventListener("click", function (e) {
    var shot = e.target.closest("[data-shot]");
    if (shot && !shot.disabled) { openShot(shot.getAttribute("data-shot"), Number(shot.getAttribute("data-i"))); return; }
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
      copyText(fill(t("msgOrder"), { name: p.name, edition: ed ? ed.name : "" }));
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
