---
title: Mobile element masking
operation: site-masking
requires: [reference-genome]
produces: [mask-regions]
summary: Mask prophages, insertion sequences, and other mobile elements in a bacterial reference.
use_when:
  - The organism is a bacterium whose genomes carry prophages, insertion sequences, or other horizontally acquired elements.
  - You want SNP distances and trees to reflect the chromosome's clonal history.
combine_with:
  - use: repeat-and-paralog-masking
    why: Add it when the reference also contains repeats such as rRNA operons or duplicated genes, which cause ambiguous read mapping.
  - use: custom-masking
    why: Add your own BED file for species-specific regions that prediction tools do not find.
implementations:
  - name: PHASTEST
    url: https://phastest.ca/
  - name: ISEScan
    url: https://github.com/xiezhq-hermann/isescan
---
Mobile elements move horizontally between lineages, so variation within them does not track the clonal history of the chromosome. Their coordinates are predicted on the reference and excluded from comparison.
