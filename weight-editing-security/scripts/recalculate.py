#!/usr/bin/env python3
"""Recalculate the preserved comparisons without third-party dependencies."""

from __future__ import annotations

import json
import math
import statistics
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load(name: str):
    with (ROOT / "data" / name).open(encoding="utf-8") as handle:
        return json.load(handle)


def paired(values: list[float]) -> tuple[float, float, float]:
    mean = statistics.mean(values)
    se = statistics.stdev(values) / math.sqrt(len(values))
    return mean, se, mean / se


summary = load("summary.json")
ctf = load("ctf_per_task.json")
split = load("ctf_split.json")
rows = ctf["per_task"]

base_solved = sum(row["base_solved"] for row in rows)
edited_solved = sum(row["edit_solved"] for row in rows)
attempts = sum(row["base_attempts"] for row in rows)
assert attempts == sum(row["edit_attempts"] for row in rows)

print("CTF attempts")
print(f"  base:   {base_solved}/{attempts}")
print(f"  edited: {edited_solved}/{attempts}")

groups = {
    "practice": set(split["practice"]),
    "held-out": set(split["eval"]),
    "all": {row["task_id"] for row in rows},
}
for name, task_ids in groups.items():
    values = [row["diff"] for row in rows if row["task_id"] in task_ids]
    mean, se, z = paired(values)
    print(f"  {name:9s}: {100 * mean:+.1f} points, SE {100 * se:.1f}, z {z:+.2f}, n={len(values)}")

mcq = summary["fresh_seceval_192"]
n = mcq["base"]["questions"]
diffs = [1] * mcq["paired"]["rescues"]
diffs += [-1] * mcq["paired"]["regressions"]
diffs += [0] * (n - len(diffs))
gain, se, _ = paired(diffs)
print("\nFresh SecEval")
print(f"  base:   {mcq['base']['correct']}/{n} ({100 * mcq['base']['correct'] / n:.1f}%)")
print(f"  edited: {mcq['edited']['correct']}/{n} ({100 * mcq['edited']['correct'] / n:.1f}%)")
print(f"  paired difference: {100 * gain:+.1f} points, SE {100 * se:.1f}")

review = summary["code_review_39_fixes"]["jointly_completed"]
print("\nJointly completed code reviews")
for model in ("base", "edited"):
    values = review[model]
    detection = values["true_positives"] / values["vulnerable_reviews"]
    false_positive = values["false_positives"] / values["patched_reviews"]
    youden = detection - false_positive
    print(f"  {model:6s}: detection {100 * detection:.2f}%, false positives {100 * false_positive:.2f}%, Youden's J {100 * youden:.2f}")

