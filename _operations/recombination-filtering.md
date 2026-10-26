---
title: Recombination filtering
order: 5
summary: Identify and remove variation introduced by recombination so the remaining signal reflects vertical descent.
inputs: [Whole-genome alignment]
outputs: [Recombination-filtered alignment, Recombinant region coordinates]
---
Recombination imports blocks of sequence from other lineages, producing clusters of variation that violate the single-tree assumption of most phylogenetic methods. Filtering removes those blocks before trees or distances are calculated.
