# Auto-deploy to xhostd after CI passes

_Created: 2026-10-02 · Updated: 2026-10-02_

## Context

`travel-tracker` and `my-openclaw` are hosted on xhostd (one app each, one
`prod` channel each). Deploying meant a person running the xhostd `deploy` MCP
tool by hand after every merge. The goal: a merge to the default branch
(`main` for `travel-tracker`, `master` for `my-openclaw`) deploys itself once
CI has passed on that commit, with the deploy logic defined once here and
reused by both repos, the same way `release-metadata.yml` already is.

Facts the design rests on (from https://docs.xhostd.com/llms-full.txt and
`openapi.json`, not guessed):

- API base `https://api.xhostd.com`, `Authorization: Bearer xh_...`; tokens for
  CI are minted at `https://console.xhostd.com/tokens`.
- Deploy: `POST /apps/{id}/channels/{cid}/deploy` with `{sha}` or `{ref}`
  (`sha` wins when both are sent). Deploy status: `queued | running | success |
  failed`, read from `GET /apps/{id}/channels/{cid}/logs?deploy={id}`.
- A channel reports its newest in-flight deploy as `pending_deploy`.
- The apps are GitHub-connected, so every xhostd deploy first re-syncs from
  GitHub; the `ref`/`sha` only has to exist on GitHub.

## What we tried first

- **`release-metadata` as a job inside `travel-tracker`'s `ci.yml`.** That is
  how `travel-tracker` adopted the shared workflow, and it made every
  push-triggered CI run on `main` end in `startup_failure`: the shared
  workflow's `bump` job asks for `contents: write`, which a push-triggered
  caller can't grant. A deploy triggered by a *successful* CI run would then
  never fire. Replaced by a PR-only `release-metadata.yml` (the layout
  `my-openclaw` already had).
- **Labelling this PR `skip-release`** to get past the `release-metadata`
  check failing with `ENOENT CHANGELOG.md` (this repo had no changelog).
  Replaced by giving `dev-toolkit` a `CHANGELOG.md` and a version (`1.1.0`),
  because it is a dependency of both other repos and versions help pin down
  which release broke a consumer.

## Approach / technical design

1. **`.github/workflows/deploy-xhostd.yml`** (this repo), a `workflow_call`
   workflow. Inputs: `app` (required), `channel` (default `prod`), `ref`
   (default: the pushed branch), optional `sha` (wins over `ref`),
   `timeout-minutes` (default 15). Secret `XHOSTD_TOKEN`. Outputs `deploy-id`,
   `status`. Serialised per app/channel with `concurrency` (no cancel).
2. **Callers**: `.github/workflows/deploy.yml` in `travel-tracker` (`main`) and
   `my-openclaw` (`master`). Trigger: `workflow_run` of `CI`, `completed`, on
   the default branch; the job runs only if the conclusion is `success` and the
   triggering event was `push`. It passes `sha: workflow_run.head_sha`, so the
   deploy ships exactly the commit CI validated rather than whatever the
   branch points at by then.
3. **`travel-tracker`**: move `release-metadata` out of `ci.yml` into its own
   PR-only workflow (see "What we tried first").
4. **`dev-toolkit`**: add `CHANGELOG.md`, bump `package.json` /
   `package-lock.json` to `1.1.0`. `eslint-config` and `tsconfig-base` keep
   their own `1.0.0`; the changelog versions the repo as a whole.
5. **Docs**: a README section for the reusable workflow; the `travel-tracker`
   `deploy` skill now mentions the automatic deploy; changelog entries in each
   repo.

### How the `run` step works

1. **Validate.** Inputs reach the script only as env vars (a branch name can't
   inject shell). It stops at once if the token is empty or `sha` isn't 40
   lowercase hex characters.
2. **`call` helper.** One curl wrapper: GETs are retried, the deploy POST never
   is (a retry could queue a second deploy); any non-2xx becomes a
   `::error::` carrying xhostd's `error.message`, written to stderr so it
   isn't swallowed by `$(...)`.
3. **Resolve names to ids.** `GET /apps`, exactly one app with that name, then
   the channel by name. A missing `channels` field gives the "no channel
   named ..." error rather than a silent exit.
4. **Don't double-deploy.** Read `pending_deploy`. None: continue. Same `sha`
   as ours: follow that deploy. A different commit: wait for it to finish,
   re-check, and only then start ours, so the newer commit still ships.
5. **Deploy.** `POST .../deploy` with `{sha}` or `{ref}`; the deploy id is
   written to the step output immediately.
6. **Wait.** Poll `.../logs?deploy={id}&max_bytes=1` every 10 s until the
   status is no longer `queued`/`running`. 5 failed polls in a row, or the
   deadline, end the step.
7. **Report.** Job summary; anything other than `success` prints the build-log
   tail in a group and fails the job.

### Setup (per consumer repo)

Mint a token at `https://console.xhostd.com/tokens?label=github-actions` and
add it as a **repository** secret named `XHOSTD_TOKEN` (Settings → Secrets and
variables → Actions). It needs the `deploy:*` scope, which default-issued
tokens have. A re-minted token means updating the secret.

## Non-goals

- No branch-preview channels or PR deploys; only the `prod` channel on the
  default branch.
- No automatic rollback (xhostd has a `rewind` tool; it is not wired in).
- No approval gate. An *environment* secret with required reviewers would add
  one (it needs an optional `environment` input here, since a caller job that
  uses `uses:` can't set `environment:`); a repository secret was chosen
  because the deploy already only runs after CI on the default branch.
- No per-package versions or git tags for `eslint-config` / `tsconfig-base`.

## Review rounds

### Part 1: `/code-review` of the first push

Three findings, all fixed in `2a7d26d`:

1. A deploy of a *different* commit was already pending: the workflow followed
   it and reported success, so the new commit never shipped. Now it is waited
   out and ours is started afterwards; a same-`sha` pending deploy is still
   followed.
2. The poll only stopped on `success` / `failed`; any other terminal status
   (cancelled, null) spun until the timeout and never set `status`. Now any
   status other than `queued`/`running` ends the poll, and anything other than
   `success` fails the job.
3. The channel lookup assumed `GET /apps` includes `channels`; if it didn't,
   `jq` died under `set -e` with no message. Now tolerated, so the clear
   "no channel" error shows.

### Part 2: CI on this PR

`release-metadata` failed with `ENOENT CHANGELOG.md`. Fixed by adding the
changelog and version (`1.1.0`, commit `c9a211c`) instead of the opt-out label;
see "What we tried first".

### Accepted, unfixed

- **Check-then-deploy race.** A manual deploy started in the instant between
  the `pending_deploy` check and our `POST` isn't noticed. `concurrency`
  prevents it between this workflow's own runs only; closing it fully would
  need xhostd to reject a deploy on a busy channel in a way we could rely on.
- **Shared timeout budget.** The 15 minutes cover time spent waiting on someone
  else's deploy as well as our own.
- **No summary on timeout.** On a timeout the job summary isn't written and the
  `status` output stays unset (`deploy-id` is set).

## Status

In progress. `dev-toolkit` PR #1 is green and waiting to be merged first (the
callers reference `deploy-xhostd.yml@main`); `travel-tracker` #43 and
`my-openclaw` #50 follow once `XHOSTD_TOKEN` is added to each. Everything has
been exercised only against a local mock of the xhostd API, so the first real
`Deploy` run after merge is the end-to-end test.

## Possible follow-ups (not required, not yet done)

- Optional `environment` input for an approval gate / branch restriction.
- Write the job summary and `status` output on timeout too.
- Give the "wait for an in-flight deploy" phase its own budget.
- Tag releases (`v1.1.0`) so consumers can pin `@v1` instead of `@main`.
