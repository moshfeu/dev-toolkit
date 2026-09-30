---
name: code-standards
description: "Shared coding and code-review standards -- comments, logging, test helpers, constants -- generic across repos, generalized from moshfeu/my-openclaw's original skill of the same name. Load before writing or editing any .js/.ts file, and before reviewing a diff against it."
---

# Code standards (shared)

Sharper, more mechanical rules than a repo's own AGENTS.md/CLAUDE.md
philosophy. Read this repo's own AGENTS.md first for the *why*; this file
is the concrete checklist to apply on every write and every review.

## Comments

- **Minimal.** Default to none. Add one only when the code alone can't carry
  the point (a hidden constraint, a non-obvious workaround, a unit/format
  that isn't visible from the name).
- **Bottom line only, never the thought process.** Write the conclusion, not
  how you got there. No "we considered X but chose Y", no narrated
  reasoning, no "TODO: think about whether...". If a comment reads like a
  sentence from a design discussion, cut it down to the one fact a reader
  needs.
  - Bad: `// We looked at using a cache here but decided against it because...`
  - Good: `// Not cached -- called once per request, a cache would never hit.`
- **Never point a comment at a plan doc.** `plans/*.md`-style working
  documents get rewritten or archived once the work lands, so a comment
  referencing one goes stale by construction. If a comment needs to point
  somewhere for more context, point at the nearest `README.md` instead, and
  add the context there first if it isn't already.
- **No scar tissue from a previous draft.** When review feedback makes you
  rewrite something, state the final design as if it were always this way
  — don't leave in a negative clause rebutting the draft that got replaced
  (`"with no preview step"`, `"there's no dry-run mode"`, `"unlike the
  earlier version..."`). This is about model- and code-facing text (system
  prompts, tool descriptions, code comments); a README's own "what we tried
  first, why it didn't work" section is different, and is the sanctioned
  place for that history — see this repo's `docs/plan-doc-format.md`.
  - Bad (in a system prompt): `"This tool runs the action immediately when called, with no preview step -- call it only when..."`
  - Good: `"Call this tool only when..."`

## Logging and PII

Adapt this section per repo — see `docs/pii-and-logging.md` in
`moshfeu/dev-toolkit` for the full, repo-agnostic version (whose-data-is-this
checks, request-derived-text escaping, error-message exposure). If this
repo has a per-user identifier that counts as PII (a phone number, session
ID, email), add the repo-specific pseudonymization rule here, naming the
actual helper function and its call sites.

- Every call to an external endpoint gets a log line (which endpoint/action,
  not full payload).
- Every `catch` block representing a real failure path gets a log line,
  even if it also returns an error result to the caller.
- Multi-step flows log per step, not just a single opaque
  success/failure at the end.

## Tests

- **A test helper or fixture used by 2+ test files gets promoted, not
  copy-pasted** — to this repo's shared testkit (or a dedicated
  entity/flow-specific testkit if the shared setup bakes in one module's
  shape that doesn't belong in the generic one).
- **Exactly one consumer → keep it local** to that test file, as the
  default (same narrow-scope-then-promote rule as production code — see
  `docs/narrow-scope-then-promote.md`). Exception: a one-off helper that
  makes the test file itself meaningfully more readable can go shared even
  with a single consumer today — the bar is "this makes the code clearer",
  not just "it avoids duplicating a few lines".

## Constants

- **Exactly one consumer → a local `const`** in that file.
- **Two or more consumers → promote to the narrowest existing shared home**
  that fits (app-wide config module, or a lib file tied to the relevant
  subsystem) — don't reflexively invent a new shared file.
- **Nothing existing fits** → create one narrowly-scoped shared file then,
  not before.
