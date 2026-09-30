# Working in a repo other agents or people may be touching concurrently

More than one agent (or person) can be working in the same repository at
the same time, without either side getting advance notice. That's a real
collision risk, not a hypothetical one — it has already happened: one
agent added a substantial feature directly to a shared file while another
agent was independently mid-edit on the same file, discovered only when
the second agent re-fetched the file immediately before its own write.

Concrete practices that follow from this:

- **Re-fetch a file's current content (and its blob SHA, where the API
  exposes one) immediately before writing it** — not from a locally-cached
  copy read earlier in the session, however recently. Time between reading
  and writing is exactly the window another agent can use.
- **Prefer splitting large shared files into smaller, responsibility-scoped
  modules.** One large file edited by multiple agents/people risks one
  edit silently clobbering another's unrelated change; several small files
  by responsibility means concurrent work usually touches different files
  entirely, so conflicts are far less likely and far easier to spot when
  they do happen.
- **If a file's size or shape doesn't match what you expected from earlier
  context, stop and re-check the tree** before continuing — that mismatch
  is often the first visible sign of a concurrent edit, not a bug in your
  own understanding.
- **Run a real smoke test before merging/deploying a structural change**
  (install dependencies, execute the entrypoint, or run the test suite) —
  not just a syntax check — since a collision can produce code that parses
  fine but is behaviorally broken.
