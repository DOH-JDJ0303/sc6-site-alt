---
title: Site masking
order: 2
selection: multiple   # each method masks a different kind of region; masks are combined
summary: Exclude genomic regions whose variation would mislead downstream comparison.
inputs: [Reference genome]
outputs: [Mask coordinates (BED)]
---
Some regions produce variation that does not reflect shared ancestry or cannot be measured reliably. Masking them keeps them from inflating distances or distorting trees. Coordinates are defined on the reference so they apply identically to every sample. When more than one masking method is used, their regions are merged into a single mask.
