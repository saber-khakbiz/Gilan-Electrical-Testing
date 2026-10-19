// Products hub: fills the hardware and software cards from the two data files.
// The cards already hold static text in index.html, so if a data file fails
// to load the page still works; this script only adds live details.
// All user-visible text comes from the data files, so this file stays ASCII-only.
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function str(v) { return typeof v === "string" ? v.trim() : ""; }
  function faDigits(s) {
    return String(s).replace(/[0-9]/g, function (d) { return String.fromCharCode(0x06F0 + Number(d)); });
  }
  function fill(tpl, obj) {
    return String(tpl || "").replace(/\{(\w+)\}/g, function (_, k) { return obj[k] != null ? obj[k] : ""; });
  }
  function el(id) { return document.getElementById(id); }

  // ---------- hardware ----------
  var HW = window.SHOP_DATA;
  if (HW && Array.isArray(HW.products)) {
    var seen = {};
    var items = HW.products.filter(function (p) {
      var ok = p && /^[A-Za-z0-9_-]+$/.test(str(p.id)) && str(p.name) && !seen[p.id];
      if (ok) seen[p.id] = true;
      return ok;
    });
    if (items.length) {
      var shown = items.slice(0, 4);
      el("hwList").innerHTML = shown.map(function (p) {
        return "<li>" + esc(p.name) + "</li>";
      }).join("") + (items.length > shown.length
        ? '<li class="more">' + esc(fill(el("hwList").getAttribute("data-more"), { n: faDigits(items.length - shown.length) })) + "</li>"
        : "");
      el("hwList").hidden = false;
      el("hwCount").textContent = fill(el("hwCount").getAttribute("data-tpl"), { n: faDigits(items.length) });
    }
  }

  // ---------- software ----------
  var SW = window.SOFTWARE_DATA;
  if (SW && Array.isArray(SW.products)) {
    var apps = SW.products.filter(function (p) { return p && str(p.id) && str(p.name); });
    if (apps.length) {
      var a = apps[0];
      el("swName").textContent = a.name;
      if (str(a.tagline)) el("swDesc").textContent = a.tagline;
      var shot = Array.isArray(a.screenshots) && a.screenshots[0] && str(a.screenshots[0].src);
      if (shot) {
        // Data paths are relative to software/; both folders sit at the same depth.
        el("swShot").innerHTML = '<img src="' + esc(shot) + '" alt="" loading="lazy" decoding="async">';
      }
      var chips = [];
      if (str(a.platform)) chips.push(a.platform);
      (Array.isArray(a.editions) ? a.editions : []).forEach(function (e) { if (e && str(e.name)) chips.push(e.name); });
      if (chips.length) {
        el("swList").innerHTML = chips.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("");
        el("swList").hidden = false;
      }
      if (apps.length > 1) {
        el("swCount").textContent = fill(el("swCount").getAttribute("data-tpl"), { n: faDigits(apps.length) });
      }
    }
  }
})();
