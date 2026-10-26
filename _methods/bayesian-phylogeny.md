---
title: Bayesian phylogeny
operation: phylogenetic-inference
requires:
  - [recombination-free-alignment, full-alignment, snp-alignment]   # any one
  - collection-dates
produces: [dated-tree]
summary: Jointly estimate a time-scaled tree, molecular clock, and population model, with uncertainty on every estimate.
use_when:
  - You need credible intervals on dates, such as when a lineage was introduced.
  - You want phylodynamic estimates, such as population growth, reproduction numbers, or migration between locations.
  - The dataset is small enough to run in reasonable time, typically hundreds to a few thousand short genomes, or a subsample of a larger collection.
avoid_when:
  - when: The dataset is large or results are needed routinely and quickly.
    use: time-scaled-phylogeny
  - when: Dates are missing or there is little temporal signal.
    use: maximum-likelihood-phylogeny
implementations:
  - name: BEAST X
    url: https://beast.community/
  - name: BEAST 2
    url: https://www.beast2.org/
---
Trees, clock rates, and population parameters are sampled together with Markov chain Monte Carlo (MCMC), so the results describe a range of plausible histories rather than a single tree. Summarize the posterior trees as a maximum clade credibility tree for display.

Runs can take hours to days. Check convergence before interpreting results: effective sample sizes above 200 for key parameters, with independent runs that agree.
