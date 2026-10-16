// Shop behavior: data validation, category filter, product grid, product
// dialog, cart drawer and Telegram order.
// All user-visible text lives in products.js (and the static fallback in
// index.html), so this file stays ASCII-only.
(function () {
  "use strict";

  // ------------------------------------------------------------------
  // 1. Load guard: if products.js failed to parse, show the static
  //    fallback from index.html instead of a blank page.
  // ------------------------------------------------------------------
  function showLoadError(reason) {
    var errs = (window.__shopLoadErrors || []).slice();
    if (reason) errs.push(reason);
    var detail = document.getElementById("loadErrorDetail");
    if (detail) detail.textContent = errs.join("\n");
    var box = document.getElementById("loadError");
    if (box) box.hidden = false;
    ["shopMain", "cartBtn"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.hidden = true;
    });
    if (window.console) console.error("[shop] " + errs.join(" | "));
  }

  var RAW = window.SHOP_DATA;
  if (!RAW || typeof RAW !== "object") {
    showLoadError("window.SHOP_DATA is missing: products.js did not load, or it has a syntax error before the end of the file.");
    return;
  }
  if (!RAW.ui || typeof RAW.ui !== "object") {
    showLoadError('products.js has no "ui" block.');
    return;
  }
  if (!Array.isArray(RAW.products)) {
    showLoadError('products.js has no "products" list (it must be products: [ ... ]).');
    return;
  }

  var UI = RAW.ui;
  var CFG = RAW.config || {};
  var TG = typeof CFG.telegram === "string" && CFG.telegram ? CFG.telegram.replace(/^@/, "") : "saberk14z";
  var KEY_CART = "shop.cart.v1";
  var KEY_FORM = "shop.form.v1";
  var STATUSES = ["available", "made-to-order", "soon"];
  var ARTS = ["buzzer", "magnet", "generic"];

  // ------------------------------------------------------------------
  // 2. Validation: each product is checked on its own. An error hides only
  //    that product; a warning shows it with a safe default.
  // ------------------------------------------------------------------
  function str(v) { return typeof v === "string" ? v.trim() : ""; }

  function asciiDigits(s) {
    return s.replace(/[\u06F0-\u06F9]/g, function (d) { return String(d.charCodeAt(0) - 0x06F0); })
            .replace(/[\u0660-\u0669]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); });
  }

  var categories = [];
  var catById = {};
  if (RAW.categories != null && !Array.isArray(RAW.categories)) {
    if (window.console) console.warn('[shop] "categories" must be a list; ignored.');
  }
  (Array.isArray(RAW.categories) ? RAW.categories : []).forEach(function (c) {
    var id = c && str(c.id), name = c && str(c.name);
    if (id && name && !catById[id]) {
      catById[id] = { id: id, name: name };
      categories.push(catById[id]);
    }
  });

  var products = [];
  var byId = {};
  var report = [];
  var seen = {};

  RAW.products.forEach(function (raw, i) {
    var issues = [];
    function err(m) { issues.push({ level: "error", msg: m }); }
    function warn(m) { issues.push({ level: "warn", msg: m }); }

    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      err("this entry is not a product object { ... }");
      report.push({ n: i + 1, id: "", issues: issues });
      return;
    }

    var id = str(raw.id);
    if (!id) err('"id" is missing');
    else if (!/^[A-Za-z0-9_-]+$/.test(id)) err('"id" may only use English letters, digits, "-" or "_" (now: "' + id + '")');
    else if (seen[id]) err('"id" "' + id + '" is already used by product #' + seen[id]);

    var name = str(raw.name);
    if (!name) err('"name" is missing');

    var hasError = issues.some(function (x) { return x.level === "error"; });
    if (!hasError) {
      seen[id] = i + 1;

      var price = null;
      if (raw.price != null && raw.price !== "") {
        if (typeof raw.price === "number" && isFinite(raw.price) && raw.price >= 0) {
          price = raw.price;
        } else if (typeof raw.price === "string" && /^[0-9,\s\u066C]+$/.test(asciiDigits(raw.price))) {
          price = Number(asciiDigits(raw.price).replace(/[,\s\u066C]/g, ""));
          warn('"price" is text; read as ' + price + '. Write it as a plain number without quotes.');
        } else {
          warn('"price" is not a number; shown as "ask price".');
        }
      }

      var status = str(raw.status) || "available";
      if (STATUSES.indexOf(status) < 0) {
        warn('unknown "status" "' + status + '"; using "available". Allowed: ' + STATUSES.join(", "));
        status = "available";
      }

      var category = str(raw.category);
      if (category && !catById[category]) {
        warn('unknown "category" "' + category + '"; shown only under "all". Allowed: ' +
          (categories.map(function (c) { return c.id; }).join(", ") || "(no categories defined)"));
        category = "";
      } else if (!category && categories.length) {
        warn('no "category"; shown only under "all".');
      }

      var features = [];
      if (Array.isArray(raw.features)) features = raw.features.map(str).filter(Boolean);
      else if (raw.features != null) warn('"features" must be a list [ "...", "..." ]; ignored.');

      var specs = [];
      if (Array.isArray(raw.specs)) {
        raw.specs.forEach(function (row, k) {
          if (Array.isArray(row) && str(row[0]) && str(row[1])) specs.push([str(row[0]), str(row[1])]);
          else warn('"specs" row ' + (k + 1) + ' must look like [ "label", "value" ]; skipped.');
        });
      } else if (raw.specs != null) {
        warn('"specs" must be a list of [ "label", "value" ] rows; ignored.');
      }

      var art = str(raw.art) || "generic";
      if (ARTS.indexOf(art) < 0) { warn('unknown "art" "' + art + '"; using "generic".'); art = "generic"; }

      var p = {
        id: id, name: name, category: category, price: price, status: status, art: art,
        image: str(raw.image), tagline: str(raw.tagline), summary: str(raw.summary),
        howTo: str(raw.howTo), safety: str(raw.safety), features: features, specs: specs
      };
      products.push(p);
      byId[id] = p;
    }

    if (issues.length) report.push({ n: i + 1, id: id, issues: issues });
  });

  if (report.length && window.console) {
    console.warn("[shop] products.js has " + report.length + " product(s) with problems. Open #check for details.", report);
  }

  // ------------------------------------------------------------------
  // 3. Helpers
  // ------------------------------------------------------------------
  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }
  function faDigits(s) {
    return String(s).replace(/[0-9]/g, function (d) {
      return String.fromCharCode(0x06F0 + Number(d));
    });
  }
  function money(n) {
    var grouped = String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return faDigits(grouped).replace(/,/g, "\u066C");
  }
  function t(key) { return typeof UI[key] === "string" ? UI[key] : ""; }
  function fill(tpl, obj) {
    return String(tpl || "").replace(/\{(\w+)\}/g, function (_, k) { return obj[k] != null ? obj[k] : ""; });
  }
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function canOrder(p) { return p.status !== "soon"; }
  function statusText(s) { return (UI.status && UI.status[s]) || ""; }

  var cart = load(KEY_CART, {});
  if (!cart || typeof cart !== "object") cart = {};
  Object.keys(cart).forEach(function (id) {
    if (!byId[id] || !(cart[id] > 0) || !canOrder(byId[id])) delete cart[id];
  });
  var form = load(KEY_FORM, null);
  if (!form || typeof form !== "object") form = {};
  ["name", "city", "phone", "note"].forEach(function (k) { if (typeof form[k] !== "string") form[k] = ""; });

  function cartCount() {
    return Object.keys(cart).reduce(function (a, id) { return a + cart[id]; }, 0);
  }

  // ------------------------------------------------------------------
  // 4. Placeholder art and shared pieces
  // ------------------------------------------------------------------
  var ART = {
    buzzer:
      '<rect x="72" y="58" width="72" height="64" rx="12"/>' +
      '<circle cx="108" cy="90" r="17"/><circle cx="108" cy="90" r="5" class="fill"/>' +
      '<path d="M144 78h30M144 102h30" class="thick"/>' +
      '<path d="M58 74q-10 16 0 32M46 66q-16 24 0 48M34 58q-22 32 0 64" class="soft"/>',
    magnet:
      '<path d="M78 34v48a32 32 0 0 0 64 0V34" class="magnet"/>' +
      '<path d="M68 34h20M132 34h20" class="pole"/>' +
      '<rect x="103" y="118" width="14" height="18" rx="3"/>' +
      '<path d="M110 136v30" class="thick"/><ellipse cx="110" cy="152" rx="5" ry="7"/>',
    generic:
      '<rect x="82" y="30" width="76" height="122" rx="12"/>' +
      '<rect x="94" y="44" width="52" height="28" rx="4"/>' +
      '<circle cx="120" cy="108" r="20"/><path d="M120 108l10-12" class="thick"/>'
  };

  function media(p, big) {
    var status = '<span class="status status-' + esc(p.status) + '">' + esc(statusText(p.status)) + "</span>";
    var inner;
    if (p.image) {
      inner = '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async">';
    } else {
      inner = '<svg class="art" viewBox="0 0 240 180" aria-hidden="true">' + (ART[p.art] || ART.generic) + "</svg>" +
        '<span class="photo-soon">' + esc(t("photoSoon")) + "</span>";
    }
    return '<div class="media' + (big ? " media-big" : "") + '">' + inner + status + "</div>";
  }

  function priceHtml(p) {
    if (p.price == null) return '<span class="price price-ask">' + esc(t("askPrice")) + "</span>";
    return '<span class="price"><b>' + money(p.price) + "</b> " + esc(t("toman")) + "</span>";
  }

  function addLabel(p) {
    if (!canOrder(p)) return esc(t("notAvailable"));
    var q = cart[p.id] || 0;
    return q > 0 ? esc(fill(t("inCart"), { q: faDigits(q) })) : esc(t("add"));
  }

  function addButton(p) {
    var inCart = (cart[p.id] || 0) > 0;
    return '<button type="button" class="btn-add' + (inCart ? " is-in" : "") + '" data-add="' + esc(p.id) + '"' +
      (canOrder(p) ? "" : " disabled") + ">" + addLabel(p) + "</button>";
  }

  function listHtml(items) {
    return '<ul class="p-feat">' + items.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>";
  }

  function tgIcon() {
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.5 4.5L2.9 11.7c-.9.4-.9 1.6.1 1.9l4.6 1.4 1.8 5.6c.3.8 1.3 1 1.9.4l2.6-2.5 4.8 3.5c.7.5 1.7.1 1.9-.7l3.2-15.2c.2-1-.8-1.9-1.8-1.6zM9.6 14.3l8.6-6.9-6.9 8.3-.3 3.1-1.4-4.5z" fill="currentColor"/></svg>';
  }

  // ------------------------------------------------------------------
  // 5. Category filter
  // ------------------------------------------------------------------
  var filterBar = document.getElementById("filters");
  var activeCat = "";

  function usedCategories() {
    return categories.filter(function (c) {
      return products.some(function (p) { return p.category === c.id; });
    });
  }

  function renderFilters() {
    var used = usedCategories();
    if (used.length < 2) { filterBar.hidden = true; activeCat = ""; return; }
    if (activeCat && !used.some(function (c) { return c.id === activeCat; })) activeCat = "";
    filterBar.hidden = false;
    filterBar.setAttribute("aria-label", t("filterLabel"));
    var chips = [{ id: "", name: t("filterAll"), n: products.length }].concat(used.map(function (c) {
      return { id: c.id, name: c.name, n: products.filter(function (p) { return p.category === c.id; }).length };
    }));
    filterBar.innerHTML = chips.map(function (c) {
      var on = c.id === activeCat;
      return '<button type="button" class="chip' + (on ? " is-on" : "") + '" data-cat="' + esc(c.id) + '" aria-pressed="' + on + '">' +
        esc(c.name) + ' <span class="chip-n">' + faDigits(c.n) + "</span></button>";
    }).join("");
  }

  function setCategory(id, fromHash) {
    activeCat = catById[id] ? id : "";
    renderFilters();
    renderGrid();
    if (!fromHash) {
      try {
        history.replaceState(null, "", location.pathname + location.search + (activeCat ? "#c-" + activeCat : ""));
      } catch (e) { /* ignore */ }
    }
  }

  // ------------------------------------------------------------------
  // 6. Product grid
  // ------------------------------------------------------------------
  var grid = document.getElementById("grid");

  function renderGrid() {
    var list = activeCat ? products.filter(function (p) { return p.category === activeCat; }) : products;
    var cards = list.map(function (p) {
      return '<article class="product" id="card-' + esc(p.id) + '">' +
        '<a class="media-link" href="#p-' + esc(p.id) + '" aria-label="' + esc(t("details") + ": " + p.name) + '">' + media(p, false) + "</a>" +
        '<div class="p-body">' +
        '<h2><a href="#p-' + esc(p.id) + '">' + esc(p.name) + "</a></h2>" +
        (p.tagline ? '<p class="p-tag">' + esc(p.tagline) + "</p>" : "") +
        (p.features.length ? listHtml(p.features) : "") +
        '<div class="p-foot">' + priceHtml(p) + addButton(p) + "</div>" +
        "</div></article>";
    }).join("");

    if (!list.length) cards = '<p class="empty-cat">' + esc(t("emptyCat")) + "</p>";

    var ask = '<aside class="ask">' +
      "<h2>" + esc(t("askTitle")) + "</h2><p>" + esc(t("askText")) + "</p>" +
      '<a class="btn-ghost" href="https://t.me/' + esc(TG) + '" target="_blank" rel="noopener">' + tgIcon() + esc(t("askBtn")) + "</a>" +
      "</aside>";

    grid.innerHTML = cards + ask;
  }

  // ------------------------------------------------------------------
  // 7. Product dialog
  // ------------------------------------------------------------------
  var dlg = document.getElementById("productDialog");
  var dlgBody = document.getElementById("dialogBody");
  var openId = null;

  function renderDialog(p) {
    var specs = p.specs.map(function (s) {
      return "<div><dt>" + esc(s[0]) + "</dt><dd>" + esc(s[1]) + "</dd></div>";
    }).join("");
    dlgBody.innerHTML =
      media(p, true) +
      '<div class="d-body">' +
      '<h2 id="dialogTitle">' + esc(p.name) + "</h2>" +
      (p.tagline ? '<p class="p-tag">' + esc(p.tagline) + "</p>" : "") +
      '<div class="d-buy">' + priceHtml(p) + addButton(p) + "</div>" +
      (p.summary ? '<p class="d-summary">' + esc(p.summary) + "</p>" : "") +
      (p.howTo ? "<h3>" + esc(t("howTo")) + "</h3><p>" + esc(p.howTo) + "</p>" : "") +
      (p.features.length ? "<h3>" + esc(t("features")) + "</h3>" + listHtml(p.features) : "") +
      (specs ? "<h3>" + esc(t("specs")) + '</h3><dl class="specs">' + specs + "</dl>" : "") +
      (p.safety ? '<div class="safety"><span class="safety-k">' + esc(t("safety")) + "</span><p>" + esc(p.safety) + "</p></div>" : "") +
      '<button type="button" class="linkbtn" data-share="' + esc(p.id) + '">' + esc(t("shareCopy")) + "</button>" +
      "</div>";
  }

  function clearProductHash() {
    if (/^#p-/.test(location.hash)) {
      try {
        history.replaceState(null, "", location.pathname + location.search + (activeCat ? "#c-" + activeCat : ""));
      } catch (e) { /* ignore */ }
    }
  }

  function openProduct(id) {
    var p = byId[id];
    if (!p) return;
    openId = id;
    renderDialog(p);
    if (!dlg.open) {
      if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    }
    dlg.scrollTop = 0;
  }

  function closeProduct() {
    openId = null;
    if (dlg.open) {
      if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open");
    }
    clearProductHash();
  }

  dlg.addEventListener("close", function () { openId = null; clearProductHash(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) closeProduct(); });

  // ------------------------------------------------------------------
  // 8. Data check view (#check)
  // ------------------------------------------------------------------
  var checkBox = document.getElementById("check");

  function renderCheck() {
    var errors = report.filter(function (r) { return r.issues.some(function (x) { return x.level === "error"; }); }).length;
    var warns = report.length - errors;
    var head = "<h2>" + esc(t("checkTitle")) + "</h2>";
    if (!report.length) {
      checkBox.innerHTML = head + '<p class="check-ok">' + esc(fill(t("checkOk"), { n: faDigits(products.length) })) + "</p>";
      return;
    }
    var items = report.map(function (r) {
      var isErr = r.issues.some(function (x) { return x.level === "error"; });
      return '<li class="' + (isErr ? "is-err" : "is-warn") + '">' +
        '<div class="check-h"><b>' + esc(fill(t("checkItem"), { n: faDigits(r.n) })) + "</b>" +
        (r.id ? ' <code dir="ltr">' + esc(r.id) + "</code>" : "") +
        ' <span class="check-tag">' + esc(isErr ? t("checkError") : t("checkWarn")) + "</span></div>" +
        '<ul dir="ltr">' + r.issues.map(function (x) { return "<li>" + esc(x.msg) + "</li>"; }).join("") + "</ul></li>";
    }).join("");
    checkBox.innerHTML = head +
      "<p>" + esc(fill(t("checkSummary"), { shown: faDigits(products.length), e: faDigits(errors), w: faDigits(warns) })) + "</p>" +
      '<ol class="check-list">' + items + "</ol>" +
      '<p class="check-hint">' + esc(t("checkHint")) + "</p>";
  }

  // ------------------------------------------------------------------
  // 9. Hash routing: #p-<id> product, #c-<id> category, #check report
  // ------------------------------------------------------------------
  function routeHash() {
    var h = location.hash;
    checkBox.hidden = h !== "#check";
    if (h === "#check") { renderCheck(); checkBox.scrollIntoView(); }
    var c = /^#c-([A-Za-z0-9_-]+)$/.exec(h);
    if (c) setCategory(c[1], true);
    var m = /^#p-([A-Za-z0-9_-]+)$/.exec(h);
    if (m && byId[m[1]]) openProduct(m[1]);
    else if (dlg.open) closeProduct();
  }

  // ------------------------------------------------------------------
  // 10. Cart drawer and order message
  // ------------------------------------------------------------------
  var drawer = document.getElementById("cart");
  var cartList = document.getElementById("cartList");
  var cartSum = document.getElementById("cartSum");
  var cartBadge = document.getElementById("cartBadge");
  var orderForm = document.getElementById("orderForm");
  var sendBtn = document.getElementById("sendTg");
  var preview = document.getElementById("orderPreview");
  var formMsg = document.getElementById("formMsg");

  function buildMessage() {
    var lines = [t("msgHello"), ""];
    var total = 0, ask = 0, i = 0;
    products.forEach(function (p) {
      var q = cart[p.id];
      if (!q) return;
      i++;
      var line = fill(t("msgLine"), { i: faDigits(i), name: p.name, q: faDigits(q) });
      if (p.price != null) {
        total += p.price * q;
        line += fill(t("msgPrice"), { p: money(p.price * q) });
      } else {
        ask++;
      }
      lines.push(line);
    });
    lines.push("");
    if (total > 0) lines.push(fill(t("msgTotal"), { p: money(total) }));
    if (ask > 0) lines.push(fill(t("msgAsk"), { n: faDigits(ask) }));
    if (form.name) lines.push(fill(t("msgName"), { v: form.name }));
    if (form.city) lines.push(fill(t("msgCity"), { v: form.city }));
    if (form.phone) lines.push(fill(t("msgPhone"), { v: form.phone }));
    if (form.note) lines.push(fill(t("msgNote"), { v: form.note }));
    return lines.join("\n");
  }

  function tgUrl() {
    return "https://t.me/" + TG + "?text=" + encodeURIComponent(buildMessage());
  }

  function refreshOrder() {
    sendBtn.href = tgUrl();
    preview.textContent = buildMessage();
  }

  function renderCart() {
    var items = products.filter(function (p) { return cart[p.id]; });
    var count = cartCount();
    cartBadge.textContent = faDigits(count);
    cartBadge.hidden = count === 0;

    if (!items.length) {
      cartList.innerHTML = '<p class="cart-empty">' + esc(t("cartEmpty")) + "</p>";
      cartSum.innerHTML = "";
      orderForm.hidden = true;
      return;
    }
    orderForm.hidden = false;

    var total = 0, ask = 0;
    cartList.innerHTML = items.map(function (p) {
      var q = cart[p.id];
      if (p.price != null) total += p.price * q; else ask++;
      return '<div class="line">' +
        '<div class="line-info"><a href="#p-' + esc(p.id) + '" class="line-name">' + esc(p.name) + "</a>" + priceHtml(p) + "</div>" +
        '<div class="stepper" role="group" aria-label="' + esc(t("qty")) + '">' +
        '<button type="button" data-step="' + esc(p.id) + '" data-d="1" aria-label="+">+</button>' +
        '<output aria-live="polite">' + faDigits(q) + "</output>" +
        '<button type="button" data-step="' + esc(p.id) + '" data-d="-1" aria-label="-">\u2212</button>' +
        "</div>" +
        '<button type="button" class="line-rm" data-rm="' + esc(p.id) + '">' + esc(t("remove")) + "</button>" +
        "</div>";
    }).join("");

    var sum = "";
    if (total > 0) sum += '<div class="sum-row"><span>' + esc(t("subtotal")) + "</span><b>" + money(total) + " " + esc(t("toman")) + "</b></div>";
    if (ask > 0) sum += '<p class="sum-ask">' + esc(fill(t("subtotalAsk"), { n: faDigits(ask) })) + "</p>";
    cartSum.innerHTML = sum;
    refreshOrder();
  }

  function setQty(id, q) {
    if (!byId[id]) return;
    if (q <= 0) delete cart[id]; else cart[id] = Math.min(q, 99);
    save(KEY_CART, cart);
    renderCart();
    renderGrid();
    if (openId) renderDialog(byId[openId]);
  }

  var lastFocus = null;
  function openCart(open) {
    if (open) {
      lastFocus = document.activeElement;
      if (dlg.open) closeProduct();
      renderCart();
    }
    drawer.hidden = !open;
    document.body.classList.toggle("no-scroll", open);
    document.getElementById("cartBtn").setAttribute("aria-expanded", String(open));
    if (open) document.getElementById("cartClose").focus();
    else if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  ["name", "city", "phone", "note"].forEach(function (k) {
    var el = document.getElementById("f-" + k);
    el.value = form[k];
    el.addEventListener("input", function () {
      form[k] = el.value.trim();
      save(KEY_FORM, form);
      if (k === "name" && form.name) formMsg.hidden = true;
      refreshOrder();
    });
  });

  // ------------------------------------------------------------------
  // 11. Clipboard and toast
  // ------------------------------------------------------------------
  var toastEl = document.getElementById("toast");
  var toastTimer = null;
  function toast(text) {
    toastEl.textContent = text;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2600);
  }

  function copyText(text, onOk, onFail) {
    try {
      navigator.clipboard.writeText(text).then(onOk, onFail);
    } catch (e) { onFail(); }
  }

  function selectNode(node) {
    try {
      var r = document.createRange();
      r.selectNodeContents(node);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
    } catch (e) { /* ignore */ }
  }

  // ------------------------------------------------------------------
  // 12. Events
  // ------------------------------------------------------------------
  document.addEventListener("click", function (e) {
    var el = e.target;

    var chip = el.closest("[data-cat]");
    if (chip) { setCategory(chip.getAttribute("data-cat"), false); return; }

    var add = el.closest("[data-add]");
    if (add && !add.disabled) {
      var p = byId[add.getAttribute("data-add")];
      if (!p) return;
      setQty(p.id, (cart[p.id] || 0) + 1);
      toast(fill(t("addedToast"), { name: p.name }));
      return;
    }

    var step = el.closest("[data-step]");
    if (step) {
      var sid = step.getAttribute("data-step");
      setQty(sid, (cart[sid] || 0) + Number(step.getAttribute("data-d")));
      return;
    }

    var rm = el.closest("[data-rm]");
    if (rm) { setQty(rm.getAttribute("data-rm"), 0); return; }

    var share = el.closest("[data-share]");
    if (share) {
      var url = location.href.split("#")[0] + "#p-" + share.getAttribute("data-share");
      copyText(url, function () { toast(t("shareCopied")); }, function () { toast(url); });
      return;
    }

    if (el.closest("#cartBtn")) { openCart(true); return; }
    if (el.closest("[data-cart-close]")) { openCart(false); return; }
    if (el.closest("[data-dialog-close]")) { closeProduct(); return; }

    // A product link inside the cart: close the cart; the hash route opens the dialog.
    if (el.closest("#cart a[href^='#p-']")) { openCart(false); }

    if (el.closest("#copyOrder")) {
      copyText(buildMessage(), function () { toast(t("copiedOrder")); }, function () {
        document.getElementById("previewBox").open = true;
        selectNode(preview);
        toast(fill(t("copyFallback"), { tg: TG }));
      });
      return;
    }

    if (el.closest("#sendTg")) {
      if (!form.name) {
        e.preventDefault();
        formMsg.hidden = false;
        document.getElementById("f-name").focus();
        return;
      }
      refreshOrder();
      // Copy as a backup in case the Telegram client ignores the draft text.
      copyText(buildMessage(), function () {}, function () {});
      document.getElementById("sentHint").hidden = false;
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !drawer.hidden) openCart(false);
  });

  window.addEventListener("hashchange", routeHash);

  // ------------------------------------------------------------------
  // 13. Static text (index.html holds defaults; products.js may override)
  // ------------------------------------------------------------------
  function setText(id, text) {
    var node = document.getElementById(id);
    if (node && text) node.textContent = text;
  }
  setText("brandSub", t("brandSub"));
  setText("backText", t("back"));
  setText("cartText", t("cart"));
  setText("heroEyebrow", t("heroEyebrow"));
  setText("heroTitle", t("heroTitle"));
  setText("heroLead", t("heroLead"));
  setText("stepsTitle", t("stepsTitle"));
  setText("cartTitle", t("cartTitle"));
  setText("formTitle", t("formTitle"));
  setText("l-name", t("fName"));
  setText("l-city", t("fCity"));
  setText("l-phone", t("fPhone"));
  setText("l-note", t("fNote"));
  setText("formMsg", t("needName"));
  setText("sendText", t("sendTg"));
  setText("copyOrder", t("copyOrder"));
  setText("previewLabel", t("preview"));
  setText("sentHint", t("sentHint"));
  setText("altContact", fill(t("altContact"), { phone: CFG.phoneDisplay || "" }));
  setText("footText", t("footer"));
  var steps = Array.isArray(UI.steps) ? UI.steps : [];
  document.getElementById("steps").innerHTML = steps.map(function (s, i) {
    return '<li><span class="step-n">' + faDigits(i + 1) + "</span><span>" + esc(s) + "</span></li>";
  }).join("");
  document.getElementById("stepsWrap").hidden = !steps.length;
  document.getElementById("cartClose").setAttribute("aria-label", t("close"));
  document.getElementById("dialogClose").setAttribute("aria-label", t("close"));

  renderFilters();
  renderGrid();
  renderCart();
  routeHash();
})();
