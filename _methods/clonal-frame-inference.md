---
title: Clonal frame inference
operation: recombination-filtering
requires: [full-alignment, tree]
produces: [recombination-free-alignment]
summary: Model recombination along a fixed tree with a hidden Markov model and infer the clonal genealogy.
use_when:
  - You need estimates of recombination parameters, such as the rate of recombination relative to mutation.
  - A tree for the samples already exists from an earlier step.
avoid_when:
  - when: No tree exists yet, or you want filtering and a tree from a single step.
    use: iterative-recombination-detection
implementations:
  - name: ClonalFrameML
    url: https://github.com/xavierdidelot/ClonalFrameML
---
The method takes an existing tree and alignment and estimates which regions on each branch were imported by recombination, along with rate parameters. Imported regions can then be removed to produce a filtered alignment.
