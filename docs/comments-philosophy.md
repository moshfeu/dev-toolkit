# Comments and documentation: check over claim, short over why

Two repos (`travel-tracker`, `my-openclaw`) independently arrived at
compatible comment philosophies. Combined version:

## Prefer a mechanical check over a comment or doc claim

If something can be enforced with a lint rule or a test, enforce it —
don't just write a comment or README paragraph asserting it's true. A
README claim ("nothing here knows about X") goes stale the moment it
stops being true, and nothing forces anyone to re-check it on an
unrelated change. A lint rule (e.g. restricting a sensitive import/API to
one module) catches the same violation mechanically, with zero chance of
silent drift.

- Architectural invariants ("X access is centralized in module Y", "these
  two subsystems never import each other") belong in a lint rule or test,
  not prose. Before writing a comment/README line asserting an invariant,
  ask whether it could be a rule instead.
- A rule needing an exception is normal — grant it narrowly and
  explicitly (a scoped disable comment with a one-line reason on the
  exact line), not by weakening the rule or exempting a whole file.
- Verify external systems' current behavior (auth flows, endpoints, spec
  versions) against live docs or a real request before building against
  them — don't assume past behavior still holds.

## Inline comments: short, local, "what" or a pointer — not "why"

Code comments should be one line, tied to the single line they explain —
not a paragraph of rationale, and not a narration of a whole file's
architectural role (editing one line inside a file doesn't prompt anyone
to revisit a comment describing the file's overall boundary).

If a piece of code needs real explanation (why this approach, what
tradeoff it makes, what it replaced), that explanation goes in the
relevant README under an "Implementation notes"-style section,
referenced from the code with a one-line pointer (e.g. `// see README's
"X" section`) — not written inline. Long comments get skimmed or skipped
in review and drift out of sync with the code silently; a README section
is something a reviewer actually opens on request and is easier to keep
current since it isn't interleaved with logic.

**The check:** before writing a comment longer than one line, ask whether
it's explaining *what* the code does (trim it — the code should speak
for itself) or *why* (move it to the README, leave a one-line pointer).
Before writing any comment or README line that asserts an invariant, ask
whether it could be a lint rule or test instead.
