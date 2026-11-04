# Weight edits and security benchmarks

This directory contains the validation package for [How Weight Edits Improve Security Benchmarks Without Clear Capability Gains](https://projectdiscovery.io/research/how-weight-edits-improve-security-benchmarks).

We used GPT-6 Astra to search for a direct weight edit to Qwen3.5-9B without fine-tuning or gradient descent. The retained edit changed one tensor and reduced the number of answers the model abandoned while reasoning. Security quiz accuracy increased, although the edited model did not show a statistically clear improvement on CTF challenges or better discrimination between vulnerable and patched code.

## Check the results

Run:

```console
python3 scripts/recalculate.py
```

The script recalculates:

- the 269 of 588 base and 287 of 588 edited CTF results
- the paired CTF difference and standard error
- the pre-fixed practice and held-out CTF split results
- the fresh 192-question SecEval comparison from preserved aggregate counts
- the jointly completed 39-fix code-review comparison from preserved aggregate counts

`data/ctf_per_task.json` contains counts for all 98 public InterCode-CTF tasks, with six attempts per task and model. `data/ctf_split.json` records the split fixed before the task-level results were examined. `data/summary.json` contains the other preserved aggregate results used by the article.

## Evidence limits

This is a validation package, not an end-to-end reproduction of the editing run. It does not include model weights, edit vectors, prompts, transcripts or raw model logs.

The per-item outputs from the original 600-question quiz comparison and the main 90-pair code-review comparison were not preserved. Their aggregate figures are included for transparency, but those comparisons cannot be independently reconstructed from this release. The fresh 192-question and final 39-fix comparisons were preserved only as aggregate evidence, so the script checks their arithmetic rather than reconstructing them item by item.

## Files

```text
data/summary.json                 Reported results and evidence boundaries
data/ctf_per_task.json            Per-task CTF solve counts
data/ctf_split.json               Pre-fixed CTF split
preregistrations/ctf-powered.md   Powered CTF retest plan
preregistrations/round2.md        Second editing-round plan
scripts/recalculate.py            Standard-library recalculation script
```

