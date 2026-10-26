---
title: Are these cases related to each other?
order: 1
summary: Find out whether cases share a recent common source or belong to the same transmission chain, using whole-genome relatedness.
aliases: [linked cases, connected cases, cluster, outbreak, same strain, same source, common source, transmission, relatedness, epidemiological link, SNP distance]
routes:
  - organisms: Viruses
    protocols: [viral-phylogenomic-surveillance]
    note: >-
      Look for cases that cluster closely in the phylogeny. During fast spread,
      unrelated cases can carry identical genomes, so interpret closeness
      together with collection dates and epidemiological data.
  - organisms: Bacteria
    protocols: [bacterial-phylogenomic-surveillance]
    note: >-
      Use SNP distances and the phylogeny together, with a cluster threshold
      appropriate for your species. Filter recombination first so imported
      regions do not inflate distances.
  - organisms: Fungi
    protocols: [fungal-phylogenomic-surveillance]
    note: >-
      Use SNP distances and the phylogeny together. Thresholds for linked cases
      vary widely between fungal species, so use published values for your
      species where they exist.
---
Genomic relatedness can support or argue against a link between cases, but it cannot prove direct transmission on its own. Combine it with epidemiological information such as dates, locations, and contacts.
