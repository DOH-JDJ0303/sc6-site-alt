---
title: Phylogenetic inference
order: 6
selection: multiple   # some methods build on others, e.g. time-scaling an ML tree
summary: Reconstruct the evolutionary relationships among samples from an alignment.
inputs: [Whole-genome alignment (optionally masked or filtered), Collection dates (method-dependent)]
outputs: [Phylogenetic tree (Newick), Time-scaled tree (method-dependent)]
---
The resulting tree is the main product for interpreting population structure, identifying clusters, and placing new samples in context. More than one method can be applied in sequence, so a tree from one method can be the starting point for another.
