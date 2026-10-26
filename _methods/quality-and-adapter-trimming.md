---
title: Quality and adapter trimming
operation: read-preprocessing
requires: [raw-reads]
produces: [clean-reads]
summary: Trim adapter sequence and low-quality bases from reads.
use_when:
  - Reads may contain adapter sequence, which is true of almost all Illumina libraries.
  - Base quality drops toward read ends or varies between runs.
  - The library is shotgun (whole-genome or metagenomic) or amplicon-based. Apply it in both cases.
combine_with:
  - use: amplicon-primer-trimming
    why: Required in addition for amplicon libraries, because quality trimming does not remove primer sequence.
implementations:
  - name: fastp
    url: https://github.com/OpenGene/fastp
  - name: Trimmomatic
    url: https://github.com/usadellab/Trimmomatic
---
Reads are scanned for adapter sequence, trimmed with a sliding quality window, and discarded if they fall below a minimum length. When combined with primer trimming, apply quality and adapter trimming first.
