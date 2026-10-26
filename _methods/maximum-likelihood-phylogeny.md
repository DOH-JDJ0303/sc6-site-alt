---
title: Maximum likelihood phylogeny
operation: phylogenetic-inference
requires:
  - [recombination-free-alignment, full-alignment, snp-alignment]   # any one
produces: [tree]
summary: Find the tree that best explains the alignment under a substitution model, with branch lengths in substitutions per site.
use_when:
  - You need a tree for clustering, population structure, or placing new samples. This is the default choice.
  - Collection dates are missing or unreliable.
  - You want a fast result with branch support values, even for thousands of genomes.
combine_with:
  - use: time-scaled-phylogeny
    why: Apply it afterward to convert this tree's branch lengths into time when collection dates are available.
implementations:
  - name: IQ-TREE
    url: https://iqtree.github.io/
  - name: RAxML-NG
    url: https://github.com/amkozlov/raxml-ng
---
The method is fast, well validated, and supports model selection and bootstrap support values. When the alignment contains only variable sites, apply an ascertainment bias correction or supply constant-site counts so branch lengths are not overestimated.

The resulting tree is also the usual starting point for a time-scaled phylogeny.
