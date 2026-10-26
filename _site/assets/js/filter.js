// Client-side filtering for the browse pages.
// An <input data-filter-target="#id"> filters elements with [data-search]
// inside that container; [data-group] sections hide when all items are hidden.
document.querySelectorAll("input[data-filter-target]").forEach(function (input) {
  var root = document.querySelector(input.getAttribute("data-filter-target"));
  if (!root) return;
  var items = root.querySelectorAll("[data-search]");
  var groups = root.querySelectorAll("[data-group]");
  var empty = document.querySelector(".filter-empty");

  input.addEventListener("input", function () {
    var terms = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    var shown = 0;
    items.forEach(function (el) {
      var text = el.getAttribute("data-search");
      var match = terms.every(function (t) { return text.indexOf(t) !== -1; });
      el.hidden = !match;
      if (match) shown++;
    });
    groups.forEach(function (g) {
      g.hidden = !g.querySelector("[data-search]:not([hidden])");
    });
    if (empty) empty.hidden = shown !== 0;
  });
});
