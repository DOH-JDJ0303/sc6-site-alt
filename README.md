# Genomic Analysis Protocols

A Jekyll site for hosting analysis protocols built from shared, swappable parts.

- **Protocols** (`_protocols/`): an ordered list of steps for a specific goal.
- **Operations** (`_operations/`): what a step does, independent of how.
- **Methods** (`_methods/`): a specific way to carry out one operation.

Each file only describes itself. All cross-links are computed at build time:
protocol pages link to operations and methods, operation pages list their methods
and the protocols that use them, and method pages list every protocol that uses them.

## Questions

`_questions/` holds the questions readers start from. Each question points to
protocols by pathogen group, and a group can list several protocols to use
together:

```yaml
---
title: Is drug resistance spreading between cases?
order: 4                       # position in lists
summary: One-sentence description.
aliases: [AMR, plasmid, clonal spread]   # other wordings, used by search
routes:
  - organisms: Bacteria
    protocols:
      - planned: AMR gene detection and tracking   # not yet on the site
        role: Identify which isolates carry resistance genes.
      - protocol: bacterial-phylogenomic-surveillance
        role: Determine whether resistant isolates are closely related.
    note: How to interpret the results together (Markdown).
  - organisms: Fungi
    protocols: [fungal-phylogenomic-surveillance]   # a slug alone is fine
---
Introduction in Markdown.
```

The questions page searches titles, summaries, and `aliases`, ignoring common
words and word endings, and can be filtered by pathogen group (taken from the
`organisms` values). Searches can be linked as `/questions/?q=...&org=bacteria`.
Protocol pages list the questions that point to them. When a planned protocol is
added to the site, replace `planned:` with `protocol:` and its slug.

## Where guidance belongs

- **Operations** say *what* a step accomplishes. They never compare methods.
  Methods that are alternative ways to reach the same goal share one operation.
  When an operation's methods do *different* jobs that may all be needed (read
  preprocessing, site masking), set `selection: multiple` on the operation so
  readers can select one or more.
- **Methods** say *how*, and *when to use them* (`use_when`, `avoid_when`, and
  `combine_with` for complementary methods). This
  guidance appears on the method page, in the operation's "Choosing a method"
  section, beside each choice on protocol pages, and in exports.
- **Protocol step notes** are only for advice specific to that protocol, such as
  handling segmented genomes. Advice about which method to pick goes in the methods.

## Theme

The look follows the [PGCoE Network site](https://pgcoe.github.io/): a cyan network
navigation bar and footer, Raleway headings in deep teal, Lato body text, a white
title band with the network graphic, and a light teal-gray content area.

- Colors and fonts are CSS variables at the top of `assets/css/style.css`
  (`--pg-*` for the PGCoE palette; `--protocol`, `--operation`, `--method` for the
  three entity colors).
- The network navigation links, footer text, and header graphic are set under
  `network:` in `_config.yml`. Add `active: true` to a link to underline it, or
  remove the `network:` block to drop the PGCoE bar.

## Run locally

```sh
bundle install
bundle exec jekyll serve
```

Then open http://localhost:4000. For GitHub Pages under a project path, set
`baseurl: "/repo-name"` in `_config.yml`.

## Adding content

The file name is the slug used for references (e.g. `_methods/time-scaled-phylogeny.md`
is referenced as `time-scaled-phylogeny`).

### Operation

```yaml
---
title: Phylogenetic inference
order: 5                      # position on browse pages
selection: single             # or "multiple" when methods are complementary
summary: One-sentence description.
inputs: [Whole-genome alignment]
outputs: [Phylogenetic tree (Newick)]
---
Longer explanation in Markdown.
```

### Method

```yaml
---
title: Maximum likelihood phylogeny
operation: phylogenetic-inference   # slug of the operation it performs
requires:                           # all entries needed; a nested list = any one of
  - [recombination-free-alignment, full-alignment, snp-alignment]
produces: [tree]
summary: One-sentence description.
use_when:                           # required when the operation has other methods
  - You need a tree for clustering or placing new samples.
avoid_when:                         # plain text, or text plus the alternative to use
  - when: You need to date events such as introductions.
    use: time-scaled-phylogeny      # any existing method, usually in the same operation
implementations:
  - name: IQ-TREE
    url: https://iqtree.github.io/
---
Longer explanation in Markdown.
```

Write `use_when` and `avoid_when` as full sentences a reader can check against their
situation. Each `use:` becomes a "Use … instead" link.

For methods in a `selection: multiple` operation, list complementary methods with
`combine_with`, and use `avoid_when` for cases where the method isn't needed (it is
shown as "Skip this method when"):

```yaml
combine_with:
  - use: quality-and-adapter-trimming   # must be in the same operation
    why: Apply it first to remove adapters and low-quality bases.
```

### Protocol

```yaml
---
title: Bacterial genomic surveillance
summary: One-sentence description.
organisms: [Bacteria]
inputs: [raw-reads, reference-genome]               # data available before step 1
steps:
  - operation: read-preprocessing
    methods: [quality-and-adapter-trimming, amplicon-primer-trimming]
    # multi-select operation: reader picks one or more, applied in this order
  - operation: genome-assembly-and-variant-calling
    methods: [reference-based-snp-calling]   # optional restriction
    notes: Protocol-specific guidance for this step (Markdown).
  - operation: recombination-filtering              # no methods = any method allowed
    optional: true                                  # reader may skip this step
---
Introduction in Markdown.
```

A step with `methods` lists only those methods. The reader chooses one, or one or
more if the operation (or the step, via `selection: multiple`) allows combining. A step without `methods` shows every method for that operation. Method
pages distinguish protocols that **specify** them from protocols that **permit** them.

A step with `optional: true` is marked "Optional" everywhere it appears and gets a
"Skip this step" choice on the protocol page. A skipped step produces nothing, so
later methods that need its output become unavailable.

### Method diagrams

A method page can show a simple "How it works" diagram. Put an SVG in
`_includes/diagrams/` and name it in the method's front matter:

```yaml
diagram: reference-based-consensus-calling.svg
diagram_caption: >-
  One or two sentences stating what the picture shows.
```

The SVG is inlined into the page, so it uses the site's fonts, and it is included
in PDF exports. Give each SVG `role="img"` with a `<title>` and `<desc>` whose ids
are unique to that diagram. The four existing diagrams are generated by
`tools/make_diagrams.py` (`python3 tools/make_diagrams.py _includes/diagrams`),
which uses the same colors throughout: teal for the reference, light cyan for
reads, amber for differences, and gray for missing data.

## Interactive protocol pages

On a protocol page, readers choose one method per step, or one or more in steps
whose methods can be combined (checkboxes instead of radio buttons; the outputs of
every selected method become available downstream). Combined methods are applied
in the order listed, so a method can build on one selected above it in the same
step. For example, a time-scaled phylogeny takes the maximum likelihood tree as
input, and is enabled once that method is selected. Steps are evaluated in order,
starting from the protocol's `inputs`:

- A method is selectable only when everything in its `requires` is available,
  either as a protocol input or as the output of a method chosen earlier.
- Choosing a method adds its `produces` to what later steps can use.
- Methods that depend on an undecided earlier step show "Choose a method in step N first."
- Methods that can't be satisfied are disabled with the missing data named. If no
  method in a step works, the step is flagged so the reader changes an earlier choice.
- Changing an earlier choice clears later choices that are no longer compatible.
- A required step with only one compatible method is selected automatically.
- An optional step with no compatible method is skipped automatically instead of
  blocking the protocol. If a later change makes a method available again, the
  automatic skip is lifted so the reader can choose.

The chosen path is stored in the URL (`?path=a+b,-,c,...`: steps separated by `,`,
combined methods by `+`, and `-` for a skip), so a configured
protocol can be shared as a link. Data types are defined in `_data/data_types.yml`.

## Exporting a path

Below the path summary on each protocol page, readers can export their selections:

- **Print / Save as PDF**: opens the browser's print dialog with a clean document
  containing the path overview and, for each step, the operation, protocol notes,
  and the chosen method's full description, implementations, inputs and outputs.
- **Download Markdown**: the same content as an editable `.md` file.
- **Download JSON**: a machine-readable record (`format: protocol-path-export`,
  `version: 2`) with each step's status (`chosen`, `skipped`, `undecided`, `blocked`)
  and a `methods` list per step, in application order, with full method details.
- **Copy link**: the shareable `?path=` URL.

Every export records when it was generated, the link to the configured path, and
when the site was built. On GitHub Pages it also includes the commit
(`site.github.build_revision`). Incomplete paths can still be exported; unchosen
steps are marked as undecided.

Method details come from data embedded in each protocol page at build time
(`#protocol-data` in `_layouts/protocol.html`), so exports always match the method
pages from the same build.

## Validation

```sh
python3 tools/validate.py
```

Checks that every operation, method, and data-type reference resolves, that each restricted
method belongs to its step's operation, that every protocol has at least one complete path,
that every method sharing an operation with others has `use_when` guidance, and that
`combine_with` partners share an operation set to `selection: multiple`. Path counts
include every combination readers can select in multi-select steps. Unresolved
references also show in red on the built pages.
