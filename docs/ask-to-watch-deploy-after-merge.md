# Ask whether to watch the deploy after a PR is merged

When a PR you opened, or were asked to drive, is merged in a repo that
consumes dev-toolkit, ask the user once whether you should watch the
deployment and tell them when it is done. Do not start watching without
asking, and do not skip the question.

Keep it to one line, naming the app and channel if you know them, for
example: "#65 is merged. Want me to watch the deploy and tell you when it's
done?" The answer is usually yes, because the user merges to test the change
on the real deployment.

- **Yes:** follow the repo's own deploy path (the CI run that follows the
  merge, then the host's deploy status and log). Report when it finishes:
  the new version or sha is live, or it failed and why, quoting the reason
  from the log. Use scheduled check-ins at sensible intervals, not a tight
  polling loop.
- **No:** stop, and do not raise it again for that PR.
- **Nothing deploys on merge** (a library, a docs-only repo): skip the
  question and say so in one line.

The merge event is the trigger. The PR subscription ends when a PR is merged,
so ask in the same turn you read the merge notification.

This applies to every merged PR in every repo that consumes dev-toolkit
(`travel-tracker`, `my-openclaw`, and future ones).
