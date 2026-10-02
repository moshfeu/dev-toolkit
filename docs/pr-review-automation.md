# Subscribe to PR review activity when you open a PR

Any agent that opens a PR in a repo consuming dev-toolkit subscribes to
that PR's activity (the PR-activity-subscription tool available in its
client) immediately after opening it — not only when the user separately
asks to be "watched." Review comments, CI failures, and new pushes on the
base branch should trigger an automatic follow-up (read the event, fix or
reply, push or comment) without the user having to notice the PR stalled
and ask again.

This applies to every PR opened in every repo that consumes dev-toolkit
(`travel-tracker`, `my-openclaw`, and future ones) — not just a PR that
happens to touch dev-toolkit itself.
