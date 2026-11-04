# Second editing-round pre-registration

Written before any round-two forward evaluations.

The target was improved discrimination between vulnerable and fixed code or improved CTF correctness, relative to the original model with the round-one edit retained as the incumbent. Review examples were split by project and fix, with both halves of each fix kept in the same block. Advisory metadata, labels, titles and the paired counterpart were excluded from generation prompts.

The primary gate required a final balanced-accuracy gain over the original model greater than twice the paired standard error clustered by fix. The detection gain also had to exceed the false-positive gain. More completed answers or more detections with matching false positives were insufficient. A candidate also had to improve completed-case Youden discrimination and agree with the cutoff-free forced-choice diagnostic when available.

The alternative CTF gate required the fresh task-solve gain over the original model to exceed twice the paired standard error clustered by task. Formatting-only improvements did not count.

If neither gate passed, the round-one edit would remain unchanged and the result would be reported as no demonstrated discrimination improvement. Zero additional weight edits was an allowed result.

Before the round-two MCQ evaluation, 192 questions were selected that excluded every archived round-one SecEval ID and every current development ID. Review and CTF generation used 8,192 tokens because development reviews were frequently cut off at 4,096 tokens. The final 192-question MCQ evaluation remained at 4,096 tokens.

