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
    var hay = [r.title, (r.tags || []).join(" "), r.source || "", r.rawText || "", r.note || ""];
    (r.groups || []).forEach(function (g) {
      hay.push(g.name);
      g.ingredients.forEach(function (i) { hay.push(i.name); });
    });
    return hay.join(" ").indexOf(state.q.trim()) >= 0;
  }

  function art(r) {
    var kind = r.art || "gyoza";
    var shapes = kind === "onion" ? '<path d="M86 89Q48 62 85 37Q94 26 97 16Q105 34 119 40Q153 65 119 90Z" fill="#efcfa6"/><path d="M99 29Q76 68 101 90M106 35Q124 65 109 90" fill="none" stroke="#bb8e60" stroke-width="3"/>' : kind === "gyoza" ? '<ellipse cx="102" cy="83" rx="62" ry="20" fill="#f9f5e8"/><path d="M49 72Q62 24 103 66Q122 24 151 72Q102 105 49 72Z" fill="#e9cfa6" stroke="#c7a979" stroke-width="2"/><path d="M60 63L70 77M76 56L84 80M119 58L125 80M137 61L137 78" stroke="#c7a979" stroke-width="3"/>' : '<ellipse cx="101" cy="82" rx="61" ry="21" fill="#f1ead5"/><path d="M45 56Q50 104 101 104Q152 104 158 56" fill="#fefdf5"/><ellipse cx="101" cy="56" rx="56" ry="22" fill="' + (kind === "orange" ? '#e0a35e' : '#d4b975') + '"/><path d="M73 53Q86 43 94 54M107 62Q119 44 135 54M94 37Q89 27 97 20M113 32Q109 23 115 15" fill="none" stroke="#7c936b" stroke-width="4" stroke-linecap="round"/>';
    return '<div class="art art-' + kind + '" aria-hidden="true"><svg viewBox="0 0 200 120">' + shapes + '</svg></div>';
  }
  function renderHome() {
    countEl.textContent = RECIPES.length ? RECIPES.length + " מתכונים" : "";
    var tags = allTags();
    var list = RECIPES.filter(match);
    var html = '<section class="intro"><p class="eyebrow">מהמטבח שלנו</p><h2>מה מבשלים היום?</h2><p>הטעמים שאוהבים, במקום אחד.</p></section><div class="toolbar">' +
      '<input class="search" id="q" type="search" aria-label="חיפוש מתכון או מצרך" placeholder="חיפוש מתכון או מצרך..." value="' + esc(state.q) + '">';
    if (tags.length) {
      html += '<div class="chips">';
      tags.forEach(function (t) {
        html += '<button class="chip' + (state.tag === t ? " active" : "") + '" data-tag="' + esc(t) + '">' + esc(t) + "</button>";
      });
      html += "</div>";
    }
    html += "</div><div class='section-label'><h3>אוסף המתכונים</h3><span>" + list.length + " מתכונים</span></div><div class='grid'>";
    if (!list.length) html += '<p class="empty">לא נמצאו מתכונים.</p>';
    list.forEach(function (r) {
      html += '<a class="card" href="#/recipe/' + encodeURIComponent(r.id) + '">' +
        art(r) + '<div class="card-body"><h2>' + esc(r.title) + "</h2>" +
        (r.yield ? '<div class="yield">' + esc(r.yield) + "</div>" : "") +
        '<div class="badges">' +
        (r.nutrition && r.nutrition.kcal ? '<span class="badge">~' + esc(r.nutrition.kcal) + ' קק"ל / ' + esc(r.nutrition.per) + "</span>" : "") +
        (r.nutrition && r.nutrition.protein_g ? '<span class="badge protein">~' + esc(r.nutrition.protein_g) + ' גרם חלבון / ' + esc(r.nutrition.per) + "</span>" : "") +
        "</div>" +
        '<div class="tags">' + (r.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>" +
        '<div class="card-bottom"><span>' + (r.linkOnly ? "קישור למתכון" : "למתכון המלא") + '</span><span aria-hidden="true">↖</span></div></div></a>';
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
    if ((r.groups || []).some(function(g) { return g.ingredients.some(function(i) { return i.qty != null; }); })) html += '<div class="scaler"><span>כמויות:</span>' + [1, 2, 3].map(function (s) {
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
    if (r.rawText) html += '<section class="block original"><h3>המתכון המקורי</h3><div class="original-text">' + esc(r.rawText) + '</div></section>';
    if (r.note) html += '<aside class="recipe-note"><h3>הערה</h3><p>' + esc(r.note) + '</p></aside>';
    if (r.sourceUrl) html += '<section class="block"><h3>מקור המתכון</h3><p>הנוסח נשמר מתוך תיאור הריל המקורי.</p><a class="source-link" target="_blank" rel="noopener noreferrer" href="' + esc(r.sourceUrl) + '">פתיחת המתכון באינסטגרם ↗</a></section>';
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
