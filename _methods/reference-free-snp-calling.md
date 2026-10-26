---
title: Reference-free SNP calling
operation: genome-assembly-and-variant-calling
requires: [clean-reads]
produces: [snp-alignment]
summary: Identify SNPs shared across samples directly from split k-mers, without a reference genome.
use_when:
  - No suitable reference genome exists for your samples.
  - Samples span lineages diverse enough that a single reference would introduce mapping bias.
  - You need fast SNP distances for screening or a first look at a new collection.
avoid_when:
  - when: A later step needs genome positions, such as recombination filtering, because only variable sites are kept.
    use: reference-based-snp-calling
  - when: Indels carry signal you want to keep.
    use: reference-based-consensus-calling
diagram: reference-free-snp-calling.svg
diagram_caption: >-
  Split k-mers with identical flanks are matched across samples. Their middle bases become the columns of the SNP alignment, with no reference and no genome positions.
implementations:
  - name: SKA
    url: https://github.com/bacpop/ska.rust
---
Variation is detected from split k-mers, which are k-mers that match across samples except at their middle base. SNPs are found directly by comparing samples, so results do not depend on choosing a reference.

The output is an alignment of variable sites only. It is ready for tree building, but it carries no genome positions and does not capture indels. Because positions are unknown, recombination filtering cannot be applied afterward.
