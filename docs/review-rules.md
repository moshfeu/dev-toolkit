# Review rules

What a reviewer (human or `/code-review`) checks in every repo, beyond "does
it work". Each rule came from a real review comment. A consumer repo links
this file from its own `REVIEW.md` and adds only its repo-specific rules
there.

## Closed set of values: a union, not `string`

If a field only takes a known, fixed set of values (tool names, API tool
versions, modes), type it as a literal union. A bare `string` on a closed
list is a finding.

## A literal that comes from outside needs its source

Version strings, beta headers, model ids, endpoints and limits copied from
an external API must say where they come from, and whether a model or API
change can break them. Check them against the current docs, not memory. If
the code does not answer this, ask in the review. Drop a value the docs no
longer ask for.

## The same literal in two places is a constant

A string or number written in code and again in another file (the test
included) becomes one named constant, imported by both.

## A new capability says how it is turned on

A README row, tool description or changelog entry for a new feature or
permission names the exact control: the env var, the grant name, the
command the admin says. "Granted by the admin" is not enough. Say what one
grant covers when it enables more than one tool.

## Adding a rule

Add one when a review comment is a pattern that will come again, not a
one-off. Keep it to a heading and one or two sentences. Point at an
existing doc instead of copying it.
