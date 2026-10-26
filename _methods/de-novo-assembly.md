---
title: De novo assembly
operation: genome-assembly-and-variant-calling
requires: [clean-reads]
produces: [genome-assemblies]
summary: Assemble each sample's genome from its reads alone, without a reference.
use_when:
  - The sample is a pure isolate, such as a cultured virus, so all reads come from a single genome.
  - No reference is close enough to map reads reliably, or the reference may be missing regions present in your samples.
  - You want to detect insertions, rearrangements, or novel sequence that reference mapping would miss.
avoid_when:
  - when: The sample is clinical or otherwise mixed, since reads from host, other organisms, or co-infections end up in the assembly.
    use: reference-based-consensus-calling
  - when: Coverage is low or uneven, as is common with amplicon dropouts, which fragments the assembly.
    use: reference-based-consensus-calling
diagram: de-novo-assembly.svg
diagram_caption: >-
  Reads are joined wherever their ends share sequence, building longer contigs without a reference. An assembly usually produces several contigs that need curating before alignment.
implementations:
  - name: SPAdes (rnaviralSPAdes)
    url: https://github.com/ablab/spades
  - name: MEGAHIT
    url: https://github.com/voutcn/megahit
  - name: QUAST (assembly assessment)
    url: https://github.com/ablab/quast
---
Reads are assembled into contigs by finding overlaps between them, so the result does not depend on a reference genome.

### Curating contigs before alignment

Assemblies usually need manual curation before they can be aligned:

1. **Check completeness.** Compare contig lengths and coverage against the expected genome size. Tools such as QUAST report N50, total length, and misassemblies.
2. **Remove contaminants and artifacts.** Discard short, low-coverage contigs and any that match host or other organisms.
3. **Order and orient contigs.** Place contigs in a consistent order and strand, for example by matching them to a related genome. For segmented viruses, assign each contig to its segment.
4. **Trim ends.** Remove low-coverage or adapter-containing sequence at contig ends.
5. **Produce one sequence per sample (or per segment)** for the genome alignment step.
