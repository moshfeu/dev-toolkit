# Before opening a PR: an adversarial self-review pass

Tests confirm the happy path works. They don't ask "what could a malicious
or malformed input do here" unless a test was written specifically for
that, which requires having already thought of it. Before considering a PR
done, reread every new/changed file once specifically looking for:

- **Injection**: log injection (see `pii-and-logging.md`), but also
  anywhere a raw string gets concatenated into SQL, a shell command, or
  HTML.
- **Data exposure**: does anything expose a field that shouldn't leave this
  service (an internal ID, a raw user identifier)? Does an error message
  leak internal detail (stack traces, connection strings) to a client?
- **Incomplete lifecycles**: if a comment or docstring promises a guarantee
  tied to an event's lifecycle ("logs every X", "always cleans up Y", "runs
  once per Z"), enumerate every way that lifecycle can actually end (e.g. an
  HTTP response's `finish` event doesn't fire on client disconnect or a
  destroyed response — `close`/`error`/`abort` need their own handling) and
  verify each one, not just the happy path you were actively testing.
- **Silent type-widening**: a TypeScript `as` cast is sometimes the right
  call, but each one is a place the compiler stopped checking your work —
  justify it with a one-line comment or remove it. Prefer fixing the
  underlying type gap over reaching for a cast.

This pass is separate from "does the test suite pass" and separate from "is
this readable." It's adversarial: assume the input is hostile and the
reader is trying to break it, not use it.
