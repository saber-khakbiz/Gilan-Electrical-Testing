// Shop behavior: product grid, product dialog, cart drawer and Telegram order.
// All user-visible text lives in products.js, so this file stays ASCII-only.
(function () {
  "use strict";

  var D = window.SHOP_DATA;
  var UI = D.ui;
  var CFG = D.config;
  var KEY_CART = "shop.cart.v1";
  var KEY_FORM = "shop.form.v1";

  // ---------- storage ----------
  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }

  // ---------- helpers ----------
  var byId = {};
  D.products.forEach(function (p) { byId[p.id] = p; });

  function faDigits(s) {
    return String(s).replace(/[0-9]/g, function (d) {
      return String.fromCharCode(0x06F0 + Number(d));
    });
  }
  function money(n) {
    var grouped = String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return faDigits(grouped).replace(/,/g, "\u066C");
  }
  function fill(tpl, obj) {
    return tpl.replace(/\{(\w+)\}/g, function (_, k) { return obj[k] != null ? obj[k] : ""; });
  }
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function canOrder(p) { return p.status !== "soon"; }

  var cart = load(KEY_CART, {});
  Object.keys(cart).forEach(function (id) {
    if (!byId[id] || !(cart[id] > 0) || !canOrder(byId[id])) delete cart[id];
  });
  var form = load(KEY_FORM, { name: "", city: "", phone: "", note: "" });

  function cartCount() {
    return Object.keys(cart).reduce(function (a, id) { return a + cart[id]; }, 0);
  }

  // ---------- placeholder art ----------
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
    var status = '<span class="status status-' + esc(p.status) + '">' + esc(UI.status[p.status] || "") + "</span>";
    var inner;
    if (p.image) {
      inner = '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async">';
    } else {
      inner = '<svg class="art" viewBox="0 0 240 180" aria-hidden="true">' + (ART[p.art] || ART.generic) + "</svg>" +
        '<span class="photo-soon">' + esc(UI.photoSoon) + "</span>";
    }
    return '<div class="media' + (big ? " media-big" : "") + '">' + inner + status + "</div>";
  }

  function priceHtml(p) {
    if (p.price == null) return '<span class="price price-ask">' + esc(UI.askPrice) + "</span>";
    return '<span class="price"><b>' + money(p.price) + "</b> " + esc(UI.toman) + "</span>";
  }

  function addLabel(p) {
    if (!canOrder(p)) return esc(UI.notAvailable);
    var q = cart[p.id] || 0;
    return q > 0 ? esc(fill(UI.inCart, { q: faDigits(q) })) : esc(UI.add);
  }

  // ---------- grid ----------
  var grid = document.getElementById("grid");

  function renderGrid() {
    var cards = D.products.map(function (p) {
      var inCart = (cart[p.id] || 0) > 0;
      return '<article class="product" id="card-' + esc(p.id) + '">' +
        '<a class="media-link" href="#p-' + esc(p.id) + '" aria-label="' + esc(UI.details + ": " + p.name) + '">' + media(p, false) + "</a>" +
        '<div class="p-body">' +
        '<h2><a href="#p-' + esc(p.id) + '">' + esc(p.name) + "</a></h2>" +
        '<p class="p-tag">' + esc(p.tagline) + "</p>" +
        '<ul class="p-feat">' + p.features.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>" +
        '<div class="p-foot">' + priceHtml(p) +
        '<button type="button" class="btn-add' + (inCart ? " is-in" : "") + '" data-add="' + esc(p.id) + '"' +
        (canOrder(p) ? "" : " disabled") + ">" + addLabel(p) + "</button>" +
        "</div></div></article>";
    }).join("");

    var ask = '<aside class="ask">' +
      "<h2>" + esc(UI.askTitle) + "</h2><p>" + esc(UI.askText) + "</p>" +
      '<a class="btn-ghost" href="https://t.me/' + esc(CFG.telegram) + '" target="_blank" rel="noopener">' + tgIcon() + esc(UI.askBtn) + "</a>" +
      "</aside>";

    grid.innerHTML = cards + ask;
  }

  function tgIcon() {
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.5 4.5L2.9 11.7c-.9.4-.9 1.6.1 1.9l4.6 1.4 1.8 5.6c.3.8 1.3 1 1.9.4l2.6-2.5 4.8 3.5c.7.5 1.7.1 1.9-.7l3.2-15.2c.2-1-.8-1.9-1.8-1.6zM9.6 14.3l8.6-6.9-6.9 8.3-.3 3.1-1.4-4.5z" fill="currentColor"/></svg>';
  }

  // ---------- product dialog ----------
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
      '<p class="p-tag">' + esc(p.tagline) + "</p>" +
      '<div class="d-buy">' + priceHtml(p) +
      '<button type="button" class="btn-add' + ((cart[p.id] || 0) > 0 ? " is-in" : "") + '" data-add="' + esc(p.id) + '"' +
      (canOrder(p) ? "" : " disabled") + ">" + addLabel(p) + "</button></div>" +
      '<p class="d-summary">' + esc(p.summary) + "</p>" +
      "<h3>" + esc(UI.howTo) + "</h3><p>" + esc(p.howTo) + "</p>" +
      "<h3>" + esc(UI.features) + '</h3><ul class="p-feat">' + p.features.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>" +
      "<h3>" + esc(UI.specs) + '</h3><dl class="specs">' + specs + "</dl>" +
      '<div class="safety"><span class="safety-k">' + esc(UI.safety) + "</span><p>" + esc(p.safety) + "</p></div>" +
      '<button type="button" class="linkbtn" data-share="' + esc(p.id) + '">' + esc(UI.shareCopy) + "</button>" +
      "</div>";
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
    if (/^#p-/.test(location.hash)) {
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { location.hash = ""; }
    }
  }

  dlg.addEventListener("close", function () {
    openId = null;
    if (/^#p-/.test(location.hash)) {
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* ignore */ }
    }
  });
  dlg.addEventListener("click", function (e) {
    if (e.target === dlg) closeProduct(); // click on backdrop
  });

  function routeHash() {
    var m = /^#p-([A-Za-z0-9_-]+)$/.exec(location.hash);
    if (m && byId[m[1]]) openProduct(m[1]);
    else if (dlg.open) closeProduct();
  }

  // ---------- cart drawer ----------
  var drawer = document.getElementById("cart");
  var cartList = document.getElementById("cartList");
  var cartSum = document.getElementById("cartSum");
  var cartBadge = document.getElementById("cartBadge");
  var orderForm = document.getElementById("orderForm");
  var sendBtn = document.getElementById("sendTg");
  var preview = document.getElementById("orderPreview");
  var formMsg = document.getElementById("formMsg");

  function buildMessage() {
    var lines = [UI.msgHello, ""];
    var total = 0, ask = 0, i = 0;
    D.products.forEach(function (p) {
      var q = cart[p.id];
      if (!q) return;
      i++;
      var line = fill(UI.msgLine, { i: faDigits(i), name: p.name, q: faDigits(q) });
      if (p.price != null) {
        total += p.price * q;
        line += fill(UI.msgPrice, { p: money(p.price * q) });
      } else {
        ask++;
      }
      lines.push(line);
    });
    lines.push("");
    if (total > 0) lines.push(fill(UI.msgTotal, { p: money(total) }));
    if (ask > 0) lines.push(fill(UI.msgAsk, { n: faDigits(ask) }));
    if (form.name) lines.push(fill(UI.msgName, { v: form.name }));
    if (form.city) lines.push(fill(UI.msgCity, { v: form.city }));
    if (form.phone) lines.push(fill(UI.msgPhone, { v: form.phone }));
    if (form.note) lines.push(fill(UI.msgNote, { v: form.note }));
    return lines.join("\n");
  }

  function tgUrl() {
    return "https://t.me/" + CFG.telegram + "?text=" + encodeURIComponent(buildMessage());
  }

  function renderCart() {
    var ids = D.products.filter(function (p) { return cart[p.id]; });
    var count = cartCount();
    cartBadge.textContent = faDigits(count);
    cartBadge.hidden = count === 0;

    if (!ids.length) {
      cartList.innerHTML = '<p class="cart-empty">' + esc(UI.cartEmpty) + "</p>";
      cartSum.innerHTML = "";
      orderForm.hidden = true;
      return;
    }
    orderForm.hidden = false;

    var total = 0, ask = 0;
    cartList.innerHTML = ids.map(function (p) {
      var q = cart[p.id];
      if (p.price != null) total += p.price * q; else ask++;
      return '<div class="line">' +
        '<div class="line-info"><a href="#p-' + esc(p.id) + '" class="line-name">' + esc(p.name) + "</a>" + priceHtml(p) + "</div>" +
        '<div class="stepper" role="group" aria-label="' + esc(UI.qty) + '">' +
        '<button type="button" data-step="' + esc(p.id) + '" data-d="1" aria-label="+">+</button>' +
        '<output aria-live="polite">' + faDigits(q) + "</output>" +
        '<button type="button" data-step="' + esc(p.id) + '" data-d="-1" aria-label="-">\u2212</button>' +
        "</div>" +
        '<button type="button" class="line-rm" data-rm="' + esc(p.id) + '">' + esc(UI.remove) + "</button>" +
        "</div>";
    }).join("");

    var sum = "";
    if (total > 0) sum += '<div class="sum-row"><span>' + esc(UI.subtotal) + "</span><b>" + money(total) + " " + esc(UI.toman) + "</b></div>";
    if (ask > 0) sum += '<p class="sum-ask">' + esc(fill(UI.subtotalAsk, { n: faDigits(ask) })) + "</p>";
    cartSum.innerHTML = sum;
    refreshOrder();
  }

  function refreshOrder() {
    sendBtn.href = tgUrl();
    preview.textContent = buildMessage();
  }

  function setQty(id, q) {
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

  // form fields
  ["name", "city", "phone", "note"].forEach(function (k) {
    var el = document.getElementById("f-" + k);
    el.value = form[k] || "";
    el.addEventListener("input", function () {
      form[k] = el.value.trim();
      save(KEY_FORM, form);
      if (k === "name" && form.name) formMsg.hidden = true;
      refreshOrder();
    });
  });

  // ---------- clipboard + toast ----------
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

  function showPreview() {
    var det = document.getElementById("previewBox");
    det.open = true;
    selectNode(preview);
  }

  // ---------- events ----------
  document.addEventListener("click", function (e) {
    var t = e.target;

    var add = t.closest("[data-add]");
    if (add && !add.disabled) {
      var p = byId[add.getAttribute("data-add")];
      setQty(p.id, (cart[p.id] || 0) + 1);
      toast(fill(UI.addedToast, { name: p.name }));
      return;
    }

    var step = t.closest("[data-step]");
    if (step) {
      var sid = step.getAttribute("data-step");
      setQty(sid, (cart[sid] || 0) + Number(step.getAttribute("data-d")));
      return;
    }

    var rm = t.closest("[data-rm]");
    if (rm) { setQty(rm.getAttribute("data-rm"), 0); return; }

    var share = t.closest("[data-share]");
    if (share) {
      var url = location.href.split("#")[0] + "#p-" + share.getAttribute("data-share");
      copyText(url, function () { toast(UI.shareCopied); }, function () { toast(url); });
      return;
    }

    if (t.closest("#cartBtn")) { openCart(true); return; }
    if (t.closest("[data-cart-close]")) { openCart(false); return; }
    if (t.closest("[data-dialog-close]")) { closeProduct(); return; }

    // product links inside the cart: close cart first, the hash route opens the dialog
    if (t.closest("#cart a[href^='#p-']")) { openCart(false); }

    if (t.closest("#copyOrder")) {
      copyText(buildMessage(), function () { toast(UI.copiedOrder); }, function () {
        showPreview();
        toast(fill(UI.copyFallback, { tg: CFG.telegram }));
      });
      return;
    }

    if (t.closest("#sendTg")) {
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

  // ---------- static text ----------
  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }
  setText("brandSub", UI.brandSub);
  setText("backText", UI.back);
  setText("cartText", UI.cart);
  setText("heroEyebrow", UI.heroEyebrow);
  setText("heroTitle", UI.heroTitle);
  setText("heroLead", UI.heroLead);
  setText("stepsTitle", UI.stepsTitle);
  setText("cartTitle", UI.cartTitle);
  setText("formTitle", UI.formTitle);
  setText("l-name", UI.fName);
  setText("l-city", UI.fCity);
  setText("l-phone", UI.fPhone);
  setText("l-note", UI.fNote);
  setText("formMsg", UI.needName);
  setText("sendText", UI.sendTg);
  setText("copyOrder", UI.copyOrder);
  setText("previewLabel", UI.preview);
  setText("sentHint", UI.sentHint);
  setText("altContact", fill(UI.altContact, { phone: CFG.phoneDisplay }));
  setText("footText", UI.footer);
  document.getElementById("steps").innerHTML = UI.steps.map(function (s, i) {
    return '<li><span class="step-n">' + faDigits(i + 1) + "</span><span>" + esc(s) + "</span></li>";
  }).join("");
  document.getElementById("cartClose").setAttribute("aria-label", UI.close);
  document.getElementById("dialogClose").setAttribute("aria-label", UI.close);

  renderGrid();
  renderCart();
  routeHash();
})();
