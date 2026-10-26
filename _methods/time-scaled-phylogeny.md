---
title: Time-scaled phylogeny
operation: phylogenetic-inference
requires: [tree, collection-dates]
produces: [dated-tree]
summary: Rescale an existing tree, usually a maximum likelihood tree, so branch lengths are in time and ancestral nodes are dated.
use_when:
  - You need dates for events, such as introductions, common ancestors, or transmission windows.
  - You already have a tree, such as a maximum likelihood tree, and accurate collection dates for most samples.
  - The dataset is too large for a full Bayesian analysis, or results are needed quickly.
avoid_when:
  - Dates are missing or imprecise, or a root-to-tip regression shows little temporal signal.
  - Samples were collected over a period too short for measurable evolution, so dates would be poorly constrained.
  - when: You need full uncertainty on the tree and dates, or phylodynamic estimates such as growth rates.
    use: bayesian-phylogeny
combine_with:
  - use: maximum-likelihood-phylogeny
    why: Build the maximum likelihood tree first; this method takes it as input.
implementations:
  - name: TreeTime
    url: https://github.com/neherlab/treetime
  - name: LSD2 (in IQ-TREE)
    url: https://github.com/tothuhien/lsd2
---
Sampling dates calibrate a molecular clock, which converts substitution branch lengths into time. The tree topology comes from the input tree. Only branch lengths, the root position, and node dates are estimated, which makes this much faster than Bayesian dating.

Check for temporal signal first: plot root-to-tip distance against sampling date and confirm a clear positive relationship before interpreting dates. For recombining bacteria, use a tree built from a recombination-filtered alignment.
