# PII and logging: what not to write to a log line

Two repos (`my-openclaw`, `travel-tracker`) independently arrived at
overlapping versions of this rule. Combined version:

## Whose data is this, and what's in it?

Before writing `console.log(...someValue...)` (or any structured-log
equivalent), name where `someValue` came from.

- **A user/request identifier that's PII** (a phone number, `jid`, email,
  session token) — never log it raw. Pseudonymize/hash it first (e.g. a
  `pseudonymize(id)` helper backed by a keyed hash), and keep the mapping to
  the real identifier only in the database, not in logs. Apply this to
  *every* log line that would otherwise include the identifier, not just a
  dedicated audit log.
- **`req.originalUrl` / `req.url`** include the query string, which can
  contain a token, an email, or anything else a client put there. Default
  to `req.path`. If you genuinely need query params in a log, log specific
  known-safe keys, not the whole string.
- **Anything from an unauthenticated request** (a JSON-RPC method name, a
  tool name, a header, a body field) is attacker-controlled text, even in a
  single-user/personal deployment — the code has no way to know it will
  only ever be called by its own operator. Before interpolating such a
  value into a log line, ask: could this string contain a newline or an
  escape sequence that forges or splits a subsequent log line? If yes, wrap
  it in `JSON.stringify()` before logging — it escapes control characters
  and stays readable.

## What to log instead

- Every call to an external endpoint gets a log line naming which
  endpoint/action was called — not the full payload.
- Every `catch` block that represents a real failure path gets a log line,
  even if it also returns an error result to a caller (returning an error
  object doesn't log anything by itself). A `.catch(() => {})` guarding a
  genuinely best-effort, non-critical side effect is a sanctioned exception
  to this.
- Multi-step flows (an OAuth discovery chain, a submit/poll/fetch sequence)
  log per step, not just a single opaque success/failure at the end, so a
  stuck or failed flow can be diagnosed from the step it reached.

## Error messages returned to a client

A caught error's message/stack can itself leak internal detail (a stack
trace, a connection string, an internal hostname). Don't forward a raw
`error.message` to an API response — map known error types to a safe,
generic client-facing message, and log the full detail server-side only.
