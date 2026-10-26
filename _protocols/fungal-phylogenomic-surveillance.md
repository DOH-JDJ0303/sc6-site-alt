---
title: Fungal phylogenomic surveillance
summary: Determine how fungal isolates are related to one another from whole-genome SNP phylogenies, for cluster detection and outbreak investigation.
organisms: [Fungi]
inputs: [raw-reads, reference-genome, collection-dates]
steps:
  - operation: read-preprocessing
    methods: [quality-and-adapter-trimming]
  - operation: site-masking
    methods: [repeat-and-paralog-masking, custom-masking]
    optional: true
    notes: Gene duplication is common in fungal genomes, so repeat and paralog masking is recommended for most species.
  - operation: genome-assembly-and-variant-calling
    methods: [reference-based-snp-calling, reference-free-snp-calling]
    notes: For diploid species, use a ploidy-aware variant caller and decide how heterozygous sites will be represented.
  - operation: phylogenetic-inference
    methods: [maximum-likelihood-phylogeny, time-scaled-phylogeny]
---
This protocol compares whole genomes to measure relatedness between isolates. It is distinct from gene-targeted surveillance, such as detecting antifungal resistance mutations. Fungal genomes are larger and more repetitive than bacterial genomes, so masking duplicated regions of the reference is the key organism-specific step.
