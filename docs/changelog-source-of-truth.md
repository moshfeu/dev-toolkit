# CHANGELOG.md is the source of truth for the version

Nobody hand-edits `version` in `package.json`/`package-lock.json`. Instead:

1. Every PR that isn't docs/CI-only adds a new `## [x.y.z] - <date>` section
   to the top of `CHANGELOG.md` (format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) /
   [SemVer](https://semver.org/)).
2. The `release-metadata` reusable workflow (see this repo's
   `.github/workflows/release-metadata.yml`) checks, on every PR: that
   `CHANGELOG.md` was modified, and that its newest version heading is
   greater than the base branch's current `package.json` version. If both
   hold and `package.json`/`package-lock.json` haven't been bumped to
   match yet, it commits that bump onto the PR branch itself.
3. Label a PR `skip-release` to opt out (for changes with no user-visible
   effect: docs, CI config, etc.).
4. Fork PRs are checked the same way but not auto-bumped (no write token
   for forks) — the check fails with the exact `npm version <x.y.z>
   --no-git-tag-version` command the contributor needs to run and push.

Write changelog entries with real detail — the file/subsystem touched, the
rationale, and a linked issue number where one exists — not just a one-line
summary. A detailed changelog doubles as a lightweight decision log that's
far more discoverable than commit messages or PR descriptions.

See `moshfeu/dev-toolkit`'s `.github/workflows/release-metadata.yml` for how
to wire this into a repo's own CI.
