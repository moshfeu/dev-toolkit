// ---- Release metadata check, run by .github/workflows/release-metadata.yml ----
// CHANGELOG.md is the source of truth for the version: a PR must add a new
// `## [x.y.z]` section, and package.json/package-lock.json are synced to it.
import { readFileSync, appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import type { CheckReleaseResult, CheckReleaseInput } from './release-metadata.types.js';

export type { CheckReleaseResult, CheckReleaseInput } from './release-metadata.types.js';

const VERSION_HEADING_RE = /^## \[(\d+\.\d+\.\d+)\]/m;

// Changelogs list the newest version first, so the first heading is the latest.
export function latestChangelogVersion(changelog: string): string | null {
  return changelog.match(VERSION_HEADING_RE)?.[1] ?? null;
}

// Numeric x.y.z comparison: negative if a < b, 0 if equal, positive if a > b.
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return (pa[i] ?? 0) - (pb[i] ?? 0);
  }
  return 0;
}

// Returns { errors, target, needsBump }: `target` is the changelog's newest
// version, and `needsBump` is true while any of `versions` (the versions
// currently in package.json and package-lock.json) differs from it.
export function checkRelease({ changelog, changelogChanged, baseVersion, versions }: CheckReleaseInput): CheckReleaseResult {
  const errors: string[] = [];
  if (!changelogChanged) {
    errors.push('CHANGELOG.md was not modified in this PR. Add an entry, or label the PR `skip-release`.');
  }

  const target = latestChangelogVersion(changelog);
  if (!target) {
    errors.push('CHANGELOG.md has no `## [x.y.z]` version heading.');
  } else if (compareVersions(target, baseVersion) <= 0) {
    errors.push(`The newest CHANGELOG.md version (${target}) must be greater than the base branch's version (${baseVersion}). Add a new version section.`);
  }

  return { errors, target, needsBump: errors.length === 0 && versions.some((v) => v !== target) };
}

function main(argv: string[]): void {
  const arg = (name: string): string | undefined => {
    const i = argv.indexOf(`--${name}`);
    return i === -1 ? undefined : argv[i + 1];
  };
  const baseVersion = arg('base-version');
  if (!baseVersion) {
    console.error('usage: node release-metadata.js --base-version <x.y.z> [--changelog-changed true|false] [--output <file>]');
    process.exitCode = 2;
    return;
  }

  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
  const result = checkRelease({
    changelog: readFileSync('CHANGELOG.md', 'utf8'),
    changelogChanged: arg('changelog-changed') === 'true',
    baseVersion,
    versions: [pkg.version, lock.version, lock.packages?.['']?.version],
  });

  for (const error of result.errors) console.log(`::error::${error}`);
  if (!result.errors.length) console.log(`Changelog OK: ${result.target}${result.needsBump ? ' (package.json/package-lock.json need a bump)' : ''}`);
  const output = arg('output');
  if (output) appendFileSync(output, `target=${result.target ?? ''}\nneeds_bump=${result.needsBump}\n`);
  process.exitCode = result.errors.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
