---
title: Viral phylogenomic surveillance
summary: Determine how viral genomes are related to one another from whole-genome phylogenies, for lineage tracking, introductions, and transmission, including segmented viruses.
organisms: [RNA viruses, Segmented viruses]
inputs: [raw-reads, primer-scheme, reference-genome, collection-dates]
steps:
  - operation: read-preprocessing
    methods: [quality-and-adapter-trimming, amplicon-primer-trimming]
  - operation: genome-assembly-and-variant-calling
    methods: [reference-based-consensus-calling, de-novo-assembly]
    notes: For segmented viruses, produce one sequence per segment, whether by consensus calling against a reference for each segment or by assigning assembled contigs to segments.
  - operation: genome-alignment
    methods: [multiple-sequence-alignment]
    notes: Align each segment separately rather than concatenating segments.
  - operation: phylogenetic-inference
    methods: [maximum-likelihood-phylogeny, time-scaled-phylogeny, bayesian-phylogeny]
    notes: >-
      Build one tree per segment for segmented viruses. Incongruent placements
      of the same sample across segment trees indicate possible reassortment.
---
This protocol compares complete viral genomes to measure relatedness and reconstruct spread. It is distinct from targeted surveillance, such as tracking specific antiviral resistance mutations. Viral genomes are small and diverse enough to compare as complete sequences, so every variant type is kept, including indels.
