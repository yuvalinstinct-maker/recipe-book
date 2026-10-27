(function () {
  "use strict";
  var app = document.getElementById("app");
  var countEl = document.getElementById("recipe-count");
  var RECIPES = window.RECIPES || [];
  var state = { q: "", tag: null };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function allTags() {
    var t = [];
    RECIPES.forEach(function (r) { (r.tags || []).forEach(function (x) { if (t.indexOf(x) < 0) t.push(x); }); });
    return t;
  }
  function fmtQty(q) {
    if (q == null) return "";
    var r = Math.round(q * 100) / 100;
    if (r === Math.floor(r)) return String(r);
    if (r === 0.5) return "חצי";
    return String(r);
  }
  function match(r) {
    if (state.tag && (r.tags || []).indexOf(state.tag) < 0) return false;
    if (!state.q) return true;
    var hay = [r.title, (r.tags || []).join(" "), r.source || ""];
    (r.groups || []).forEach(function (g) {
      hay.push(g.name);
      g.ingredients.forEach(function (i) { hay.push(i.name); });
    });
    return hay.join(" ").indexOf(state.q.trim()) >= 0;
  }

  function renderHome() {
    countEl.textContent = RECIPES.length ? RECIPES.length + " מתכונים" : "";
    var tags = allTags();
    var list = RECIPES.filter(match);
    var html = '<div class="toolbar">' +
      '<input class="search" id="q" type="search" placeholder="חיפוש מתכון או מצרך..." value="' + esc(state.q) + '">';
    if (tags.length) {
      html += '<div class="chips">';
      tags.forEach(function (t) {
        html += '<button class="chip' + (state.tag === t ? " active" : "") + '" data-tag="' + esc(t) + '">' + esc(t) + "</button>";
      });
      html += "</div>";
    }
    html += "</div><div class='grid'>";
    if (!list.length) html += '<p class="empty">לא נמצאו מתכונים.</p>';
    list.forEach(function (r) {
      html += '<a class="card" href="#/recipe/' + encodeURIComponent(r.id) + '">' +
        "<h2>" + esc(r.title) + "</h2>" +
        (r.yield ? '<div class="yield">' + esc(r.yield) + "</div>" : "") +
        '<div class="badges">' +
        (r.nutrition && r.nutrition.kcal ? '<span class="badge">~' + esc(r.nutrition.kcal) + ' קק"ל / ' + esc(r.nutrition.per) + "</span>" : "") +
        (r.nutrition && r.nutrition.protein_g ? '<span class="badge protein">~' + esc(r.nutrition.protein_g) + ' גרם חלבון / ' + esc(r.nutrition.per) + "</span>" : "") +
        "</div>" +
        '<div class="tags">' + (r.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>" +
        "</a>";
    });
    html += "</div>";
    app.innerHTML = html;
    var q = document.getElementById("q");
    q.addEventListener("input", function () { state.q = q.value; renderHome(); var nq = document.getElementById("q"); nq.focus(); nq.setSelectionRange(nq.value.length, nq.value.length); });
    app.querySelectorAll(".chip").forEach(function (b) {
      b.addEventListener("click", function () {
        var t = b.getAttribute("data-tag");
        state.tag = state.tag === t ? null : t;
        renderHome();
      });
    });
  }

  function renderRecipe(id, scale) {
    var r = RECIPES.filter(function (x) { return x.id === id; })[0];
    countEl.textContent = "";
    if (!r) { app.innerHTML = '<a class="back" href="#/">→ חזרה</a><p class="empty">המתכון לא נמצא.</p>'; return; }
    scale = scale || 1;
    var html = '<a class="back" href="#/">→ כל המתכונים</a>' +
      '<div class="recipe-head"><h2>' + esc(r.title) + "</h2>" +
      '<p class="recipe-meta">' + esc(r.yield || "") + (r.source ? " · מתכון של " + esc(r.source) : "") + "</p></div>";
    if (r.nutrition && (r.nutrition.kcal || r.nutrition.protein_g)) {
      html += '<div class="nutrition"><div class="nums">' +
        (r.nutrition.kcal ? '<span class="badge">~' + esc(r.nutrition.kcal) + ' קק"ל / ' + esc(r.nutrition.per) + "</span>" : "") +
        (r.nutrition.protein_g ? '<span class="badge protein">~' + esc(r.nutrition.protein_g) + ' גרם חלבון / ' + esc(r.nutrition.per) + "</span>" : "") +
        "</div>" + (r.nutrition.note ? '<p class="note">' + esc(r.nutrition.note) + "</p>" : "") + "</div>";
    }
    html += '<div class="scaler"><span>כמויות:</span>' + [1, 2, 3].map(function (s) {
      return '<button data-scale="' + s + '"' + (s === scale ? ' class="active"' : "") + ">×" + s + "</button>";
    }).join("") + "</div>";
    (r.groups || []).forEach(function (g) {
      html += '<section class="block"><h3>' + esc(g.name || "מצרכים") + '</h3><ul class="ing">';
      g.ingredients.forEach(function (i) {
        var qty = i.qty == null ? "" : fmtQty(i.qty * scale) + (i.unit ? " " + i.unit : "");
        html += "<li>" + (qty ? '<span class="qty">' + esc(qty) + "</span>" : "") + "<span>" + esc(i.name) + "</span></li>";
      });
      html += "</ul></section>";
    });
    if (r.steps && r.steps.length) {
      html += '<section class="block"><h3>הכנה</h3><ol class="steps">' +
        r.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol></section>";
    }
    html += '<p class="src">נוסף ב־' + esc(r.added || "") + (r.source ? " · מקור: " + esc(r.source) : "") + "</p>";
    app.innerHTML = html;
    app.querySelectorAll(".scaler button").forEach(function (b) {
      b.addEventListener("click", function () { renderRecipe(id, parseInt(b.getAttribute("data-scale"), 10)); window.scrollTo(0, 0); });
    });
    window.scrollTo(0, 0);
  }

  function route() {
    var h = location.hash || "#/";
    var m = h.match(/^#\/recipe\/(.+)$/);
    if (m) renderRecipe(decodeURIComponent(m[1]));
    else renderHome();
  }
  window.addEventListener("hashchange", route);
  route();
})();
