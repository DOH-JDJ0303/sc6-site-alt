---
title: Iterative recombination detection
operation: recombination-filtering
requires: [full-alignment]
produces: [recombination-free-alignment, tree]
summary: Alternate between tree building and detecting regions of elevated SNP density until the result converges.
use_when:
  - Samples are closely related, such as a single lineage or outbreak sharing a recent common ancestor.
  - You want a recombination-filtered alignment and a starting tree in one step.
  - No tree exists yet for your samples.
avoid_when:
  - when: You need estimates of recombination parameters, such as the relative effect of recombination and mutation.
    use: clonal-frame-inference
  - The collection spans many distantly related lineages, where run time grows and detection becomes less reliable.
implementations:
  - name: Gubbins
    url: https://github.com/nickjcroucher/gubbins
---
Recombinant regions appear as clusters of substitutions on a branch. This method repeatedly builds a tree, flags those clusters, masks them, and rebuilds until no new regions are found.
