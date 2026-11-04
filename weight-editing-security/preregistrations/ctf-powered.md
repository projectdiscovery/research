# Pre-registration: powered re-test of the CTF comparison

Written before the additional data was collected.

**Question.** Round 1's edit scored +4.1 paired per-task points (SE 2.5, z=1.6) over 98 public CTF tasks at three attempts each. That is positive but not distinguishable from zero. Does it survive doubled power?

**Why all 98 tasks are valid.** Round 1's editor never saw CTF data of any kind, so every task is holdout for this comparison. The earlier practice/eval split exists for round 2 and later, not for this test.

**Design.** Three further attempts per task per arm, pooled with the existing three, giving six attempts per task per arm on all 98 tasks. The same models, servers, sandbox and strict scoring were used. The final flag line had to equal the gold flag.

**Decision rule, fixed in advance.** Use the paired per-task difference across all 98 tasks at six attempts. Treat it as significant only if the absolute difference exceeds two standard errors. No subgroup, half or category analysis will replace this number.

**Prediction.** If the earlier positive result reflects a real completion-driven gain in task success, it will hold with greater power. If it was noise, it will regress toward zero.

