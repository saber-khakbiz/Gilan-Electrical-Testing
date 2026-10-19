(function () {
  "use strict";

  var D = window.SITE_DATA;
  var UI = D.ui;
  var KEY_DONE = "regcards.done.v1";
  var KEY_REACT = "regcards.react.v1";
  var REACTS = [
    { id: "useful", glyph: "\uD83D\uDC4D", label: "reactUseful" },
    { id: "idea", glyph: "\uD83D\uDCA1", label: "reactIdea" },
    { id: "careful", glyph: "\u26A0\uFE0F", label: "reactCareful" }
  ];

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
  var done = load(KEY_DONE, {});
  var reacts = load(KEY_REACT, {});

  // ---------- helpers ----------
  function faDigits(s) {
    return String(s).replace(/[0-9]/g, function (d) {
      return String.fromCharCode(0x06F0 + Number(d));
    });
  }
  function num(x) { return faDigits(x); }
  function fill(tpl, obj) {
    return tpl.replace(/\{(\w+)\}/g, function (_, k) { return obj[k]; });
  }
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function inline(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  }
  function plain(s) { return String(s).replace(/\*\*/g, ""); }

  var byId = {};
  D.series.forEach(function (s, i) {
    s.index = i;
    byId[s.id] = s;
    s.cards.forEach(function (c, j) { c.key = s.id + "-" + j; c.series = s; });
  });

  function cardText(c) {
    var out = [c.h];
    c.b.forEach(function (blk) {
      if (blk.p) out.push(plain(blk.p));
      if (blk.ul) blk.ul.forEach(function (li) { out.push("- " + plain(li)); });
      if (blk.tip) out.push(UI.tip + ": " + plain(blk.tip));
      if (blk.warn) out.push(UI.warn + ": " + plain(blk.warn));
    });
    return out.join("\n");
  }
  function minutesOf(s) {
    var chars = s.cards.reduce(function (a, c) { return a + cardText(c).length; }, 0);
    return Math.max(1, Math.round(chars / 900));
  }
  function doneCount() {
    return D.series.filter(function (s) { return done[s.id]; }).length;
  }
  function nextUnfinished() {
    for (var i = 0; i < D.series.length; i++) {
      if (!done[D.series[i].id]) return D.series[i];
    }
    return null;
  }

  // ---------- pieces ----------
  function check() {
    return '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function chips(tagIds) {
    return tagIds.map(function (t) {
      return '<a class="chip" href="#t-' + t + '">' + esc(D.tags[t]) + "</a>";
    }).join("");
  }

  function body(c) {
    return c.b.map(function (blk) {
      if (blk.p) return "<p>" + inline(blk.p) + "</p>";
      if (blk.ul) return "<ul>" + blk.ul.map(function (li) { return "<li>" + inline(li) + "</li>"; }).join("") + "</ul>";
      if (blk.tip) return '<div class="note note-tip"><span class="note-k">' + esc(UI.tip) + "</span><p>" + inline(blk.tip) + "</p></div>";
      if (blk.warn) return '<div class="note note-warn"><span class="note-k">' + esc(UI.warn) + "</span><p>" + inline(blk.warn) + "</p></div>";
      return "";
    }).join("");
  }

  function reactBar(c) {
    var mine = reacts[c.key] || {};
    return REACTS.map(function (r) {
      var on = !!mine[r.id];
      return '<button type="button" class="react' + (on ? " is-on" : "") + '" data-react="' + r.id + '" data-card="' + c.key +
        '" aria-pressed="' + on + '" title="' + esc(UI[r.label]) + '"><span aria-hidden="true">' + r.glyph +
        '</span><span class="react-n">' + num(on ? 1 : 0) + "</span></button>";
    }).join("");
  }

  function cardHtml(c, i, n, showSource) {
    var s = c.series;
    var top = showSource
      ? '<a class="card-src" href="#' + s.id + '" style="--h:' + s.hue + '">' + esc(fill(UI.from, { n: s.num })) + "</a>"
      : '<span class="card-idx">' + esc(fill(UI.cardOf, { i: num(i + 1), n: num(n) })) + "</span>";
    return '<li><article class="card" style="--h:' + s.hue + '">' +
      '<div class="card-top">' + top + '<div class="chips">' + chips(c.t) + "</div></div>" +
      "<h3>" + esc(c.h) + "</h3>" +
      '<div class="card-body" id="body-' + c.key + '">' + body(c) + "</div>" +
      '<footer class="card-foot"><button type="button" class="copy" data-copy="' + c.key + '">' + esc(UI.copy) + "</button>" +
      '<div class="reacts">' + reactBar(c) + "</div></footer>" +
      "</article></li>";
  }

  function metaLine(s) {
    return num(s.cards.length) + " " + UI.cards + " \u00B7 " + num(minutesOf(s)) + " " + UI.minutes;
  }

  // ---------- views ----------
  function viewHome() {
    var d = doneCount(), t = D.series.length;
    var nx = nextUnfinished();
    var cta;
    if (d === 0) cta = '<a class="btn" href="#' + D.series[0].id + '">' + esc(UI.start) + "</a>";
    else if (nx) cta = '<a class="btn" href="#' + nx.id + '">' + esc(fill(UI.cont, { title: nx.title })) + "</a>";
    else cta = '<span class="btn btn-done">' + check() + esc(UI.allDone) + "</span>";

    var reset = d > 0
      ? '<button type="button" class="linklike" id="resetBtn">' + esc(UI.reset) + "</button>"
      : "";

    var meter = D.series.map(function (s) {
      return '<span class="seg' + (done[s.id] ? " is-on" : "") + '" style="--h:' + s.hue + '"></span>';
    }).join("");

    var blocks = D.series.map(function (s) {
      var isDone = !!done[s.id];
      return '<a class="block' + (isDone ? " is-done" : "") + '" href="#' + s.id + '" style="--h:' + s.hue + '">' +
        '<span class="block-head"><span class="block-label">' + esc(UI.topic) + '</span><span class="block-num">' + esc(s.num) + "</span></span>" +
        "<h2>" + esc(s.title) + "</h2>" +
        "<p>" + esc(s.desc) + "</p>" +
        '<span class="block-foot"><span class="block-meta">' + esc(metaLine(s)) + "</span>" +
        (isDone ? '<span class="pill">' + check() + esc(UI.doneBadge) + "</span>" : "") +
        "</span></a>";
    }).join("");

    return '<section class="hero">' +
      '<span class="plate">' + esc(UI.plate) + "</span>" +
      "<h1>" + esc(UI.heroTitle) + "</h1>" +
      '<p class="lead">' + esc(UI.heroLead) + "</p>" +
      '<div class="hero-actions">' + cta +
      '<div class="meter-wrap"><div class="meter" aria-hidden="true">' + meter + "</div>" +
      '<span class="meter-txt">' + esc(fill(UI.progress, { d: num(d), t: num(t) })) + "</span>" + reset + "</div></div>" +
      "</section>" +
      '<section class="grid" aria-label="' + esc(UI.seriesTitle) + '">' + blocks + "</section>" +
      '<div class="tags-cta"><a class="chip chip-lg" href="#tags">' + esc(UI.tagsNav) + "</a></div>";
  }

  function sideList(activeId) {
    return D.series.map(function (s) {
      return '<a href="#' + s.id + '" class="side-item' + (s.id === activeId ? " is-active" : "") + (done[s.id] ? " is-done" : "") +
        '" style="--h:' + s.hue + '"><span class="side-num">' + esc(s.num) + '</span><span class="side-t">' + esc(s.title) + "</span>" +
        (done[s.id] ? check() : "") + "</a>";
    }).join("");
  }

  function viewSeries(s) {
    var n = s.cards.length;
    var prev = D.series[s.index - 1], next = D.series[s.index + 1];
    var deck = s.cards.map(function (c, i) { return cardHtml(c, i, n, false); }).join("");
    var pager = '<nav class="pager">' +
      (prev ? '<a class="pg pg-prev" href="#' + prev.id + '"><span class="pg-k">' + esc(UI.prev) + "</span><span>" + esc(UI.topic + " " + prev.num) + "</span></a>" : "<span></span>") +
      '<a class="pg pg-home" href="#">' + esc(UI.home) + "</a>" +
      (next ? '<a class="pg pg-next" href="#' + next.id + '"><span class="pg-k">' + esc(UI.next) + "</span><span>" + esc(UI.topic + " " + next.num) + "</span></a>" : "<span></span>") +
      "</nav>";

    return '<div class="series-layout">' +
      '<aside class="side" aria-label="' + esc(UI.seriesTitle) + '">' + sideList(s.id) + "</aside>" +
      '<div class="series-main">' +
      '<header class="series-head" style="--h:' + s.hue + '">' +
      '<span class="eyebrow">' + esc(UI.topic) + ' <b class="eyebrow-num">' + esc(s.num) + "</b></span>" +
      "<h1>" + esc(s.title) + "</h1><p>" + esc(s.desc) + "</p>" +
      '<span class="series-meta">' + esc(metaLine(s)) + "</span></header>" +
      '<ol class="deck">' + deck + "</ol>" +
      '<label class="finish" for="done-' + s.id + '"><input type="checkbox" id="done-' + s.id + '" data-done="' + s.id + '"' +
      (done[s.id] ? " checked" : "") + "><span>" + esc(UI.markDone) + "</span></label>" +
      pager + "</div></div>";
  }

  function tagUsage() {
    var map = {};
    D.series.forEach(function (s) {
      s.cards.forEach(function (c) {
        c.t.forEach(function (t) {
          if (!map[t]) map[t] = { cards: [], series: {} };
          map[t].cards.push(c);
          map[t].series[s.id] = true;
        });
      });
    });
    return map;
  }

  function viewTags() {
    var use = tagUsage();
    var list = Object.keys(D.tags).filter(function (t) { return use[t]; }).map(function (t) {
      return '<a class="tag-tile" href="#t-' + t + '"><span class="tag-name">' + esc(D.tags[t]) + '</span><span class="tag-n">' +
        num(use[t].cards.length) + "</span></a>";
    }).join("");
    return '<header class="page-head"><span class="eyebrow">' + esc(UI.tagEyebrow) + "</span><h1>" + esc(UI.tagsTitle) + "</h1><p>" +
      esc(UI.tagsLead) + '</p></header><div class="tag-grid">' + list + "</div>";
  }

  function viewTag(t) {
    var u = tagUsage()[t];
    if (!u) return viewTags();
    var deck = u.cards.map(function (c, i) { return cardHtml(c, i, u.cards.length, true); }).join("");
    return '<header class="page-head"><a class="eyebrow eyebrow-link" href="#tags">' + esc(UI.tagEyebrow) + "</a><h1>" + esc(D.tags[t]) +
      "</h1><p>" + esc(fill(UI.tagCount, { n: num(u.cards.length), s: num(Object.keys(u.series).length) })) + "</p></header>" +
      '<ol class="deck">' + deck + "</ol>";
  }

  // ---------- router ----------
  var app = document.getElementById("app");
  var bar = document.getElementById("readbar");
  var drawerList = document.getElementById("drawerList");

  function route() {
    var h = (location.hash || "").replace(/^#/, "");
    var sfx = UI.titleSuffix || "";
    var html, isReading = false, title = UI.pageTitle || UI.brand, active = null;
    if (byId[h]) {
      html = viewSeries(byId[h]); isReading = true; active = h;
      title = UI.topic + " " + byId[h].num + " \u00B7 " + UI.brand + sfx;
    } else if (h === "tags") {
      html = viewTags(); title = UI.tagsTitle + " \u00B7 " + UI.brand + sfx;
    } else if (h.indexOf("t-") === 0 && D.tags[h.slice(2)]) {
      html = viewTag(h.slice(2)); isReading = true;
      title = D.tags[h.slice(2)] + " \u00B7 " + UI.brand + sfx;
    } else {
      html = viewHome();
    }
    app.innerHTML = html;
    document.title = title;
    document.body.classList.toggle("is-reading", isReading);
    drawerList.innerHTML = sideList(active) +
      '<a class="side-item side-tags' + (h === "tags" ? " is-active" : "") + '" href="#tags">' + esc(UI.tagsNav) + "</a>";
    window.scrollTo(0, 0);
    onScroll();
  }

  function onScroll() {
    if (!document.body.classList.contains("is-reading")) { bar.style.transform = "scaleX(0)"; return; }
    var el = document.documentElement;
    var max = el.scrollHeight - el.clientHeight;
    var p = max > 0 ? Math.min(1, el.scrollTop / max) : 1;
    bar.style.transform = "scaleX(" + p + ")";
  }

  // ---------- events ----------
  function flash(btn, text) {
    var old = btn.getAttribute("data-label") || btn.textContent;
    btn.setAttribute("data-label", old);
    btn.textContent = text;
    btn.classList.add("is-flash");
    setTimeout(function () { btn.textContent = old; btn.classList.remove("is-flash"); }, 1600);
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

  function findCard(key) {
    var parts = key.split("-");
    var s = byId[parts[0]];
    return s ? s.cards[Number(parts[1])] : null;
  }

  var resetArmed = false;

  document.addEventListener("click", function (e) {
    var copyBtn = e.target.closest("[data-copy]");
    if (copyBtn) {
      var c = findCard(copyBtn.getAttribute("data-copy"));
      if (!c) return;
      var text = cardText(c);
      var fail = function () {
        selectNode(document.getElementById("body-" + c.key));
        flash(copyBtn, UI.copyFail);
      };
      try {
        navigator.clipboard.writeText(text).then(function () { flash(copyBtn, UI.copied); }, fail);
      } catch (err) { fail(); }
      return;
    }

    var rb = e.target.closest("[data-react]");
    if (rb) {
      var key = rb.getAttribute("data-card"), id = rb.getAttribute("data-react");
      var mine = reacts[key] || {};
      mine[id] = !mine[id];
      reacts[key] = mine;
      save(KEY_REACT, reacts);
      rb.classList.toggle("is-on", mine[id]);
      rb.setAttribute("aria-pressed", String(mine[id]));
      rb.querySelector(".react-n").textContent = num(mine[id] ? 1 : 0);
      return;
    }

    if (e.target.closest("#resetBtn")) {
      var b = e.target.closest("#resetBtn");
      if (!resetArmed) {
        resetArmed = true;
        b.textContent = UI.resetAsk;
        setTimeout(function () { resetArmed = false; if (b.isConnected) b.textContent = UI.reset; }, 3000);
      } else {
        resetArmed = false;
        done = {};
        save(KEY_DONE, done);
        route();
      }
      return;
    }

    if (e.target.closest("#menuBtn")) { openDrawer(true); return; }
    if (e.target.closest("[data-close]")) { openDrawer(false); return; }
    if (e.target.closest("#drawer a")) { openDrawer(false); }
  });

  document.addEventListener("change", function (e) {
    var id = e.target.getAttribute && e.target.getAttribute("data-done");
    if (!id) return;
    if (e.target.checked) done[id] = true; else delete done[id];
    save(KEY_DONE, done);
    var side = document.querySelector(".side");
    if (side) side.innerHTML = sideList(id);
  });

  var drawer = document.getElementById("drawer");
  function openDrawer(open) {
    drawer.hidden = !open;
    document.getElementById("menuBtn").setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("no-scroll", open);
    if (open) drawer.querySelector(".drawer-close").focus();
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !drawer.hidden) openDrawer(false);
  });

  window.addEventListener("hashchange", route);
  window.addEventListener("scroll", onScroll, { passive: true });

  // static chrome strings (all text comes from data.js; elements are optional)
  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }
  setText("brandText", UI.brand);
  setText("menuText", UI.menu);
  setText("drawerTitle", UI.seriesTitle);
  setText("backText", UI.back);
  setText("disclaimer", UI.disclaimer);
  setText("footnote", UI.footer);
  document.querySelector(".drawer-close").setAttribute("aria-label", UI.close);

  route();
})();
