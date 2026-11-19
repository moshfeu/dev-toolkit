---
name: review-fix
description: "Review the whole branch with /code-review --comment, judge every finding (fix, skip or out of scope, with the reason), fix the ones worth fixing with tests, answer the PR comments, then suggest at most two AGENTS.md changes that would have prevented them. Use when the user types /review-fix, or asks to review a PR, fix the findings and learn from them in one go."
argument-hint: "[low|medium|high|xhigh] [--auto]"
---

# Review, judge, fix, learn

One round. Arguments: an effort level for the review (default `high`) and
`--auto`, which skips the pause in step 3.

Read the repo's `AGENTS.md`, `CLAUDE.md` and `REVIEW.md` (whichever exist)
first. Their rules decide what counts as a finding and how to fix it.

## 1. Review the whole branch

Find the base branch (the PR's base, else the default branch). Run
`/code-review <level> --comment origin/<base>...HEAD`.

Review the whole branch, not the last commit: a late docs-only commit would
hide the code. Then check that the comments exist on the PR. If `--comment`
posted nothing (no PR yet, or no inline anchor), say so and carry on with the
findings from the review output.

## 2. Judge every finding

For each finding, open the code it names and check the claim with the input it
gives. Drop what you cannot reproduce by reading. Then give one verdict:

- **Fix**: the claim holds and the change belongs in this PR.
- **Skip**: the claim is wrong, already handled, or taste. Say why in one line.
- **Out of scope**: valid, but a different change. Say what it would take.

Show a table: finding, verdict, reason, planned fix. Plain words, short.

## 3. Pause

Stop and wait for the owner's go-ahead (the repo's "plan before you fix"
rule). With `--auto`, continue.

## 4. Fix

- One fix per finding; add or change a test for each, and run the tests.
- If the repo cannot run the code here (for example no SDK), run what can run
  and say what only CI covers.
- Follow the repo's own rules for versions, changelog and commits (batch into
  one commit unless the rules say otherwise).
- Push, then for each PR comment reply with what changed (start with
  `claude:` if the repo asks for it) and resolve the thread. A **Skip** gets a
  reply with the reason. An **Out of scope** gets a reply and stays open for
  the owner to decide.

## 5. Suggest rule changes

Look at the findings that were fixed and ask what would have stopped each one
at writing time. Suggest at most two changes to `AGENTS.md` (or the repo's
equivalent), and only when:

- the rule is general: it applies beyond this feature or platform;
- it is not already in `AGENTS.md`, `REVIEW.md` or the shared docs.

If a rule already exists and was simply not followed, suggest a process step
that makes it hard to skip, not a new rule. Show the exact text. Apply it only
after the owner approves.

## 6. Finish

Say what was fixed, skipped and left open, what ran, and what only CI will
check. Offer a second review of the fixes (it costs a full review); do not run
one unasked.
