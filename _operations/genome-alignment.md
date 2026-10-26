---
title: Genome alignment
order: 4
summary: Arrange per-sample genome sequences so that equivalent positions line up across every sample.
inputs: [Per-sample genome sequences]
outputs: [Whole-genome alignment (FASTA)]
---
An alignment places homologous positions from every sample in the same column, so differences between samples can be counted and modeled. It is needed whenever the previous step produced one sequence per sample rather than an alignment.
