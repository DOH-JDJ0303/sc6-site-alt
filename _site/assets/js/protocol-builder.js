// Interactive protocol path builder.
//
// Each method option declares `requires` (data types it needs) and `produces`.
// A requirement entry is either a key or a list of keys meaning "any one of".
// Steps are evaluated in order, starting from the protocol's inputs:
//   - an option is selectable when every requirement is already available;
//   - choosing it adds its outputs to what later steps can use;
//   - options that depend on an undecided earlier step wait for that choice;
//   - a choice that becomes incompatible after an upstream change is cleared.
// Steps marked data-multiple="true" accept one or more methods (checkboxes);
// the outputs of every selected method become available downstream. Selected
// methods are applied in the order listed, so a method can also use the outputs
// of methods selected above it in the same step (e.g. time-scaling an ML tree).
// The chosen path is kept in the URL (?path=a,b+c,-,d) so it can be shared:
// steps are separated by "," and combined methods by "+"; "-" is a skip.
(function () {
  var stepsEl = document.getElementById("protocol-steps");
  if (!stepsEl) return;
  document.documentElement.classList.add("js-builder");

  var types = {};
  try { types = JSON.parse(document.getElementById("data-types").textContent) || {}; } catch (e) {}
  function typeName(k) { return (types[k] && types[k].name) || k; }
  function parse(attr) { try { return JSON.parse(attr) || []; } catch (e) { return []; } }

  var inputs = parse(stepsEl.getAttribute("data-inputs"));
  var resetBtn = document.querySelector(".reset-path");
  var help = document.querySelector(".builder-help");
  var summary = document.querySelector(".path-summary");

  var steps = Array.prototype.map.call(stepsEl.querySelectorAll(".step[data-step]"), function (el) {
    return {
      el: el,
      num: +el.getAttribute("data-step"),
      title: (el.querySelector(".step-title a") || el.querySelector(".step-title") || {}).textContent || "",
      optional: el.getAttribute("data-optional") === "true",
      multiple: el.getAttribute("data-multiple") === "true",
      status: el.querySelector(".step-status"),
      cleared: [],
      selected: [],
      options: Array.prototype.map.call(el.querySelectorAll(".method-option"), function (li) {
        return {
          el: li,
          slug: li.getAttribute("data-method"),
          skip: li.classList.contains("option-skip"),
          title: li.getAttribute("data-title"),
          input: li.querySelector(".method-radio"),
          status: li.querySelector(".option-status"),
          // Normalize to a list of alternative-groups: [["a"], ["b","c"]]
          requires: parse(li.getAttribute("data-requires")).map(function (r) { return Array.isArray(r) ? r : [r]; }),
          produces: parse(li.getAttribute("data-produces"))
        };
      })
    };
  });

  var producible = {};
  steps.forEach(function (s) {
    s.options.forEach(function (o) { o.produces.forEach(function (t) { producible[t] = true; }); });
  });

  function list(names) {
    if (names.length < 2) return names.join("");
    return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
  }
  function methodsOf(step) { return step.options.filter(function (o) { return !o.skip; }); }
  function skipOf(step) { return step.options.filter(function (o) { return o.skip; })[0] || null; }
  function isSkipped(step) { return step.selected.length === 1 && step.selected[0].skip; }

  function evaluate() {
    var available = {};            // type -> step number that provides it (0 = protocol input)
    inputs.forEach(function (t) { available[t] = 0; });
    var pending = {};              // type -> earliest undecided step that could provide it

    steps.forEach(function (step) {
      var openCount = 0, waitCount = 0;
      var local = {};     // outputs of methods already selected above, in this step
      var earlier = [];   // methods listed above the current one, in this step

      // Every option is judged against what earlier steps provide and, in
      // multi-select steps, what the methods selected above it provide.
      step.options.forEach(function (opt) {
        function have(t) { return (t in available) || (t in local); }
        var unmet = opt.requires.filter(function (g) { return !g.some(have); });
        var waitingOn = null;
        var needs = [];
        var blocked = unmet.filter(function (g) {
          var s = null;
          g.forEach(function (t) { if (t in pending && (s === null || pending[t] < s)) s = pending[t]; });
          if (s !== null) { waitingOn = waitingOn === null ? s : Math.max(waitingOn, s); return false; }
          if (step.multiple) {
            var sib = earlier.filter(function (o) {
              return o.state !== "blocked" && o.produces.some(function (t) { return g.indexOf(t) !== -1; });
            })[0];
            if (sib) { if (needs.indexOf(sib.title) === -1) needs.push(sib.title); return false; }
          }
          return true;
        });

        opt.state = !unmet.length ? "ok"
          : blocked.length ? "blocked"
          : waitingOn !== null ? "waiting"
          : "needs-sibling";
        opt.el.classList.toggle("is-blocked", opt.state === "blocked");
        opt.el.classList.toggle("is-waiting", opt.state === "waiting" || opt.state === "needs-sibling");
        opt.input.disabled = opt.state !== "ok";

        if (opt.state === "blocked") {
          // Types no method on this page can produce must come from the protocol's inputs.
          var fromInputs = blocked.every(function (g) {
            return g.every(function (t) { return !(t in producible); });
          });
          opt.status.textContent = "Not available: needs " + list(blocked.map(function (g) {
            return g.map(typeName).join(" or ");
          })) + (fromInputs ? ", which this protocol doesn't start with."
                            : ", which earlier choices don't provide.");
        } else if (opt.state === "waiting") {
          opt.status.textContent = "Choose a method in step " + waitingOn + " first.";
        } else if (opt.state === "needs-sibling") {
          opt.status.textContent = "Select " + list(needs) + " above to use this method.";
        }
        opt.status.hidden = opt.state === "ok";

        if (opt.input.checked && opt.state !== "ok") {
          opt.input.checked = false;
          if (!opt.skip) step.cleared.push(opt.title);
        }
        if (opt.skip) return;   // "Skip this step" never counts as a method
        if (opt.state === "ok") openCount++;
        if (opt.state === "waiting" || opt.state === "needs-sibling") waitCount++;
        if (step.multiple && opt.input.checked) {
          opt.produces.forEach(function (t) { local[t] = true; });
        }
        earlier.push(opt);
      });

      var skip = skipOf(step);
      var picked = methodsOf(step).filter(function (o) { return o.input.checked; });
      var skipChecked = !!(skip && skip.input.checked);

      // Lift an automatic skip once a method here becomes possible again.
      if (skipChecked && step.autoSkip && (openCount || waitCount)) {
        skip.input.checked = false;
        skipChecked = false;
      }
      var autoSkipped = false;
      if (!picked.length && !skipChecked && openCount === 0 && waitCount === 0 && step.optional) {
        // Nothing here can run: an optional step is skipped rather than blocking.
        skip.input.checked = true;
        skipChecked = true;
        autoSkipped = true;
      } else if (!picked.length && !skipChecked && openCount === 1 && waitCount === 0 && !step.optional) {
        // A single compatible option with nothing pending is chosen automatically.
        var only = methodsOf(step).filter(function (o) { return o.state === "ok"; })[0];
        only.input.checked = true;
        picked = [only];
      }
      // A skip is also "automatic" when no method in the step could run anyway.
      if (step.optional && skipChecked && openCount === 0 && waitCount === 0) autoSkipped = true;

      step.selected = skipChecked ? [skip] : picked;
      step.options.forEach(function (o) { o.el.classList.toggle("is-chosen", step.selected.indexOf(o) !== -1); });

      var state;
      if (skipChecked) {
        state = "skipped";
      } else if (picked.length) {
        state = "chosen";
        picked.forEach(function (o) {
          o.produces.forEach(function (t) { if (!(t in available)) available[t] = step.num; });
        });
      } else {
        state = openCount ? "open" : waitCount ? "waiting" : "blocked";
        // Anything an undecided step could still produce is "pending" downstream.
        methodsOf(step).forEach(function (o) {
          if (o.state === "blocked") return;
          o.produces.forEach(function (t) {
            if (!(t in available) && !(t in pending)) pending[t] = step.num;
          });
        });
      }

      ["chosen", "skipped", "open", "waiting", "blocked"].forEach(function (s) {
        step.el.classList.toggle("step-" + s, s === state);
      });

      var msg = "";
      if (autoSkipped) {
        msg = "Skipped: no method for this optional step is compatible with your earlier choices.";
      } else if (state === "blocked" && step.options.length) {
        msg = "No method for this step is compatible with your earlier choices. Change an earlier selection to continue.";
      } else if (step.cleared.length) {
        msg = (step.cleared.length === 1 ? "Your earlier choice (" : "Your earlier choices (") +
          list(step.cleared) + (step.cleared.length === 1 ? ") is" : ") are") +
          " no longer compatible and " + (step.cleared.length === 1 ? "was" : "were") + " cleared.";
      }
      step.status.textContent = msg;
      step.status.hidden = !msg;
      step.status.classList.toggle("is-error", state === "blocked");
      step.autoSkip = autoSkipped;
    });

    renderSummary(available);
    syncUrl();
  }

  function renderSummary(available) {
    var any = steps.some(function (s) { return s.selected.length; });
    summary.hidden = !any;
    resetBtn.hidden = !any;
    if (!any) return;

    var pathList = summary.querySelector(".path-list");
    pathList.innerHTML = "";
    steps.forEach(function (s) {
      var li = document.createElement("li");
      var op = document.createElement("span");
      op.className = "path-op";
      op.textContent = s.title.trim();
      var m = document.createElement("span");
      var skipped = isSkipped(s);
      m.className = s.selected.length && !skipped ? "path-method" : "path-method is-empty";
      m.textContent = skipped ? "Skipped"
        : s.selected.length ? s.selected.map(function (o) { return o.title; }).join(" + ")
        : s.el.classList.contains("step-blocked") ? "No compatible method" : "Not chosen yet";
      li.appendChild(op);
      li.appendChild(m);
      if (s.el.classList.contains("step-blocked")) li.className = "is-error";
      if (skipped) li.className = "is-skipped";
      pathList.appendChild(li);
    });

    var produced = Object.keys(available).filter(function (t) { return available[t] > 0; });
    summary.querySelector(".path-outputs").textContent = produced.length
      ? produced.map(typeName).join(", ")
      : "Nothing yet.";
  }

  function syncUrl() {
    var params = new URLSearchParams(window.location.search);
    var path = steps.map(function (s) { return s.selected.map(function (o) { return o.slug; }).join("+"); });
    if (path.some(Boolean)) params.set("path", path.join(",")); else params.delete("path");
    var qs = params.toString();
    history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : "") + window.location.hash);
  }

  // Restore a shared path; incompatible entries are dropped by evaluate().
  // "+" may arrive decoded as a space, so accept either as the separator.
  var saved = (new URLSearchParams(window.location.search).get("path") || "").split(",");
  steps.forEach(function (s, i) {
    var slugs = (saved[i] || "").split(/[+ ]/).filter(Boolean);
    if (!s.multiple) slugs = slugs.slice(0, 1);
    s.options.forEach(function (o) { if (slugs.indexOf(o.slug) !== -1) o.input.checked = true; });
  });

  stepsEl.addEventListener("change", function (e) {
    if (!e.target.classList.contains("method-radio")) return;
    // In multi-select steps, "Skip this step" and the methods exclude each other.
    var stepEl = e.target.closest(".step");
    var step = steps.filter(function (s) { return s.el === stepEl; })[0];
    if (step && step.multiple && e.target.checked) {
      var isSkip = e.target.closest(".option-skip") !== null;
      step.options.forEach(function (o) {
        if (o.input !== e.target && o.skip !== isSkip) o.input.checked = false;
      });
    }
    if (step) step.autoSkip = false;
    steps.forEach(function (s) { s.cleared = []; });
    evaluate();
  });

  resetBtn.addEventListener("click", function () {
    steps.forEach(function (s) {
      s.cleared = [];
      s.options.forEach(function (o) { o.input.checked = false; });
    });
    evaluate();
  });

  help.hidden = false;
  evaluate();
})();
