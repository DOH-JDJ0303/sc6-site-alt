---
title: Reference-based SNP calling
operation: genome-assembly-and-variant-calling
requires: [clean-reads, reference-genome]
produces: [full-alignment, snp-alignment]
summary: Map reads to a reference, call SNPs, and combine samples into a core SNP alignment of positions present in every sample.
use_when:
  - The genome is large, as with bacteria and fungi, and differences between samples are mostly SNPs.
  - A closed reference from the same lineage as your samples is available.
  - A later step needs genome positions, such as recombination filtering or reporting variants by reference coordinate.
  - You need reproducible SNP distances for outbreak or cluster definitions.
avoid_when:
  - when: Indels are informative and genomes are small enough to compare in full, as with most viruses.
    use: reference-based-consensus-calling
  - when: No closely related reference exists, or samples span lineages diverse enough that much of each genome fails to map.
    use: reference-free-snp-calling
  - The organism is diploid and no ploidy-aware caller is used, since heterozygous sites will be miscalled.
diagram: reference-based-snp-calling.svg
diagram_caption: >-
  Each sample is compared with the reference. Positions missing in any sample are dropped from the core, and the variable positions that remain form the SNP alignment.
implementations:
  - name: Snippy
    url: https://github.com/tseemann/snippy
  - name: CFSAN SNP Pipeline
    url: https://github.com/CFSAN-Biostatistics/snp-pipeline
---
Each sample's reads are mapped to the reference and SNPs are called. Sample calls are then combined in reference coordinates, keeping only positions covered in every sample (the core genome). Results depend on the reference: a closely related one maximizes the core genome and the number of informative sites.

The method produces the alignment directly, so no separate genome alignment step is needed. It outputs both the full-length alignment, which recombination detection needs, and a SNP-only alignment, which is faster for tree building.

### A note on SNP and SNV

Strictly, a single-nucleotide polymorphism (SNP) is a variant common in a population, while a single-nucleotide variant (SNV) is any single-base difference, however rare. The differences called here are SNVs in that strict sense. This site uses SNP because it is the established term in microbial genomic epidemiology, as in "core SNP alignment", "SNP distance", and "SNP threshold", and in the names of tools such as Snippy and the CFSAN SNP Pipeline.
