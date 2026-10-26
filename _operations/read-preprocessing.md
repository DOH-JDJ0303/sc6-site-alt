---
title: Read preprocessing
order: 1
selection: multiple   # methods do different jobs and can be applied together
summary: Remove adapters, primers, and low-quality sequence so downstream steps work from clean reads.
inputs: [Raw sequencing reads (FASTQ)]
outputs: [Cleaned reads (FASTQ), QC report]
---
Preprocessing removes technical artifacts introduced during library preparation and sequencing, so that later steps measure differences between samples rather than differences between library preparations. Different artifacts need different treatments, so more than one method may apply to the same reads.
