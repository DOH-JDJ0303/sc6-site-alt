---
title: Repeat and paralog masking
operation: site-masking
requires: [reference-genome]
produces: [mask-regions]
summary: Mask repetitive and duplicated regions of a reference so reads cannot map ambiguously.
use_when:
  - The genome contains gene families, duplicated genes, or other repeats, as is common in fungi.
  - Variant calls cluster in regions with unusually high or uneven coverage.
combine_with:
  - use: mobile-element-masking
    why: Add it for bacteria, whose horizontally transferred elements are not necessarily repeated in the reference.
  - use: custom-masking
    why: Add your own BED file for species-specific regions that prediction tools do not find.
implementations:
  - name: MUMmer (nucmer self-alignment)
    url: https://github.com/mummer4/mummer
  - name: RepeatMasker
    url: https://www.repeatmasker.org/
---
Aligning the reference against itself reveals regions that occur more than once. Masking them prevents reads from duplicated genes being placed at the wrong copy, which would otherwise create false variant calls.
