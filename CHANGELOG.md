# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

This repo is a dependency of `travel-tracker` and `my-openclaw` (reusable
workflows via `uses: ...@main`, plus the shared ESLint/tsconfig packages and
the `code-standards` plugin), so a regression here lands in every consumer.
Note the version a consumer started failing on when reporting a problem.

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
