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

The calling job must also grant `permissions: contents: write`, because the
`bump` job pushes the version bump to the PR branch. A called workflow can't
get more than its caller grants, so without it the run fails at startup
(`startup_failure`, no jobs listed) and never reaches the check:

```yaml
jobs:
  release-metadata:
    permissions:
      contents: write
    uses: moshfeu/dev-toolkit/.github/workflows/release-metadata.yml@main
```

Two jobs on purpose: `check` runs a script from the PR branch, so it only
gets a read-only token; `bump` holds the write token but runs only fixed
commands, never code from the PR.

### `.github/workflows/deploy-xhostd.yml` — reusable deploy workflow

Deploys an app to [xhostd](https://docs.xhostd.com) and waits for the result.
It uses xhostd's documented HTTP API (`https://api.xhostd.com`, bearer auth):
it looks the app and channel up by name, triggers
`POST /apps/{id}/channels/{cid}/deploy`, then polls
`GET /apps/{id}/channels/{cid}/logs?deploy={id}` until `status` is `success`
or `failed`. The job fails on `failed`, on a poll timeout, or on repeated API
errors, and prints the build-log tail when a deploy fails.

Call it from a consumer repo so it only runs after CI succeeded on a push to
the default branch (`workflows:` must name the repo's CI workflow, and
`branches:` its default branch):

```yaml
name: Deploy

on:
  workflow_run:
    workflows: [ CI ]
    types: [ completed ]
    branches: [ main ]

jobs:
  deploy:
    if: ${{ github.event.workflow_run.conclusion == 'success' && github.event.workflow_run.event == 'push' }}
    uses: moshfeu/dev-toolkit/.github/workflows/deploy-xhostd.yml@main
    with:
      app: my-app
      sha: ${{ github.event.workflow_run.head_sha }}
    secrets:
      XHOSTD_TOKEN: ${{ secrets.XHOSTD_TOKEN }}
```

| Input | Default | Meaning |
| --- | --- | --- |
| `app` (required) | | xhostd app name, as shown by `list_apps`. |
| `channel` | `prod` | Channel to deploy. |
| `ref` | the pushed branch (`workflow_run.head_branch`, else the caller's `github.ref_name`) | Branch to deploy; xhostd resolves it to the branch's HEAD. |
| `sha` | none | 40-char commit SHA. Wins over `ref`; pass `workflow_run.head_sha` to ship exactly the commit CI validated rather than whatever the branch points at by then. |
| `timeout-minutes` | `15` | How long to poll for a terminal status before failing. |

Outputs: `deploy-id` (empty if no deploy was started) and `status`: the deploy's
terminal status (`success`, `failed`, ...), `timeout` or `error` if the workflow
gave up on it, or `not-started`. The `status` output and the job summary are
written on every exit path, including a timeout.

**Secret `XHOSTD_TOKEN`** (required): an xhostd API token (`xh_...`) with the
`deploy:*` scope. Mint one at
<https://console.xhostd.com/tokens?label=github-actions> (shown once), then add
it in each consumer repo under *Settings → Secrets and variables → Actions →
New repository secret*, name `XHOSTD_TOKEN`. xhostd answers 401 once a token is
revoked or expired; re-mint it at the same URL and update the secret.

Behaviour worth knowing:

- A second deploy is never started while one is queued or running on the
  channel (xhostd's `pending_deploy`). If that deploy is the same `sha`, the
  workflow follows it; otherwise it waits for it to finish and then deploys
  its own target, so a newer commit is never silently skipped. Any status
  other than `success` (including an unexpected one) fails the job.
- Runs for the same app and channel are serialised (`concurrency`, no
  cancel), so a newer merge queues behind a build that's in progress.
- GitHub-connected xhostd apps re-sync from GitHub on each deploy, so the
  `ref`/`sha` only needs to exist on GitHub, not be pushed to xhostd.
- `workflow_run` workflows only run from the default branch's copy of the
  caller file, and only fire for the CI workflow's *completed* runs: a CI
  workflow that ends in `startup_failure` (e.g. a nested reusable workflow
  asking for more `permissions` than the caller grants) never triggers a
  deploy.

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
- `ask-to-watch-deploy-after-merge.md` — every consumer repo's agents must follow this one: after a PR is merged, ask the user once whether to watch the deploy and report when it is done.
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
{ "scripts": { "postinstall": "node -e \"import('./node_modules/dev-toolkit/scripts/sync-docs.js').catch(()=>{})\"", "sync-docs": "node node_modules/dev-toolkit/scripts/sync-docs.js" } }
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
