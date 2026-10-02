# Local doc sync: why consumer repos need a postinstall script and a SessionStart hook

A link to a GitHub URL is an extra step for an agent to take mid-session —
stop, fetch, parse — and exactly the kind of step that gets skipped when a
request looks small. Treat the `docs/*.md` files here as something each
consumer repo vendors locally instead, so an agent reads them like any other
file in the repo, with no fetch step at all.

## What each consumer repo wires up

1. **A `postinstall` script** in the consumer's own `package.json`:

   ```json
   {
     "scripts": {
       "postinstall": "node node_modules/dev-toolkit/scripts/sync-docs.js",
       "sync-docs": "node node_modules/dev-toolkit/scripts/sync-docs.js"
     }
   }
   ```

   This copies `docs/` into a local, gitignored `.dev-toolkit/docs/` on every
   `npm install` — add `.dev-toolkit/` to `.gitignore`. The `sync-docs` alias
   is there to run it by hand (see the `--ignore-scripts` caveat below).

2. **A synchronous Claude Code `SessionStart` hook** that runs `npm install`
   before the session's first turn — see the `session-start-hook` skill.
   Without this, the `postinstall` above only helps if `npm install` already
   happened to run before an agent started reading `AGENTS.md`, which isn't
   guaranteed on a fresh clone/container. The hook must be **synchronous**,
   not async: async mode starts the session immediately while install runs in
   the background, recreating the exact race this setup exists to avoid (the
   agent reading `AGENTS.md` before the docs have synced).

3. **`AGENTS.md` links to the local path**, not the GitHub URL —
   `.dev-toolkit/docs/comments-philosophy.md` instead of
   `https://github.com/moshfeu/dev-toolkit/blob/main/docs/comments-philosophy.md`.
   Keep the GitHub link too, as the canonical source and as the fallback for
   a human browsing the repo on GitHub, where the gitignored local path
   doesn't exist.

## Caveats

- **Only takes effect once merged to the repo's default branch** — a
  `SessionStart` hook has to already be checked out at session start to run.
- **`--ignore-scripts`** (some CI or security configs set this) skips
  `postinstall` silently. `npm run sync-docs` is the explicit fallback.
- **Only as fresh as the last `npm install`** — bumping the `dev-toolkit`
  version in `package.json` without reinstalling leaves the old local copy in
  place. Same caveat already applies to `eslint-config`/`tsconfig-base`.
