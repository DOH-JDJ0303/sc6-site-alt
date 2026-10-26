---
title: Reference-based consensus calling
operation: genome-assembly-and-variant-calling
requires: [clean-reads, reference-genome]
produces: [consensus-genomes]
summary: Map reads to a reference and write a complete consensus sequence for each sample, including indels.
use_when:
  - The genome is small enough to compare as complete sequences, as with most viruses.
  - Indels carry signal you want to keep, such as deletions that define lineages.
  - You need a genome sequence per sample to share or submit to public databases.
  - The library is amplicon-based or otherwise sequenced to high, even depth.
avoid_when:
  - when: The genome is large (bacteria, fungi), so complete per-sample sequences are impractical to align and most positions are identical.
    use: reference-based-snp-calling
  - when: The sample is a pure isolate and no reference is close enough to map reads reliably, or the reference may be missing regions present in your samples.
    use: de-novo-assembly
  - Within-sample diversity is the question, such as mixed infections or minor variants, since a consensus keeps only the majority base.
diagram: reference-based-consensus-calling.svg
diagram_caption: >-
  Reads are stacked on the reference, and the majority base at each position becomes the consensus. Shared deletions are kept, and positions with no coverage are written as N.
implementations:
  - name: iVar consensus
    url: https://github.com/andersen-lab/ivar
---
Reads are mapped to a reference, and the consensus base is called wherever depth and allele frequency pass set thresholds. Low-coverage positions are written as N so missing data is not mistaken for a reference match. For segmented viruses, a consensus is generated per segment.

The output is one unaligned sequence per sample. Because sequences can differ in length where indels occur, they need a genome alignment step before tree building.
