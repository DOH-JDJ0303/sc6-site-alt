---
title: Custom masking
operation: site-masking
requires: [reference-genome]
produces: [mask-regions]
summary: Mask regions you define yourself in a BED file, such as genes known to be unreliable for your species.
use_when:
  - Published analyses of your species exclude specific genes or regions, such as PE/PPE genes in Mycobacterium tuberculosis.
  - Your own data show regions with consistently poor coverage, mapping quality, or excess variant calls.
  - You need to reproduce another lab's analysis exactly, using the same mask they used.
avoid_when:
  - The regions can be found reproducibly with a prediction tool, which is easier to rerun when the reference changes.
combine_with:
  - use: mobile-element-masking
    why: Use both when you have species-specific regions in addition to predicted mobile elements.
  - use: repeat-and-paralog-masking
    why: Use both when you have species-specific regions in addition to repeats found by self-alignment.
implementations:
  - name: BEDTools
    url: https://bedtools.readthedocs.io/
---
A custom mask is a BED file listing reference regions to exclude. It is combined with any other masks before variant calling or alignment.

### Preparing the BED file

A BED file is plain text with one region per line and tab-separated columns:

```
chrom       start   end     name
contig_1    1200    3450    hypervariable_gene_A
contig_1    98000   101250  low_coverage_region
```

The column names are shown for clarity only; do not put a header line in the file. The values are illustrative, so use the sequence names and coordinates of your own reference.

- **`chrom`** must match the sequence name in the reference FASTA header exactly. This is the text after `>`, up to the first space. Check with `grep '>' reference.fasta`.
- **`start`** is 0-based and **`end`** is exclusive. To mask positions 101 to 200 as numbered in a genome browser or GFF file, write `100` and `200`.
- **`name`** is optional but recommended, so the mask documents why each region is excluded.

Regions can come from several sources:

- **From an annotation.** Extract genes by name from the reference's GFF file, converting GFF's 1-based start to BED's 0-based start (see the example below).
- **From coverage.** Find regions with low depth across samples, for example with `bedtools genomecov -bga` followed by filtering for depth below your threshold.
- **From the literature.** Enter published coordinates, converting them to your reference if they were reported on a different one.

For example, to mask every gene whose attributes match a name pattern (replace the pattern with your genes of interest):

```
awk -F'\t' '$3=="gene" && $9 ~ /PE_PGRS|PPE/ {print $1"\t"$4-1"\t"$5}' reference.gff > custom.bed
```

Before use, sort and merge the file so overlapping regions are combined. When using more than one masking method, merge all masks into one file:

```
cat custom.bed mobile_elements.bed | sort -k1,1 -k2,2n | bedtools merge > mask.bed
```

Keep the mask under version control alongside the protocol, and record which reference version its coordinates refer to.
