#!/usr/bin/env python3
"""Check that every cross-reference in the collections resolves.

- Each method names an existing operation.
- Each protocol step names an existing operation.
- Each method a step restricts to exists AND belongs to that step's operation.
- Every method that has alternatives in its operation explains when to use it
  (use_when). Alternatives it points to (avoid_when[].use) must exist; they may
  belong to another operation.
- combine_with partners exist, share the method's operation, and that operation
  allows several methods per step (selection: multiple).
- Data types resolve, and every protocol has at least one complete path.
- Every question has at least one route, each route names its pathogen group
  and lists protocols that exist (or are marked `planned`).

Usage:  python3 tools/validate.py        (run from the site root; needs PyYAML)
Exits non-zero if any problem is found, so it can run in CI.
"""
import glob, os, re, sys
from itertools import combinations
import yaml

def front_matter(path):
    text = open(path, encoding="utf-8").read()
    m = re.match(r"^---\s*\n(.*?)\n---", text, re.S)
    return yaml.safe_load(m.group(1)) or {} if m else {}

def load(collection):
    return {os.path.splitext(os.path.basename(p))[0]: front_matter(p)
            for p in glob.glob(f"_{collection}/*.md")}

operations, methods, protocols = load("operations"), load("methods"), load("protocols")
questions = load("questions")
errors = []

for slug, m in methods.items():
    if m.get("operation") not in operations:
        errors.append(f"method '{slug}': unknown operation '{m.get('operation')}'")

SELECTIONS = {"single", "multiple"}
for slug, o in operations.items():
    if o.get("selection", "single") not in SELECTIONS:
        errors.append(f"operation '{slug}': selection must be 'single' or 'multiple'")

def selection(step):
    op = operations.get(step.get("operation")) or {}
    return step.get("selection") or op.get("selection") or "single"

# Guidance for choosing between methods lives on the methods themselves.
warnings = []
for slug, m in methods.items():
    op = operations.get(m.get("operation")) or {}
    combinable = op.get("selection") == "multiple"
    siblings = [s for s, o in methods.items() if s != slug and o.get("operation") == m.get("operation")]
    if siblings and not m.get("use_when"):
        errors.append(f"method '{slug}': has other methods in its operation ({', '.join(siblings)}) but no use_when guidance")
    if siblings and not combinable and not m.get("avoid_when"):
        warnings.append(f"method '{slug}': no avoid_when guidance pointing readers to alternatives")
    for c in m.get("combine_with") or []:
        alt = c.get("use") if isinstance(c, dict) else None
        if not alt:
            errors.append(f"method '{slug}': combine_with entries need a 'use' method slug")
        elif alt not in methods:
            errors.append(f"method '{slug}': combine_with points to unknown method '{alt}'")
        elif methods[alt].get("operation") != m.get("operation"):
            errors.append(f"method '{slug}': combine_with partner '{alt}' is in a different operation")
        elif not combinable:
            errors.append(f"method '{slug}': combine_with used, but operation '{m.get('operation')}' "
                          f"does not set selection: multiple")
    for a in m.get("avoid_when") or []:
        if isinstance(a, dict):
            if not a.get("when"):
                errors.append(f"method '{slug}': avoid_when entry is missing 'when' text")
            alt = a.get("use")
            if alt and alt not in methods:
                errors.append(f"method '{slug}': avoid_when points to unknown method '{alt}'")

for slug, p in protocols.items():
    for i, step in enumerate(p.get("steps") or [], start=1):
        op = step.get("operation")
        if op not in operations:
            errors.append(f"protocol '{slug}' step {i}: unknown operation '{op}'")
        if step.get("selection") and step["selection"] not in SELECTIONS:
            errors.append(f"protocol '{slug}' step {i}: selection must be 'single' or 'multiple'")
        for m in step.get("methods") or []:
            if m not in methods:
                errors.append(f"protocol '{slug}' step {i}: unknown method '{m}'")
            elif methods[m].get("operation") != op:
                errors.append(f"protocol '{slug}' step {i}: method '{m}' belongs to "
                              f"'{methods[m].get('operation')}', not '{op}'")

# Data-type keys must exist in _data/data_types.yml.
types = yaml.safe_load(open("_data/data_types.yml", encoding="utf-8")) or {}

def keys(entries):
    for e in entries or []:
        yield from (e if isinstance(e, list) else [e])

for slug, m in methods.items():
    for field in ("requires", "produces"):
        for k in keys(m.get(field)):
            if k not in types:
                errors.append(f"method '{slug}' {field}: unknown data type '{k}'")
for slug, p in protocols.items():
    for k in keys(p.get("inputs")):
        if k not in types:
            errors.append(f"protocol '{slug}' inputs: unknown data type '{k}'")

# Each protocol needs at least one path where every step has a usable method.
def satisfied(reqs, available):
    return all(any(k in available for k in (r if isinstance(r, list) else [r])) for r in reqs or [])

def candidates(step):
    if step.get("methods"):
        return [m for m in step["methods"] if m in methods]
    return [s for s, m in methods.items() if m.get("operation") == step.get("operation")]

def choices(step, available):
    """Every selection a reader could make at this step: one method, or for
    multi-select steps any non-empty combination of methods. Combined methods
    are applied in the order listed, so each may use the outputs of the ones
    before it."""
    cands = candidates(step)
    if selection(step) != "multiple":
        return [[m] for m in cands if satisfied(methods[m].get("requires"), available)]
    valid = []
    for n in range(1, len(cands) + 1):
        for combo in combinations(cands, n):   # preserves listed order
            have = set(available)
            for m in combo:
                if not satisfied(methods[m].get("requires"), have):
                    break
                have |= set(methods[m].get("produces") or [])
            else:
                valid.append(list(combo))
    return valid

def complete_paths(steps, available):
    if not steps:
        return 1
    # An optional step can be skipped, contributing nothing downstream.
    total = complete_paths(steps[1:], available) if steps[0].get("optional") else 0
    for picked in choices(steps[0], available):
        produced = {t for m in picked for t in methods[m].get("produces") or []}
        total += complete_paths(steps[1:], available | produced)
    return total

for slug, p in protocols.items():
    n = complete_paths(p.get("steps") or [], set(p.get("inputs") or []))
    if n == 0:
        errors.append(f"protocol '{slug}': no combination of methods completes every step")
    else:
        print(f"  {slug}: {n} complete path(s)")

# Questions route readers to protocols by pathogen group.
planned = set()
for slug, q in questions.items():
    routes = q.get("routes") or []
    if not routes:
        errors.append(f"question '{slug}': no routes")
    for i, r in enumerate(routes, start=1):
        if not r.get("organisms"):
            errors.append(f"question '{slug}' route {i}: missing 'organisms'")
        items = r.get("protocols") or []
        if not items:
            errors.append(f"question '{slug}' route {i}: no protocols")
        for item in items:
            if isinstance(item, dict) and item.get("planned"):
                planned.add(item["planned"])
                continue
            ref = item.get("protocol") if isinstance(item, dict) else item
            if ref not in protocols:
                errors.append(f"question '{slug}' route {i}: unknown protocol '{ref}'")

unanswered = sorted(set(protocols) - {
    (it.get("protocol") if isinstance(it, dict) else it)
    for q in questions.values() for r in q.get("routes") or [] for it in r.get("protocols") or []})

unused = sorted(set(methods) - {m for p in protocols.values() for s in p.get("steps") or []
                                for m in (s.get("methods") or [])})
print(f"{len(questions)} questions, {len(protocols)} protocols, {len(operations)} operations, {len(methods)} methods")
if planned:
    print("Note: planned protocols referenced by questions:", ", ".join(sorted(planned)))
if unanswered:
    print("Note: protocols not linked from any question:", ", ".join(unanswered))
if unused:
    print("Note: methods not explicitly specified by any protocol:", ", ".join(unused))
for w in warnings:
    print("Warning:", w)
if errors:
    print("\n".join("ERROR: " + e for e in errors))
    sys.exit(1)
print("All references resolve.")
