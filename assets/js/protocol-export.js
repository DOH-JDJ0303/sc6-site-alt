// Export the selected protocol path as a printable page (Save as PDF),
// a Markdown file, or a JSON record.
//
// Reads the current selections from the page (set by protocol-builder.js) and
// the full method details embedded at build time in #protocol-data. All three
// formats are rendered from the same document model built by buildModel().
// A step can have several selected methods when its methods are complementary;
// they are listed in the order they are applied.
(function () {
  var panel = document.querySelector(".export-panel");
  var dataEl = document.getElementById("protocol-data");
  if (!panel || !dataEl) return;

  var data, types = {};
  try { data = JSON.parse(dataEl.textContent); } catch (e) { panel.hidden = true; return; }
  try { types = JSON.parse(document.getElementById("data-types").textContent) || {}; } catch (e) {}

  var note = panel.querySelector(".export-note");
  var feedback = panel.querySelector(".export-feedback");
  var stepEls = document.querySelectorAll("#protocol-steps .step[data-step]");

  function typeName(k) { return (types[k] && types[k].name) || k; }
  function absUrl(u) { try { return new URL(u, window.location.href).href; } catch (e) { return u; } }
  function reqText(r) { return (Array.isArray(r) ? r : [r]).map(typeName).join(" or "); }
  function titles(ms) { return ms.map(function (m) { return m.title; }).join(" + "); }

  // ---------- Model ----------

  function stepStatus(el) {
    var chosen = Array.prototype.slice.call(el.querySelectorAll(".method-option.is-chosen"));
    if (chosen.length && chosen[0].classList.contains("option-skip")) return { status: "skipped", methods: [] };
    if (chosen.length) return { status: "chosen", methods: chosen.map(function (c) { return c.getAttribute("data-method"); }) };
    return { status: el.classList.contains("step-blocked") ? "blocked" : "undecided", methods: [] };
  }

  function methodModel(slug) {
    var m = data.methods[slug];
    if (!m) return null;
    var op = data.operations[m.operation] || {};
    return {
      combinable: !!op.multiple,
      slug: slug,
      title: m.title,
      summary: m.summary || null,
      url: absUrl(m.url),
      description_html: m.description_html || "",
      implementations: m.implementations || [],
      requires: m.requires || [],
      produces: m.produces || [],
      use_when: m.use_when || [],
      avoid_when: (m.avoid_when || []).map(function (a) {
        if (typeof a === "string") return { when: a, instead: null };
        var alt = a.use && data.methods[a.use];
        return { when: a.when, instead: alt ? { slug: a.use, title: alt.title, url: absUrl(alt.url) } : null };
      }),
      combine_with: (m.combine_with || []).map(function (c) {
        var alt = data.methods[c.use];
        return { why: c.why || "", method: { slug: c.use, title: alt ? alt.title : c.use, url: alt ? absUrl(alt.url) : null } };
      }),
      diagram_svg: m.diagram_svg || null,
      diagram_caption: m.diagram_caption || null
    };
  }

  function buildModel() {
    var outputs = [];
    var steps = Array.prototype.map.call(stepEls, function (el, i) {
      var def = data.steps[i] || {};
      var op = data.operations[def.operation] || { title: def.operation };
      var st = stepStatus(el);
      var methods = st.methods.map(methodModel).filter(Boolean);
      methods.forEach(function (m) {
        m.produces.forEach(function (t) { if (outputs.indexOf(t) === -1) outputs.push(t); });
      });
      return {
        number: i + 1,
        operation: { slug: def.operation, title: op.title, summary: op.summary || null, url: op.url ? absUrl(op.url) : null },
        optional: !!def.optional,
        multiple: !!def.multiple,
        status: st.status,
        notes: def.notes || null,
        notes_html: def.notes_html || null,
        methods: methods
      };
    });

    return {
      protocol: {
        slug: data.slug,
        title: data.title,
        summary: data.summary || null,
        organisms: data.organisms || [],
        inputs: data.inputs || [],
        intro_html: data.intro_html || ""
      },
      generated: new Date(),
      link: window.location.href,
      site: data.site || {},
      complete: steps.every(function (s) { return s.status === "chosen" || s.status === "skipped"; }),
      steps: steps,
      outputs: outputs
    };
  }

  function provenance(model) {
    var parts = ["Generated " + model.generated.toLocaleString()];
    if (model.site.built) parts.push("site built " + new Date(model.site.built).toLocaleString());
    if (model.site.revision) parts.push("revision " + String(model.site.revision).slice(0, 7));
    return parts.join(" · ");
  }

  function statusLabel(s) {
    return { skipped: "Skipped", undecided: "No method chosen", blocked: "No compatible method" }[s.status];
  }

  // ---------- JSON ----------

  function toJSON(model) {
    return JSON.stringify({
      format: "protocol-path-export",
      version: 2,
      generated: model.generated.toISOString(),
      source: {
        link: model.link,
        site: model.site.title || null,
        site_built: model.site.built || null,
        revision: model.site.revision || null
      },
      protocol: {
        slug: model.protocol.slug,
        title: model.protocol.title,
        summary: model.protocol.summary,
        organisms: model.protocol.organisms,
        inputs: model.protocol.inputs.map(function (k) { return { key: k, name: typeName(k) }; })
      },
      complete: model.complete,
      steps: model.steps.map(function (s) {
        return {
          number: s.number,
          operation: { slug: s.operation.slug, title: s.operation.title },
          optional: s.optional,
          multiple: s.multiple,
          status: s.status,
          notes: s.notes,
          // In application order. One entry for single-choice steps.
          methods: s.methods.map(function (m) {
            return {
              slug: m.slug,
              title: m.title,
              summary: m.summary,
              url: m.url,
              description: htmlToMarkdown(m.description_html),
              implementations: m.implementations,
              requires: m.requires,
              produces: m.produces,
              use_when: m.use_when,
              avoid_when: m.avoid_when.map(function (a) {
                return { when: a.when, instead: a.instead && { slug: a.instead.slug, title: a.instead.title } };
              }),
              combine_with: m.combine_with.map(function (c) {
                return { slug: c.method.slug, title: c.method.title, why: c.why };
              })
            };
          })
        };
      }),
      outputs: model.outputs.map(function (k) { return { key: k, name: typeName(k) }; })
    }, null, 2) + "\n";
  }

  // ---------- Markdown ----------

  // Small HTML -> Markdown converter covering what kramdown produces from
  // typical method descriptions: paragraphs, emphasis, code, links, lists,
  // headings, blockquotes and preformatted blocks.
  function htmlToMarkdown(html) {
    if (!html) return "";
    var doc = new DOMParser().parseFromString("<div>" + html + "</div>", "text/html");

    function inline(node) {
      var out = "";
      node.childNodes.forEach(function (n) {
        if (n.nodeType === 3) { out += n.textContent.replace(/\s+/g, " "); return; }
        if (n.nodeType !== 1) return;
        var tag = n.tagName.toLowerCase(), inner = inline(n);
        if (tag === "strong" || tag === "b") out += "**" + inner + "**";
        else if (tag === "em" || tag === "i") out += "_" + inner + "_";
        else if (tag === "code") out += "`" + n.textContent + "`";
        else if (tag === "a") out += "[" + inner + "](" + absUrl(n.getAttribute("href") || "") + ")";
        else if (tag === "br") out += "  \n";
        else out += inner;
      });
      return out;
    }

    function block(node, indent) {
      var parts = [];
      node.childNodes.forEach(function (n) {
        if (n.nodeType === 3) { if (n.textContent.trim()) parts.push(n.textContent.trim()); return; }
        if (n.nodeType !== 1) return;
        var tag = n.tagName.toLowerCase();
        if (/^h[1-6]$/.test(tag)) {
          // Nest under the method's own heading level.
          parts.push("######".slice(0, Math.min(6, +tag[1] + 4)) + " " + inline(n).trim());
        } else if (tag === "ul" || tag === "ol") {
          var items = [];
          Array.prototype.forEach.call(n.children, function (li, i) {
            var marker = tag === "ol" ? (i + 1) + ". " : "- ";
            items.push(indent + marker + block(li, indent + "   ").trim());
          });
          parts.push(items.join("\n"));
        } else if (tag === "pre") {
          parts.push("```\n" + n.textContent.replace(/\n$/, "") + "\n```");
        } else if (tag === "blockquote") {
          parts.push(block(n, "").split("\n").map(function (l) { return "> " + l; }).join("\n"));
        } else if (tag === "p" || tag === "li") {
          parts.push(inline(n).trim());
        } else if (tag === "div" || tag === "section") {
          parts.push(block(n, indent));
        } else {
          parts.push(inline(n).trim());
        }
      });
      return parts.filter(Boolean).join("\n\n");
    }

    return block(doc.body.firstChild, "");
  }

  function methodMarkdown(m, L, heading) {
    if (heading) L.push(heading, "");
    L.push("**Method:** [" + m.title + "](" + m.url + ")  ");
    if (m.requires.length) L.push("**Needs:** " + m.requires.map(reqText).join(", ") + "  ");
    if (m.produces.length) L.push("**Produces:** " + m.produces.map(typeName).join(", ") + "  ");
    L.push("");
    if (m.summary) L.push(m.summary, "");
    var desc = htmlToMarkdown(m.description_html);
    if (desc) L.push(desc, "");
    if (m.use_when.length) {
      L.push("**Use when:**", "");
      m.use_when.forEach(function (u) { L.push("- " + u); });
      L.push("");
    }
    if (m.avoid_when.length) {
      L.push(m.combinable ? "**Skip this method when:**" : "**Use another method when:**", "");
      m.avoid_when.forEach(function (a) {
        L.push("- " + a.when + (a.instead ? " Use [" + a.instead.title + "](" + a.instead.url + ") instead." : ""));
      });
      L.push("");
    }
    if (m.combine_with.length) {
      L.push("**Combine with:**", "");
      m.combine_with.forEach(function (c) {
        L.push("- " + (c.method.url ? "[" + c.method.title + "](" + c.method.url + ")" : c.method.title) + (c.why ? ": " + c.why : ""));
      });
      L.push("");
    }
    if (m.implementations.length) {
      L.push("**Implementations:**", "");
      m.implementations.forEach(function (impl) {
        L.push("- " + (impl.url ? "[" + impl.name + "](" + impl.url + ")" : impl.name));
      });
      L.push("");
    }
  }

  function toMarkdown(model) {
    var p = model.protocol, L = [];
    L.push("# " + p.title, "");
    if (p.summary) L.push(p.summary, "");
    if (p.organisms.length) L.push("**Organisms:** " + p.organisms.join(", ") + "  ");
    if (p.inputs.length) L.push("**Starting inputs:** " + p.inputs.map(typeName).join(", ") + "  ");
    L.push("**Source:** <" + model.link + ">  ");
    L.push("**" + provenance(model) + "**", "");
    if (!model.complete) L.push("> **Incomplete path:** some steps have no method selected.", "");
    var intro = htmlToMarkdown(p.intro_html);
    if (intro) L.push(intro, "");

    L.push("## Steps", "");
    model.steps.forEach(function (s) {
      var head = "### " + s.number + ". " + s.operation.title + (s.optional ? " (optional)" : "");
      L.push(head + " — " + (s.methods.length ? titles(s.methods) : statusLabel(s)), "");
      if (s.notes) L.push("**Protocol notes:** " + s.notes.trim(), "");
      if (s.methods.length > 1) {
        L.push("_Apply these methods in the order listed._", "");
        s.methods.forEach(function (m, i) {
          methodMarkdown(m, L, "#### " + s.number + String.fromCharCode(97 + i) + ". " + m.title);
        });
      } else if (s.methods.length) {
        methodMarkdown(s.methods[0], L);
      }
    });

    L.push("## Data produced", "");
    L.push(model.outputs.length ? model.outputs.map(function (t) { return "- " + typeName(t); }).join("\n") : "_Nothing yet._", "");
    return L.join("\n").replace(/\n{3,}/g, "\n\n");
  }

  // ---------- Print ----------

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function methodHTML(m, h, label) {
    h.push("<h4>" + esc(label) + esc(m.title) + "</h4>");
    if (m.summary) h.push("<p><em>" + esc(m.summary) + "</em></p>");
    if (m.description_html) h.push('<div class="pv-desc">' + m.description_html + "</div>");
    if (m.diagram_svg) {
      h.push('<figure class="pv-diagram">' + m.diagram_svg +
        (m.diagram_caption ? "<figcaption>" + esc(m.diagram_caption) + "</figcaption>" : "") + "</figure>");
    }
    if (m.use_when.length || m.avoid_when.length || m.combine_with.length) {
      h.push('<div class="pv-guidance">');
      if (m.use_when.length) {
        h.push("<div><p class=\"pv-glabel\">Use when</p><ul>" + m.use_when.map(function (u) {
          return "<li>" + esc(u) + "</li>";
        }).join("") + "</ul></div>");
      }
      if (m.avoid_when.length) {
        h.push("<div><p class=\"pv-glabel\">" + (m.combinable ? "Skip this method when" : "Use another method when") + "</p><ul>" + m.avoid_when.map(function (a) {
          return "<li>" + esc(a.when) + (a.instead ? " <em>Use " + esc(a.instead.title) + " instead.</em>" : "") + "</li>";
        }).join("") + "</ul></div>");
      }
      if (m.combine_with.length) {
        h.push("<div><p class=\"pv-glabel\">Combine with</p><ul>" + m.combine_with.map(function (c) {
          return "<li><strong>" + esc(c.method.title) + "</strong>" + (c.why ? ": " + esc(c.why) : "") + "</li>";
        }).join("") + "</ul></div>");
      }
      h.push("</div>");
    }
    h.push('<dl class="pv-meta">');
    if (m.requires.length) h.push("<dt>Needs</dt><dd>" + esc(m.requires.map(reqText).join(", ")) + "</dd>");
    if (m.produces.length) h.push("<dt>Produces</dt><dd>" + esc(m.produces.map(typeName).join(", ")) + "</dd>");
    if (m.implementations.length) {
      h.push("<dt>Implementations</dt><dd>" + m.implementations.map(function (impl) {
        return esc(impl.name) + (impl.url ? ' <span class="pv-url">(' + esc(impl.url) + ")</span>" : "");
      }).join("<br>") + "</dd>");
    }
    h.push("<dt>Method page</dt><dd class=\"pv-url\">" + esc(m.url) + "</dd>");
    h.push("</dl>");
  }

  function toPrintHTML(model) {
    var p = model.protocol, h = [];
    h.push('<header class="pv-head">');
    h.push('<p class="pv-eyebrow">Protocol</p><h1>' + esc(p.title) + "</h1>");
    if (p.summary) h.push('<p class="pv-lede">' + esc(p.summary) + "</p>");
    h.push('<dl class="pv-meta">');
    if (p.organisms.length) h.push("<dt>Organisms</dt><dd>" + esc(p.organisms.join(", ")) + "</dd>");
    if (p.inputs.length) h.push("<dt>Starting inputs</dt><dd>" + esc(p.inputs.map(typeName).join(", ")) + "</dd>");
    h.push("<dt>Source</dt><dd class=\"pv-url\">" + esc(model.link) + "</dd>");
    h.push("<dt>Record</dt><dd>" + esc(provenance(model)) + "</dd>");
    h.push("</dl>");
    if (!model.complete) h.push('<p class="pv-warning">Incomplete path: some steps have no method selected.</p>');
    h.push("</header>");
    if (p.intro_html) h.push('<div class="pv-intro">' + p.intro_html + "</div>");

    h.push('<h2 class="pv-section">Path overview</h2><ol class="pv-overview">');
    model.steps.forEach(function (s) {
      h.push("<li><span>" + esc(s.operation.title) + (s.optional ? " <em>(optional)</em>" : "") + "</span><strong>" +
        esc(s.methods.length ? titles(s.methods) : statusLabel(s)) + "</strong></li>");
    });
    h.push("</ol>");

    h.push('<h2 class="pv-section">Steps</h2>');
    model.steps.forEach(function (s) {
      h.push('<section class="pv-step pv-' + s.status + '">');
      h.push("<h3><span class=\"pv-num\">" + s.number + "</span> " + esc(s.operation.title) +
        (s.optional ? ' <span class="pv-tag">Optional</span>' : "") + "</h3>");
      if (s.operation.summary) h.push('<p class="pv-muted">' + esc(s.operation.summary) + "</p>");
      if (s.notes_html) h.push('<div class="pv-notes"><strong>Protocol notes.</strong> ' + s.notes_html + "</div>");
      if (s.methods.length > 1) {
        h.push('<p class="pv-muted"><em>Apply these methods in the order listed.</em></p>');
        s.methods.forEach(function (m, i) {
          methodHTML(m, h, s.number + String.fromCharCode(97 + i) + ". Method: ");
        });
      } else if (s.methods.length) {
        methodHTML(s.methods[0], h, "Method: ");
      } else {
        h.push('<p class="pv-status">' + esc(statusLabel(s)) + "</p>");
      }
      h.push("</section>");
    });

    h.push('<h2 class="pv-section">Data produced</h2><p>' +
      esc(model.outputs.length ? model.outputs.map(typeName).join(", ") : "Nothing yet.") + "</p>");
    return h.join("\n");
  }

  // ---------- Actions ----------

  function filename(ext) {
    var d = new Date(), pad = function (n) { return String(n).padStart(2, "0"); };
    return (data.slug || "protocol") + "-" + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "." + ext;
  }

  function download(text, name, type) {
    var url = URL.createObjectURL(new Blob([text], { type: type }));
    var a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function say(msg) {
    feedback.textContent = msg;
    clearTimeout(say.t);
    say.t = setTimeout(function () { feedback.textContent = ""; }, 4000);
  }

  function printView(model) {
    var view = document.getElementById("print-view");
    if (!view) {
      view = document.createElement("div");
      view.id = "print-view";
      document.body.appendChild(view);
    }
    view.innerHTML = toPrintHTML(model);
    document.body.classList.add("printing-path");
    window.addEventListener("afterprint", function done() {
      document.body.classList.remove("printing-path");
      window.removeEventListener("afterprint", done);
    });
    window.print();
  }

  function copyLink() {
    var url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { say("Link copied."); }, fallback);
    } else fallback();
    function fallback() { window.prompt("Copy this link:", url); }
  }

  panel.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-export]");
    if (!btn) return;
    var kind = btn.getAttribute("data-export");
    if (kind === "link") return copyLink();
    var model = buildModel();
    if (kind === "print") printView(model);
    if (kind === "markdown") { download(toMarkdown(model), filename("md"), "text/markdown"); say("Markdown downloaded."); }
    if (kind === "json") { download(toJSON(model), filename("json"), "application/json"); say("JSON downloaded."); }
  });

  // Keep the incompleteness note current as selections change.
  function updateNote() {
    var open = Array.prototype.filter.call(stepEls, function (el) {
      var s = stepStatus(el).status;
      return s === "undecided" || s === "blocked";
    }).length;
    note.hidden = !open;
    note.textContent = open
      ? open + (open === 1 ? " step has" : " steps have") + " no method yet. You can still export; " +
        (open === 1 ? "it will be" : "they will be") + " marked as undecided."
      : "";
  }
  document.getElementById("protocol-steps").addEventListener("change", updateNote);
  var reset = document.querySelector(".reset-path");
  if (reset) reset.addEventListener("click", function () { setTimeout(updateNote, 0); });
  updateNote();

  // Expose renderers for testing and reuse.
  window.ProtocolExport = { buildModel: buildModel, toMarkdown: toMarkdown, toJSON: toJSON, toPrintHTML: toPrintHTML, htmlToMarkdown: htmlToMarkdown };
})();
