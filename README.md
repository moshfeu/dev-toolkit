# dev-toolkit

Shared CI workflow, lint/TypeScript config, and process conventions used
across moshfeu's repos (`travel-tracker`, `my-openclaw`, and future ones).
Extracted from `my-openclaw`'s and `travel-tracker`'s own `AGENTS.md`/CI/lint
setups where a piece of config or a convention was genuinely reusable rather
than project-specific — see each doc/package for exactly where it came from.

## What's here

### `.github/workflows/release-metadata.yml` — reusable CI workflow

Enforces that every PR adds a new `CHANGELOG.md` version section and keeps
`package.json`/`package-lock.json` in sync with it automatically. Call it
from a consumer repo's own workflow:

```yaml
jobs:
  release-metadata:
    uses: moshfeu/dev-toolkit/.github/workflows/release-metadata.yml@main
```

The calling workflow must itself be triggered by `pull_request` (a reusable
workflow invoked via `uses:` shares the calling run's `github` context, so
`github.event.pull_request` is only populated if the *caller* is itself
triggered by `pull_request`). The consumer repo needs a `CHANGELOG.md` with
`## [x.y.z] - <date>` headings, a `package.json`, and a `package-lock.json`.
See `docs/changelog-source-of-truth.md` for the full convention. Label a PR
`skip-release` to opt out (docs-only, CI-only changes).

Two jobs on purpose: `check` runs a script from the PR branch, so it only
gets a read-only token; `bump` holds the write token but runs only fixed
commands, never code from the PR.

### `eslint-config/` — `@moshfeu/eslint-config`

A shared flat ESLint config (typescript-eslint `recommended` plus an
opt-in, configurable rule restricting direct `process.env` access to one
config module). Install via a git dependency:

```json
{ "devDependencies": { "@moshfeu/eslint-config": "github:moshfeu/dev-toolkit#path:eslint-config" } }
```

```js
// eslint.config.js
import sharedConfig from '@moshfeu/eslint-config';
export default [...sharedConfig({ configFiles: ['src/lib/config.ts'] })];
```

Options: `configFiles` — path(s) allowed to read `process.env` directly;
omit or pass `false` to skip the restriction entirely. `extraEnvExemptFiles`
— extra globs to exempt beyond the default (`**/*.test.{js,ts}`,
`test-setup.{js,ts}`). `ignores` — globs excluded from linting entirely
(defaults to `node_modules/**`, `dist/**`).

### `tsconfig-base/` — `@moshfeu/tsconfig-base`

The strict TypeScript baseline both repos independently converged on
(`strict`, `noUncheckedIndexedAccess`, `esModuleInterop`, etc). Install the
same git-dependency way, then:

```json
{ "extends": "@moshfeu/tsconfig-base/base.json" }
```

### `docs/` — process conventions

Cross-cutting philosophy that isn't tool-enforceable, so it stays as prose
that repos link to rather than duplicate:

- `narrow-scope-then-promote.md`
- `concurrent-agent-editing.md`
- `plan-doc-format.md`
- `changelog-source-of-truth.md`
- `glossary-pattern.md`
- `tech-debt-register-pattern.md`
- `pii-and-logging.md`
- `pre-pr-self-review-checklist.md`
- `comments-philosophy.md`
- `pr-review-automation.md` — every consumer repo's agents must follow this one: subscribe to a PR's review activity right after opening it, in every repo, not just on request.
- `local-sync.md` — every consumer repo must follow this one too: wire up `scripts/sync-docs.js` (below) and a synchronous `SessionStart` hook, and link `AGENTS.md` at the local synced path, not a GitHub URL.

A consuming repo's own `AGENTS.md`/`CLAUDE.md` should link to the relevant
file here instead of restating it, the same way `my-openclaw`'s own docs
cross-link to avoid duplication going stale in two places.

### `scripts/sync-docs.js` — local doc vendoring

Copies `docs/` from `node_modules/dev-toolkit` into the consumer repo's own
`.dev-toolkit/docs/` (gitignored). Wire it into the consumer's `postinstall`,
**guarded** against a production-only install that omits this devDependency
(`npm ci --omit=dev` — check the consumer's `Dockerfile`), so it refreshes on
every full `npm install` without crashing a prod-only one:

```json
{ "scripts": { "postinstall": "test -f node_modules/dev-toolkit/scripts/sync-docs.js && node node_modules/dev-toolkit/scripts/sync-docs.js || true", "sync-docs": "node node_modules/dev-toolkit/scripts/sync-docs.js" } }
```

See `docs/local-sync.md` for why this needs to be paired with a `SessionStart`
hook, and what to link from `AGENTS.md`.

### `claude-plugin/` — Claude Code skill plugin

A marketplace source for the `code-standards` skill (comment/test-helper/
constant conventions), generalized from `my-openclaw`'s original skill of
the same name. Add it to a repo's `.claude/settings.json`:

```json
{ "extraKnownMarketplaces": { "moshfeu-dev-toolkit": { "source": { "source": "github", "repo": "moshfeu/dev-toolkit", "path": "claude-plugin" } } }, "enabledPlugins": { "code-standards@moshfeu-dev-toolkit": true } }
```

The logging/PII section of the skill is intentionally left as a template —
adapt it per repo (e.g. naming a real pseudonymization helper) rather than
copying `my-openclaw`'s jid-specific version verbatim.

## Why a separate repo

Keeps the shared pieces versioned and consumed the normal way (a workflow
`uses:` reference, an npm/git dependency, a plugin marketplace entry)
instead of copy-pasted between app repos or kept in sync by hand.
