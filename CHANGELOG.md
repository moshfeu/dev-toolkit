# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

This repo is a dependency of `travel-tracker` and `my-openclaw` (reusable
workflows via `uses: ...@main`, plus the shared ESLint/tsconfig packages and
the `code-standards` plugin), so a regression here lands in every consumer.
Note the version a consumer started failing on when reporting a problem.

## [1.6.1] - 2026-11-24

### Changed

- `review-loop`: removed `.claude/skills/review-loop/SKILL.md` and its sync test, added in 1.6.0. Tried in a `my-openclaw` session with this repo attached, the skill did not load: attaching a repo does not load its skills. The copy only worked when this repo was the session's own repo, and a copy in a consumer drifts (`my-openclaw`'s copied `code-standards` skill already differs from the plugin's). The plugin route, `review-loop@moshfeu-dev-toolkit` in the consumer's `.claude/settings.json` `enabledPlugins`, is the one supported way; the README now says so. This repo enables the plugin the same way, in its own `.claude/settings.json`, so `/review-loop` should be available here too. The plugin route has not been exercised in a live new session as of this release.

## [1.6.0] - 2026-11-24

### Added

- `claude-plugin/plugins/review-loop`: a new plugin with a `/review-loop` skill, registered in `marketplace.json`. One round runs `/code-review --comment` on the PR, triages each comment (fix, decline with evidence, or cannot verify), verifies against the repo where it can (read the code, reproduce with a test, run lint/typecheck/tests, run the app), fixes, pushes and replies on each thread. It repeats up to 3 rounds or until a round has no new valid finding. Comments are never accepted on trust, and a comment that needs something unavailable here (a device, production data) is reported as unverified rather than accepted. Before round 1 the reviewer is told to read, and the fixer reads, `AGENTS.md`, `CLAUDE.md`, `REVIEW.md`, the docs they link and `.dev-toolkit/docs/`, so known issues and recorded design decisions are not re-raised or "fixed". Declined comments are carried into the next round so they are not argued twice. It never approves or merges. Triage and verification run in a fresh subagent briefed with only the comments, the rule files, the declined list and the PR's scope, so the agent that wrote the code does not judge comments on its own work; the main agent applies the fixes, checks each decline against the PR's intent, and asks the user when a fix needs a decision. Consumers enable it with `review-loop@moshfeu-dev-toolkit` in `enabledPlugins`. The same skill is also at `.claude/skills/review-loop/SKILL.md`, so a session that only attaches this repo (no plugin settings) loads it as a project skill; a new test fails when the two copies differ. Whether an attached repo's project skills load was not verified in a live session.

## [1.5.1] - 2026-11-18

### Changed

- `release-metadata.yml`: the check no longer installs `tsx`. The step `npm install --no-save tsx@^4` ran in the caller's checkout, so npm installed all of the caller's dependencies too: in a `my-openclaw` PR run it added 458 packages and took about 1m46s of a run that is otherwise a few seconds, on every push to every PR. The job now runs the script with plain `node`, which strips TypeScript types itself; the script already uses only syntax that is erased. The script is run from a `.dev-toolkit` folder inside the caller's repo, so Node used the caller's `package.json` to decide whether it is a module, and a caller with `"type": "commonjs"` failed; a new `.github/workflows/lib/package.json` (`"type": "module"`) fixes that for every caller. A new test copies the script into a repo laid out like the workflow's checkout and runs it with plain `node` for a module and a commonjs caller, so a change that needs `tsx` again or loses `lib/package.json` fails here, not in the consumers. Checked on Node 22.23 here; the CI runner's Node 24 is what this repo's own CI runs the test on. Consumers pick this up on their next PR, since they use the workflow at `@main`. **Note for consumers:** a failure of the `release-metadata` check after this version points here.

## [1.5.0] - 2026-11-07

### Added

- `deploy-xhostd.yml`: the `notify` push now carries the version and the commits. The title is `<app> v<version> deploy: <status>`, with `version` read from `package.json` at the deployed commit through the contents API (no checkout; left out when the repo has none). The body lists the deployed commit and the first line of each commit since the one the channel was running before, capped at 10 with a "...and N more" line. To know that commit, the `deploy` job now reads the channel's `current_sha` from xhostd's app list right before it starts (or follows) a deploy and exposes it as the new `previous-sha` output; the `notify` job then asks the compare API for the range. Asked for by the owner for `travel-tracker` and `my-openclaw`, which both use this workflow. The notify job now has `permissions: contents: read` for those two calls (the repo default token already has it). A missing `previous-sha`, a failed compare or a missing `package.json` only shortens the message ("Commit list unavailable.", no version); none of them fails the run. The `current_sha` field is read from the same app list the job already uses to find the app and channel ids, and was not verified against a live token when this shipped: if xhostd names it differently the list is simply absent.

## [1.4.0] - 2026-11-07

### Added

- `deploy-xhostd.yml`: optional `NTFY_TOPIC` secret. When a caller passes it, a new `notify` job sends an [ntfy.sh](https://ntfy.sh) push with the deploy result (`success`, `failed`, `timeout`, ...) and a link to the run once the `deploy` job ends, on failure too (high priority). It was first written as a job in `travel-tracker`'s own `deploy.yml` and moved here so every consumer gets it by passing one secret. The topic and run values go through `env`, not into the script. A failed send logs a warning and never fails the run, so a notification outage can't turn a good deploy red. Without the secret the job skips. Documented in the README under the deploy workflow.

## [1.3.0] - 2026-11-06

### Added

- `docs/review-rules.md`: the checks every review applies in every repo, taken from review comments on `my-openclaw` PR #116. A closed set of values is a literal union, not `string`. A literal copied from an external API says where it comes from and whether a model or API change can break it. A literal written in two places is one constant. A new capability names the exact control that turns it on. A consumer repo links it from a `REVIEW.md` and adds only its own rules there. Listed in the README next to the other process conventions.

## [1.2.0] - 2026-10-09

### Added

- `docs/ask-to-watch-deploy-after-merge.md`: a convention every consumer repo's agents follow. When a PR they opened or drove is merged, they ask the user once whether to watch the deployment and report when it finishes (the user usually merges to test on the real deployment). On yes they follow the repo's deploy path and report success or the failure reason; on no they stop; if nothing deploys on merge they skip the question. Listed in the README next to the other process conventions.

## [1.1.1] - 2026-10-03

### Changed

- `docs/plan-doc-format.md`: added a "Length and tone" section. Plans have no fixed length, but should use fewer sections and words, plain English and no jargon, and stay readable in one pass. The section list is now described as a menu rather than a checklist. Moved here from `my-openclaw`'s `AGENTS.md` so every consumer repo shares it.

## [1.1.0] - 2026-10-02

### Added

- `.github/workflows/deploy-xhostd.yml`: reusable `workflow_call` workflow that deploys an app to xhostd through its documented HTTP API and waits for a terminal status. Inputs: `app`, `channel` (default `prod`), `ref` (default: the pushed branch), optional `sha` (wins over `ref`), `timeout-minutes` (default 15); secret `XHOSTD_TOKEN`; outputs `deploy-id` and `status`. It never starts a second deploy while one is queued or running (a same-`sha` one is followed, a different one is waited out first), serialises runs per app/channel, and fails on any terminal status other than `success`, on a poll timeout, or after repeated API errors, printing the build-log tail on failure. The `status` output and the job summary are written on every exit path (`timeout`, `error` or `not-started` when it bails out early). Documented in the README.
- `CHANGELOG.md`, versioned like `travel-tracker` and `my-openclaw`: every PR here now adds a version section, enforced by this repo's own `release-metadata` workflow (including for the shared workflow files, which previously made that check fail with `ENOENT CHANGELOG.md`).

## [1.0.0] - prior to this changelog

- Baseline: the shared `release-metadata` reusable workflow, `@moshfeu/eslint-config`, `@moshfeu/tsconfig-base`, the `code-standards` Claude Code plugin, the cross-repo process conventions under `docs/`, and the local doc-sync script for Claude Code sessions. The two npm packages keep their own `1.0.0` versions; this file versions the repo as a whole.
