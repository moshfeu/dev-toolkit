# Narrow scope, then promote

Default new shared-looking code to the narrowest scope with an actual
consumer, not the broadest scope it might plausibly serve.

- A helper, constant, or type used by exactly one module/file stays local to
  it (a local `const`, a function in the file that uses it).
- Once a **second**, independent consumer needs the same thing, promote it —
  but to the *narrowest existing shared home* that fits, not automatically to
  the most general one:
  - App-wide, env-derived config → the repo's single config module.
  - A technical constant/helper tied to one subsystem's concern → that
    subsystem's own shared file.
  - Only once something is genuinely needed across unrelated subsystems,
    with no existing shared home that fits → create a new one (e.g. a
    top-level `constants.ts`/`testkit.ts`), and only then.

Don't pre-guess genericity and place new code in a top-level shared
directory "just in case" on day one — that's optimizing for a future
consumer that may never show up, at the cost of making the current, real
consumer harder to find and reason about. Promote once proven generic, not
before.

This applies to test helpers and fixtures the same way it applies to
production code: a helper used by one test file stays in that test file
until a second file needs it.
