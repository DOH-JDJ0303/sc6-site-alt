"""Generate the method diagrams as self-contained inline SVGs.

Usage:  python3 tools/make_diagrams.py _includes/diagrams

Shared visual language:
  reference = teal cells, reads = light cyan cells, differences = amber,
  missing data = gray, excluded = hatched-free light overlay.
"""
import os, sys
from xml.sax.saxutils import escape

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

TEAL, TEAL_MID, CYAN = "#055A5E", "#027B84", "#01B1D3"
READ_BG, READ_LINE = "#E3F5F9", "#9ED8E6"
AMBER, AMBER_BG = "#95560A", "#F7E8D4"
GRAY, GRAY_BG = "#7C8B8D", "#E9EEEF"
MUTED, TEXT = "#4B5D5F", "#1B1B1B"
HEAD = "Raleway, Lato, Arial, sans-serif"
BODY = "Lato, Arial, sans-serif"
MONO = "ui-monospace, Menlo, Consolas, monospace"


class SVG:
    def __init__(self, w, h, label):
        self.w, self.h, self.label, self.parts = w, h, label, []

    def add(self, s):
        self.parts.append(s)

    def text(self, x, y, s, size=13, fill=TEXT, anchor="start", weight="400", family=BODY, italic=False):
        style = ' font-style="italic"' if italic else ""
        self.add(f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" font-weight="{weight}" '
                 f'fill="{fill}" text-anchor="{anchor}"{style}>{escape(s)}</text>')

    def title(self, x, y, s, anchor="start"):
        self.text(x, y, s, size=14, fill=TEAL, weight="700", family=HEAD, anchor=anchor)

    def rect(self, x, y, w, h, fill, stroke="none", rx=3, sw=1, dash=None, opacity=None):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        o = f' fill-opacity="{opacity}"' if opacity is not None else ""
        self.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"{o} stroke="{stroke}" stroke-width="{sw}"{d}/>')

    def arrow(self, x1, y1, x2, y2, label=None, color=TEAL_MID):
        self.add(f'<line x1="{x1}" y1="{y1}" x2="{x2 - 8}" y2="{y2}" stroke="{color}" stroke-width="2"/>')
        self.add(f'<polygon points="{x2},{y2} {x2 - 10},{y2 - 5} {x2 - 10},{y2 + 5}" fill="{color}"/>')
        if label:
            lines = label if isinstance(label, (list, tuple)) else [label]
            for i, ln in enumerate(lines):
                self.text((x1 + x2) / 2, y1 - 10 - (len(lines) - 1 - i) * 14, ln, size=11.5, fill=TEAL_MID,
                          anchor="middle", weight="700", family=HEAD)

    def save(self, name, desc):
        sid = name.replace(".svg", "")
        body = "\n  ".join(self.parts)
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" '
               f'role="img" aria-labelledby="{sid}-title {sid}-desc" class="diagram-svg">\n'
               f'  <title id="{sid}-title">{escape(self.label)}</title>\n'
               f'  <desc id="{sid}-desc">{escape(desc)}</desc>\n  {body}\n</svg>\n')
        open(os.path.join(OUT, name), "w").write(svg)


def seq_row(svg, x0, y, cell, seq, kind="read", start=0, highlight=(), missing=(), size=13, outline=True):
    """Draw one row of bases. kind: ref | read | plain. Spaces leave gaps."""
    n = len(seq)
    first = next((i for i, c in enumerate(seq) if c != " "), None)
    last = max((i for i, c in enumerate(seq) if c != " "), default=None)
    if kind == "read" and first is not None and outline:
        svg.rect(x0 + first * cell + 1, y, (last - first + 1) * cell - 2, cell - 4, READ_BG, READ_LINE, rx=4)
    for i, c in enumerate(seq):
        if c == " ":
            continue
        cx = x0 + i * cell + cell / 2
        fill, weight = TEXT, "400"
        if kind == "ref":
            svg.rect(x0 + i * cell + 1, y, cell - 2, cell - 4, TEAL, rx=2)
            fill = "#FFFFFF"
        if i in highlight:
            svg.rect(x0 + i * cell + 2, y + 1, cell - 4, cell - 6, AMBER_BG, AMBER, rx=2)
            fill, weight = AMBER, "700"
        if i in missing:
            svg.rect(x0 + i * cell + 2, y + 1, cell - 4, cell - 6, GRAY_BG, rx=2)
            fill = GRAY
        if c == ".":
            fill = "#9AA7A8"
        svg.text(cx, y + cell - 9, c, size=size, fill=fill, anchor="middle", weight=weight, family=MONO)


# ---------------------------------------------------------------------------
# 1. Reference-based consensus calling
# ---------------------------------------------------------------------------
def consensus():
    cell, x0, top = 24, 118, 44
    ref = "ACGTACGTTACGATCG"
    reads = [
        "ACGTACGC        ",
        "  GTACGCTAC     ",
        "     CGCTAC-AT  ",
        "      GTTAC-AT  ",
    ]
    cons = "ACGTACGCTAC-ATNN"
    s = SVG(760, 236, "Reference-based consensus calling: reads are stacked on a reference and the majority base at each position becomes the sample's consensus.")
    s.title(20, 26, "1. Map reads to the reference")
    s.text(x0 - 12, top + cell - 9, "Reference", anchor="end", size=12.5, fill=TEAL, weight="700", family=HEAD)
    seq_row(s, x0, top, cell, ref, "ref")
    for r, rd in enumerate(reads):
        y = top + (r + 1) * cell + 4
        s.text(x0 - 12, y + cell - 9, f"Read {r + 1}", anchor="end", size=12, fill=MUTED)
        hl = {i for i, c in enumerate(rd) if c not in " " and c != ref[i]}
        seq_row(s, x0, y, cell, rd, "read", highlight=hl)
    # column guide for the SNP and the deletion
    for col in (7, 11):
        s.rect(x0 + col * cell, top - 4, cell, 5 * cell + 12 + 46, "none", AMBER, rx=4, sw=1.2, dash="3 3")
    # consensus row
    yc = top + 5 * cell + 46
    s.title(20, yc - 14, "2. Call the majority base")
    s.text(x0 - 12, yc + cell - 9, "Consensus", anchor="end", size=12.5, fill=AMBER, weight="700", family=HEAD)
    seq_row(s, x0, yc, cell, cons, "read", highlight={7, 11}, missing={14, 15})
    # callouts
    cx = x0 + 16 * cell + 26
    s.text(cx, top + 2 * cell + 2, "3 of 4 reads show C,", size=12.5, fill=AMBER, weight="700")
    s.text(cx, top + 2 * cell + 18, "so the consensus is C", size=12.5, fill=TEXT)
    s.text(cx, top + 4 * cell + 2, "Reads share a deletion,", size=12.5, fill=AMBER, weight="700")
    s.text(cx, top + 4 * cell + 18, "so the consensus keeps it", size=12.5, fill=TEXT)
    s.text(cx, yc + 4, "No reads cover the end,", size=12.5, fill=GRAY, weight="700")
    s.text(cx, yc + 20, "so those bases are N", size=12.5, fill=TEXT)
    s.save("reference-based-consensus-calling.svg",
           "Four reads are mapped to a 16-base reference. At one position three of four reads carry C instead of T, so the consensus calls C. "
           "Reads share a one-base deletion, which the consensus keeps. The last two positions have no coverage and are written as N.")


# ---------------------------------------------------------------------------
# 2. Reference-based SNP calling
# ---------------------------------------------------------------------------
def core_snp():
    cell, x0, top = 24, 118, 60
    ref = "ACGTACGTTACGATCG"
    rows = {
        "Sample A": ".T.....C........",
        "Sample B": "NN.....C.....A..",
        "Sample C": "....G.........NN",
    }
    s = SVG(760, 252, "Reference-based SNP calling: each sample's SNPs are called against a reference, positions missing in any sample are dropped, and the remaining variable positions form the SNP alignment.")
    s.title(20, 26, "1. Call SNPs in each sample against the reference")
    # excluded (non-core) columns
    for col in (0, 1, 14, 15):
        s.rect(x0 + col * cell, top - 4, cell, 4 * cell + 14, GRAY_BG, rx=3)
    s.text(x0 + cell, top + 4 * cell + 26, "not in core", size=11.5, fill=GRAY, anchor="middle", weight="700", family=HEAD)
    s.text(x0 + 15 * cell, top + 4 * cell + 26, "not in core", size=11.5, fill=GRAY, anchor="middle", weight="700", family=HEAD)
    s.text(x0 - 12, top + cell - 9, "Reference", anchor="end", size=12.5, fill=TEAL, weight="700", family=HEAD)
    seq_row(s, x0, top, cell, ref, "ref")
    for r, (name, row) in enumerate(rows.items()):
        y = top + (r + 1) * cell + 4
        s.text(x0 - 12, y + cell - 9, name, anchor="end", size=12, fill=MUTED)
        hl = {i for i, c in enumerate(row) if c not in ".N"}
        miss = {i for i, c in enumerate(row) if c == "N"}
        seq_row(s, x0, y, cell, row, "read", highlight=hl, missing=miss)
    s.text(x0 + 6 * cell, top + 4 * cell + 26, "· = matches reference", size=11.5, fill=MUTED, anchor="middle")
    s.text(x0 + 10.5 * cell, top + 4 * cell + 26, "N = no coverage", size=11.5, fill=MUTED, anchor="middle")

    # arrow to SNP alignment
    ax = x0 + 16 * cell + 16
    s.arrow(ax, top + 2.7 * cell, ax + 96, top + 2.7 * cell, ["keep variable", "core sites"])
    # SNP alignment: columns 4, 7, 13
    sx = ax + 124
    cols = [4, 7, 13]
    s.title(sx, 26, "2. SNP alignment")
    for j, c in enumerate(cols):
        s.text(sx + j * cell + cell / 2, top - 8, str(c + 1), size=11, fill=MUTED, anchor="middle")
    seq_row(s, sx, top, cell, "".join(ref[c] for c in cols), "ref")
    full = {name: "".join(ref[i] if ch == "." else ch for i, ch in enumerate(row)) for name, row in rows.items()}
    for r, name in enumerate(rows):
        y = top + (r + 1) * cell + 4
        bases = "".join(full[name][c] for c in cols)
        hl = {j for j, c in enumerate(cols) if full[name][c] != ref[c]}
        seq_row(s, sx, y, cell, bases, "read", highlight=hl)
    s.text(sx + 1.5 * cell, top + 4 * cell + 26, "position", size=11, fill=MUTED, anchor="middle")
    s.save("reference-based-snp-calling.svg",
           "Three samples are compared with a 16-base reference. Positions where any sample has no coverage are excluded from the core, "
           "which also drops a SNP that only one sample carried there. The three variable positions left in the core form the SNP alignment.")


# ---------------------------------------------------------------------------
# 3. Reference-free SNP calling (split k-mers)
# ---------------------------------------------------------------------------
def reference_free():
    cell, x0 = 24, 118
    groups = [
        ("Split k-mer 1", "ACG", "TCA", {"Sample A": "T", "Sample B": "C", "Sample C": "T"}),
        ("Split k-mer 2", "GGA", "CTT", {"Sample A": "A", "Sample B": "A", "Sample C": "G"}),
    ]
    s = SVG(760, 316, "Reference-free SNP calling: split k-mers whose flanking sequence matches across samples are grouped, and the middle base of each becomes one column of the SNP alignment.")
    s.title(20, 26, "1. Match split k-mers across samples")
    y = 44
    for g, (name, left, right, mids) in enumerate(groups):
        s.text(x0, y + 12, name, size=12.5, fill=TEAL, weight="700", family=HEAD)
        y += 20
        for sample, mid in mids.items():
            s.text(x0 - 12, y + cell - 9, sample, anchor="end", size=12, fill=MUTED)
            seq = left + mid + right
            hl = {3} if len(set(mids.values())) > 1 and mid != max(set(mids.values()), key=list(mids.values()).count) else set()
            seq_row(s, x0, y, cell, seq, "read", highlight=hl)
            # mark the variable middle position
            s.rect(x0 + 3 * cell + 1, y, cell - 2, cell - 4, "none", AMBER, rx=2, sw=1.4)
            y += cell
        y += 14
    # flank labels
    s.text(x0 + 1.5 * cell, y + 4, "flank", size=11.5, fill=MUTED, anchor="middle")
    s.text(x0 + 3.5 * cell, y + 4, "middle", size=11.5, fill=AMBER, anchor="middle", weight="700", family=HEAD)
    s.text(x0 + 5.5 * cell, y + 4, "flank", size=11.5, fill=MUTED, anchor="middle")

    ax = x0 + 7 * cell + 30
    mid_y = 66 + 1.5 * cell
    s.arrow(ax, mid_y, ax + 120, mid_y, ["collect the", "middle bases"])
    sx = ax + 220
    s.title(sx, 26, "2. SNP alignment")
    s.text(sx + cell * 0.5, 58, "k1", size=11, fill=MUTED, anchor="middle")
    s.text(sx + cell * 1.5, 58, "k2", size=11, fill=MUTED, anchor="middle")
    yy = 66
    for sample in groups[0][3]:
        bases = groups[0][3][sample] + groups[1][3][sample]
        hl = set()
        for j, gr in enumerate(groups):
            vals = list(gr[3].values())
            if gr[3][sample] != max(set(vals), key=vals.count):
                hl.add(j)
        s.text(sx - 12, yy + cell - 9, sample, anchor="end", size=12, fill=MUTED)
        seq_row(s, sx, yy, cell, bases, "read", highlight=hl)
        yy += cell
    s.text(sx - 92, yy + 30, "No reference is used, so the", size=12, fill=MUTED)
    s.text(sx - 92, yy + 46, "columns have no genome position.", size=12, fill=MUTED)
    s.save("reference-free-snp-calling.svg",
           "Each sample is broken into split k-mers: two flanks that must match exactly and a middle base that may differ. "
           "Split k-mers with the same flanks are grouped across samples, and their middle bases become the columns of the SNP alignment, "
           "with no reference genome and no genome positions.")


# ---------------------------------------------------------------------------
# 4. De novo assembly
# ---------------------------------------------------------------------------
def de_novo():
    cell = 20
    reads = ["ACGTTAG", "TTAGCCA", "GCCATGA", "CATGACT"]
    contig = "ACGTTAGCCATGACT"
    offsets = [0, 3, 6, 8]
    s = SVG(830, 262, "De novo assembly: overlapping reads are joined into longer contigs without using a reference genome.")
    # panel 1: unordered reads
    s.title(20, 26, "1. Reads, no reference")
    scattered = [(30, 50), (62, 96), (18, 142), (50, 188)]
    order = [2, 0, 3, 1]
    for (x, y), k in zip(scattered, order):
        seq_row(s, x, y, cell, reads[k], "read", size=12)
    s.arrow(214, 132, 274, 132, ["find", "overlaps"])
    # panel 2: reads tiled by overlap
    x2 = 292
    s.title(x2, 26, "2. Overlap reads")
    for r, (rd, off) in enumerate(zip(reads, offsets)):
        y = 50 + r * (cell + 6)
        row = " " * off + rd
        seq_row(s, x2, y, cell, row, "read", size=12)
        if r > 0:
            # shade the overlap with the previous read
            ov_start = off
            ov_len = offsets[r - 1] + len(reads[r - 1]) - off
            s.rect(x2 + ov_start * cell, y - (cell + 6) + 1, ov_len * cell, 2 * cell + 2, "none", AMBER, rx=3, sw=1.2, dash="3 3")
    yc = 50 + 4 * (cell + 6) + 16
    s.text(x2 - 10, yc + cell - 7, "Contig", anchor="end", size=12, fill=AMBER, weight="700", family=HEAD)
    for i, c in enumerate(contig):
        s.rect(x2 + i * cell + 1, yc, cell - 2, cell - 2, AMBER_BG, AMBER, rx=2)
        s.text(x2 + i * cell + cell / 2, yc + cell - 7, c, size=12, fill=AMBER, anchor="middle", weight="700", family=MONO)
    s.arrow(x2 + 15 * cell + 10, 132, x2 + 15 * cell + 64, 132, "curate")
    # panel 3: contigs to curate
    x3 = x2 + 15 * cell + 76
    s.title(x3, 26, "3. Contigs")
    bars = [(0, 92, "contig 1"), (0, 40, "contig 2"), (0, 64, "contig 3")]
    for r, (_, w, lab) in enumerate(bars):
        y = 52 + r * 34
        s.rect(x3, y, w, 16, AMBER_BG, AMBER, rx=4)
        s.text(x3 + w + 8, y + 12, lab, size=11.5, fill=MUTED)
    s.text(x3, 172, "Order, orient, and", size=12, fill=TEXT, weight="700")
    s.text(x3, 188, "trim contigs before", size=12, fill=TEXT, weight="700")
    s.text(x3, 204, "alignment", size=12, fill=TEXT, weight="700")
    s.save("de-novo-assembly.svg",
           "Short reads with no reference are compared to find shared sequence at their ends. Overlapping reads are joined into a longer contig. "
           "An assembly usually yields several contigs, which must be ordered, oriented, and trimmed before alignment.")


consensus(); core_snp(); reference_free(); de_novo()
print("wrote", sorted(os.listdir(OUT)))
