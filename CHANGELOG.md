# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

This repo is a dependency of `travel-tracker` and `my-openclaw` (reusable
workflows via `uses: ...@main`, plus the shared ESLint/tsconfig packages and
the `code-standards` plugin), so a regression here lands in every consumer.
Note the version a consumer started failing on when reporting a problem.

## [1.1.2] - 2026-10-03

### Fixed

- README: documented that a caller of `release-metadata.yml` must grant `permissions: contents: write`. Without it the shared workflow's `bump` job asks for more than the caller allows and the run fails at startup (`startup_failure`), which `my-openclaw` hit on every PR.

## [1.1.1] - 2026-10-03

### Changed

- `docs/plan-doc-format.md`: added a "Length and tone" section. Plans have no fixed length, but should use fewer sections and words, plain English and no jargon, and stay readable in one pass. The section list is now described as a menu rather than a checklist. Moved here from `my-openclaw`'s `AGENTS.md` so every consumer repo shares it.

## [1.1.0] - 2026-10-02

### Added

- `.github/workflows/deploy-xhostd.yml`: reusable `workflow_call` workflow that deploys an app to xhostd through its documented HTTP API and waits for a terminal status. Inputs: `app`, `channel` (default `prod`), `ref` (default: the pushed branch), optional `sha` (wins over `ref`), `timeout-minutes` (default 15); secret `XHOSTD_TOKEN`; outputs `deploy-id` and `status`. It never starts a second deploy while one is queued or running (a same-`sha` one is followed, a different one is waited out first), serialises runs per app/channel, and fails on any terminal status other than `success`, on a poll timeout, or after repeated API errors, printing the build-log tail on failure. The `status` output and the job summary are written on every exit path (`timeout`, `error` or `not-started` when it bails out early). Documented in the README.
- `CHANGELOG.md`, versioned like `travel-tracker` and `my-openclaw`: every PR here now adds a version section, enforced by this repo's own `release-metadata` workflow (including for the shared workflow files, which previously made that check fail with `ENOENT CHANGELOG.md`).

## [1.0.0] - prior to this changelog

- Baseline: the shared `release-metadata` reusable workflow, `@moshfeu/eslint-config`, `@moshfeu/tsconfig-base`, the `code-standards` Claude Code plugin, the cross-repo process conventions under `docs/`, and the local doc-sync script for Claude Code sessions. The two npm packages keep their own `1.0.0` versions; this file versions the repo as a whole.
