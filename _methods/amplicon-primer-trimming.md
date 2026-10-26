---
title: Amplicon primer trimming
operation: read-preprocessing
requires:
  - [raw-reads, clean-reads]   # any one: runs on raw or quality-trimmed reads
  - primer-scheme
  - reference-genome
produces: [clean-reads]
summary: Remove primer sequence from amplicon-based reads using a primer scheme.
use_when:
  - The library was made with tiled amplicons, such as ARTIC-style schemes.
  - You have the BED file for the exact primer scheme and version used.
avoid_when:
  - The library is shotgun, so there are no primers to remove.
  - The primer scheme or its version is unknown, since trimming with the wrong scheme leaves primer sequence behind.
combine_with:
  - use: quality-and-adapter-trimming
    why: Apply it first to remove adapters and low-quality bases, which primer trimming does not fully address.
implementations:
  - name: iVar trim
    url: https://github.com/andersen-lab/ivar
---
Primer-binding sites reflect the primer sequence, not the sample, so primer sequence must be removed before calling variants. Reads are mapped to the reference, and primer positions from the scheme are soft-clipped.
