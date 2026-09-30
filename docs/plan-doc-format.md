# Plan-doc format

A lightweight, consistent shape for per-feature planning documents (e.g.
`plans/<feature>.md`), so they're easy to skim later and easy for an agent
resuming the work to pick up cold.

## Header

```
# <Feature title>

_Created: <date> · Updated: <date>_
```

## Body sections, in order

1. **Context** — why this is being done, what prompted it, the intended
   outcome. Not "what the code does" — that's the diff's job.
2. **What we tried first (if applicable)** — an abandoned approach and why
   it was replaced. This is sanctioned, deliberate history for a *human*
   reader deciding whether to re-propose the same idea — don't delete it
   once superseded. (This is different from a code comment or system
   prompt rebutting a replaced draft, which should *not* keep that
   history — see the code-standards skill's "no scar tissue" rule.)
3. **Approach / technical design** — numbered, file-by-file where it helps.
4. **Non-goals** (if the scope needs an explicit boundary) — what this
   plan deliberately does not attempt, so a reviewer doesn't ask for it and
   so a later reader doesn't assume it was an oversight.
5. **Review rounds** — as the plan evolves through actual PR review, add
   numbered "Part N" sections, each documenting: what a reviewer flagged,
   what changed in response (or why it was deliberately *not* changed, with
   the reasoning — see the "accepted, unfixed" pattern below), and where it
   shipped (files touched, changelog version if applicable).
6. **Status** — done / in progress / blocked, with enough detail that
   someone else can tell at a glance whether this plan is still live.
7. **Possible follow-ups (not required, not yet done)** — a lightweight
   backlog scoped to this feature, distinct from the repo's general
   tech-debt register (see `tech-debt-register-pattern.md`).

## The "accepted, unfixed" pattern

When a reviewer (human, bot, or another agent) raises a real finding that
you're consciously choosing not to fix in this PR, document that choice
explicitly rather than silently ignoring it: name the finding, why it's
being accepted as-is (e.g. "single-user deployment, real auth is separate
future work"), and — if it's worth tracking — a pointer to the issue
tracking it. A recorded, reasoned "no" is very different from an
unaddressed comment.

## Lifecycle

Plan docs are working documents, not stable reference material — they get
rewritten or archived once the work lands. Don't point a code comment at
one (point at the nearest README instead, since that's meant to stay
current); do keep the plan doc itself around as a historical record of how
a decision was reached.
