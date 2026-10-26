---
title: When did this outbreak start, or when was the pathogen introduced?
order: 2
summary: Estimate when a group of cases began, or when a lineage arrived, by dating its common ancestor with a molecular clock.
aliases: [date, dating, timing, start date, introduction date, origin, emergence, how long has it been circulating, molecular clock, tMRCA, common ancestor]
routes:
  - organisms: Viruses
    protocols: [viral-phylogenomic-surveillance]
    note: >-
      In the phylogenetic inference step, select maximum likelihood and then
      time-scaled phylogeny. Choose Bayesian phylogeny instead when you need
      credible intervals on dates or estimates of epidemic growth.
  - organisms: Bacteria
    protocols: [bacterial-phylogenomic-surveillance]
    note: >-
      In the phylogenetic inference step, add time-scaled phylogeny. Filter
      recombination first, and check for temporal signal before trusting dates.
  - organisms: Fungi
    protocols: [fungal-phylogenomic-surveillance]
    note: >-
      In the phylogenetic inference step, add time-scaled phylogeny. Many fungi
      accumulate mutations slowly, so samples collected over a short period may
      not carry enough temporal signal to date events.
---
Dating relies on collection dates and on mutations accumulating at a measurable rate. Check for temporal signal before interpreting any date, for example with a root-to-tip regression.
