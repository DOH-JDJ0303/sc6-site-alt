---
title: Multiple sequence alignment
operation: genome-alignment
requires:
  - [consensus-genomes, genome-assemblies]   # any one: consensus genomes or curated assemblies
produces: [full-alignment]
summary: Align per-sample genome sequences so equivalent positions line up, optionally anchored to a reference to standardize coordinates.
use_when:
  - You have one genome sequence per sample (or per segment), from consensus calling or curated de novo assemblies.
  - Indels should be kept in the alignment.
  - You want positions reported in standard reference coordinates. Use the reference-guided mode described below.
implementations:
  - name: MAFFT
    url: https://mafft.cbrc.jp/alignment/software/
  - name: Nextclade (reference-guided)
    url: https://github.com/nextstrain/nextclade
  - name: minimap2 + gofasta (reference-guided)
    url: https://github.com/virus-evolution/gofasta
---
All sequences are placed in a shared set of columns so differences between samples can be counted and modeled. For segmented genomes, align each segment separately so segments with different histories are not merged.

### Joint or reference-guided alignment

The alignment can be built in two ways. Choose based on dataset size and whether insertions matter.

- **Joint alignment** (for example, MAFFT): all sequences are aligned to each other. Every indel is kept, including insertions not present in any reference. This works well for diverse sequences and small to moderate datasets.
- **Reference-guided alignment** (for example, Nextclade, minimap2 with gofasta, or MAFFT with `--keeplength --addfragments`): each sequence is aligned to a reference, so all sequences share the reference's coordinates. New samples can be added without realigning existing ones, and mutations can be reported in standard nomenclature. Insertions relative to the reference are removed from the alignment and reported separately.

For routine surveillance of a single virus with a well-established reference, reference-guided alignment is usually the better choice. If insertions are informative or no single reference represents the collection, use a joint alignment.
