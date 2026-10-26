// Question search: rank questions by how well they match a natural-language
// query, and optionally narrow them to one pathogen group.
//
// Each card carries data-title (the question), data-search (question, summary,
// aliases, groups, protocol names), and data-orgs ("viruses|bacteria|").
// Matching ignores common words and word endings, so "are my cases linked"
// matches "linked cases" in a question's aliases. Rare words count more than
// words shared by many questions, and words in the question itself count
// double. Questions scoring well below the best match are hidden.
// ?q= and ?org= are kept in the URL.
(function () {
  var input = document.getElementById("q");
  var list = document.getElementById("question-list");
  if (!input || !list) return;

  var chips = Array.prototype.slice.call(document.querySelectorAll(".org-filter .chip"));
  var status = document.querySelector(".search-status");
  var empty = document.querySelector(".search-empty");

  var STOP = ("a an and are as at be been being by can could did do does for from has have how i if in into is it its " +
    "me my of on or our should so that the their them these they this those to was we were what when where which who " +
    "why will with would you your any all there here than then just about between each other").split(" ");
  var SUFFIXES = ["ingly", "ings", "ing", "edly", "ness", "ions", "ion", "ies", "ed", "es", "ly", "s"];

  function root(w) {
    for (var pass = 0; pass < 2; pass++) {
      for (var i = 0; i < SUFFIXES.length; i++) {
        var sfx = SUFFIXES[i];
        if (w.length - sfx.length >= 4 && w.slice(-sfx.length) === sfx) { w = w.slice(0, -sfx.length); break; }
      }
    }
    return w;
  }
  function roots(text) {
    return (text.toLowerCase().match(/[a-z0-9]+/g) || [])
      .filter(function (w) { return STOP.indexOf(w) === -1 && w.length > 1; })
      .map(root);
  }
  function matches(q, words) {
    return words.some(function (w) {
      if (w === q) return true;
      var short = q.length < w.length ? q : w, long = short === q ? w : q;
      return short.length >= 4 && long.indexOf(short) === 0;
    });
  }

  var cards = Array.prototype.map.call(list.querySelectorAll(".card-question"), function (el, i) {
    return {
      el: el,
      index: i,
      title: roots(el.getAttribute("data-title") || ""),
      words: roots(el.getAttribute("data-search") || ""),
      orgs: (el.getAttribute("data-orgs") || "").split("|").filter(Boolean)
    };
  });

  // How many questions use each word: rarer words are better evidence.
  var df = {};
  cards.forEach(function (c) {
    var seen = {};
    c.title.concat(c.words).forEach(function (w) { if (!seen[w]) { seen[w] = 1; df[w] = (df[w] || 0) + 1; } });
  });
  function weight(q) {
    var n = 0;
    Object.keys(df).forEach(function (w) { if (matches(q, [w])) n = Math.max(n, df[w]); });
    return Math.log((cards.length + 1) / (n + 0.5));
  }
  var RELATIVE_CUTOFF = 0.5;   // hide questions scoring under half the best score

  var org = "";

  function update() {
    var q = roots(input.value);
    var weights = q.map(weight);
    var shown = 0;
    cards.forEach(function (c) {
      var score = 0;
      q.forEach(function (t, i) {
        if (matches(t, c.title)) score += 2 * weights[i];
        else if (matches(t, c.words)) score += weights[i];
      });
      c.score = score;
    });
    var best = Math.max.apply(null, cards.filter(function (c) {
      return !org || c.orgs.indexOf(org) !== -1;
    }).map(function (c) { return c.score; }).concat([0]));
    cards.forEach(function (c) {
      var score = c.score;
      var orgOk = !org || c.orgs.indexOf(org) !== -1;
      c.visible = orgOk && (!q.length || (score > 0 && score >= best * RELATIVE_CUTOFF));
      c.el.hidden = !c.visible;
      if (c.visible) shown++;
      // Emphasize the route for the chosen pathogen group.
      Array.prototype.forEach.call(c.el.querySelectorAll(".route-list > li"), function (li) {
        li.classList.toggle("is-dimmed", !!org && li.getAttribute("data-org") !== org);
      });
    });

    // Best matches first; original order otherwise.
    cards.slice().sort(function (a, b) {
      return q.length ? (b.score - a.score) || (a.index - b.index) : a.index - b.index;
    }).forEach(function (c) { list.appendChild(c.el); });

    empty.hidden = shown !== 0;
    status.textContent = (q.length || org)
      ? shown + (shown === 1 ? " question matches." : " questions match.")
      : "";

    var params = new URLSearchParams(window.location.search);
    if (input.value.trim()) params.set("q", input.value.trim()); else params.delete("q");
    if (org) params.set("org", org); else params.delete("org");
    var qs = params.toString();
    history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""));
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      org = chip.getAttribute("data-org");
      chips.forEach(function (c) {
        c.classList.toggle("is-active", c === chip);
        c.setAttribute("aria-pressed", c === chip ? "true" : "false");
      });
      update();
    });
  });
  input.addEventListener("input", update);

  var params = new URLSearchParams(window.location.search);
  input.value = params.get("q") || "";
  var start = (params.get("org") || "").toLowerCase();
  chips.forEach(function (c) {
    var on = c.getAttribute("data-org") === start;
    c.classList.toggle("is-active", on);
    c.setAttribute("aria-pressed", on ? "true" : "false");
    if (on) org = start;
  });
  update();
})();
