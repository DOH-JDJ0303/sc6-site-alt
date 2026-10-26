---
title: Genome assembly and variant calling
order: 3
summary: Reconstruct each sample's genome, or the differences between samples, from its sequencing reads.
inputs: [Clean reads, Reference genome (method-dependent)]
outputs: [Per-sample genomes, or an alignment of variable sites across samples]
---
This is where sequencing reads become sequence-level comparisons between samples. Every downstream comparison, including distances, clusters, and trees, depends on which differences are detected here and how missing or ambiguous positions are recorded.
