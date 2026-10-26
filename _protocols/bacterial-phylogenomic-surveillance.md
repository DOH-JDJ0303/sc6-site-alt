---
title: Bacterial phylogenomic surveillance
summary: Determine how bacterial isolates are related to one another from whole-genome SNP phylogenies, for cluster detection and outbreak investigation.
organisms: [Bacteria]
inputs: [raw-reads, reference-genome, collection-dates]
steps:
  - operation: read-preprocessing
    methods: [quality-and-adapter-trimming]
  - operation: site-masking
    methods: [mobile-element-masking, repeat-and-paralog-masking, custom-masking]
    optional: true
    notes: Recommended for most bacterial references.
  - operation: genome-assembly-and-variant-calling
    methods: [reference-based-snp-calling, reference-free-snp-calling]
    notes: For the reference-based approach, choose a closed reference genome from the same lineage as the isolates where possible.
  - operation: recombination-filtering
    methods: [iterative-recombination-detection]
    optional: true
    notes: >-
      Strongly recommended for most bacterial species. Skipping is reasonable
      only for largely clonal species with little recombination.
  - operation: phylogenetic-inference
    methods: [maximum-likelihood-phylogeny, time-scaled-phylogeny]
---
This protocol compares whole genomes to measure relatedness between isolates. It is distinct from gene-targeted surveillance, such as detecting and tracking antimicrobial resistance genes. Bacteria recombine frequently, so the core SNP alignment is filtered for recombination before the final tree is built.
