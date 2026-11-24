---
name: review-loop
description: "Review the PR with /code-review, verify each comment, fix the valid ones. Up to 3 rounds."
---

# Review loop

One round = review, triage, fix. Up to **3 rounds**, stop earlier when a
round brings no new valid finding.

The point is a *critical* loop, not an obedient one. A review comment is a
claim, not an order. Accept it only when it holds up.

## Before round 1: collect the project's own rules

Read, in this order, whatever exists: `AGENTS.md`, `CLAUDE.md`, `REVIEW.md`,
the other `*.md` files they link, `.dev-toolkit/docs/*.md`, and `docs/`. Note
anything that bears on the diff: known issues, accepted tradeoffs, design
decisions, "do not" rules, review rules.

Both sides use them:

- **The reviewer** is told to. Start the review with an instruction to read
  those files and not to raise what they already document as known or decided
  (pass it as the review's focus text if the command takes one). The
  reviewer may still miss them, so the triage step below checks every
  comment against them too.
- **You** check each comment against them before deciding.

## Each round

1. **Review.** Make sure the branch is pushed and a PR is open (open a draft
   PR if none). Run `/code-review --comment` on it. Read the comments it
   posted.
2. **Triage.** Give every comment one verdict, with a reason:
   - **Fix**: it is correct and in scope.
   - **Decline**: it is wrong, already handled, out of scope, or contradicts
     a documented decision or known issue. Name the file or line that shows it.
   - **Cannot verify**: it may be right but needs something you can't do here
     (a real device, production data, a service you can't reach). Do not
     accept it and do not dismiss it. Say exactly what is needed to check it.
3. **Verify before you decide.** Do not rely on how convincing the comment
   reads. Check it against the real thing, whichever applies:
   - read the code it points at and its callers;
   - write or run a test that reproduces the claim;
   - run the project's lint, typecheck and tests;
   - run the app itself (server, CLI, mobile app, UI) and try the case, using
     the `run` skill when it fits.
   A comment you reproduced is a *fix*. A comment you disproved is a
   *decline*, and the evidence goes in the reply. If the only way to know is
   something you can't run, it is *cannot verify*.
4. **Fix** every *fix* verdict. One concern per commit. Keep the change as
   narrow as the comment. Run lint, typecheck and tests, push.
5. **Reply** on each thread: what you changed (with the commit), or why not
   (with the evidence), or what is needed to verify it. Resolve the threads
   you fixed. Leave declined and unverifiable threads open for the human.
   End every reply with the footer the environment requires.

## Next round

Start another round on the new push. Don't re-argue a declined comment: pass
the declined list, with reasons, to the next review as context, and if the
reviewer raises the same thing again, decline it again in one line and don't
count it as a new finding.

Stop when any of these is true:

- a round has no new *fix* verdicts;
- 3 rounds are done;
- a fix would need a design decision, a change outside the PR's scope, or a
  user choice. Stop and ask.

## Never

- Accept a comment only because the reviewer sounded sure.
- Skip, disable or weaken a test to get green.
- Approve or merge the PR.
- Rewrite history on a branch you didn't open.
- Fix something the project's docs record as a known issue or a deliberate
  design, without telling the user.

## Final report

Short, as a table: round, comment, verdict, reason or commit. Then list what
needs the user: every *cannot verify* with what is needed to check it, every
declined comment the user might disagree with, and any rounds that ended on
the limit with findings still open.
