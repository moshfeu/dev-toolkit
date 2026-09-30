# Named tech-debt register pattern

Keep a small file (e.g. `low-critical-potential-bugs.md` or
`known-issues.md`) at the repo root for real, known issues that aren't
worth fixing pre-emptively — either because they're cheap to live with
today, or because fixing them properly needs more code than the actual
risk currently justifies.

Each entry should have:

- What the issue is and where (file/function).
- Root cause, in enough detail that fixing it later doesn't require
  re-investigating from scratch.
- Why it's not being fixed now (low likelihood, low impact, disproportionate
  fix cost).
- The concrete fix, if one is already known, so implementing it later is a
  lookup, not a redesign.

**Explicit exit criterion:** move an entry out of this file (i.e. actually
fix it) once it stops being theoretical — a real user hits it, or an
unrelated change nearby makes it meaningfully more likely to trigger.

This is distinct from a GitHub issue: it's for things deliberately *not*
being tracked as active work, kept in the repo itself so the reasoning for
not fixing something is versioned alongside the code it concerns, and
doesn't get lost the way a stale, unlabeled issue can.
