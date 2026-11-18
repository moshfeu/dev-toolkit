import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { latestChangelogVersion, compareVersions, checkRelease } from './release-metadata.js';

const CHANGELOG = `# Changelog

## [Unreleased]

## [1.2.0] - 2026-09-20

- something

## [1.1.0] - 2026-09-19
`;

test('latestChangelogVersion returns the first version heading and skips [Unreleased]', () => {
  assert.equal(latestChangelogVersion(CHANGELOG), '1.2.0');
});

test('latestChangelogVersion returns null when there is no version heading', () => {
  assert.equal(latestChangelogVersion('# Changelog\n\nnothing yet\n'), null);
});

test('compareVersions compares numerically, not as strings', () => {
  assert.ok(compareVersions('1.10.0', '1.9.0') > 0);
  assert.ok(compareVersions('1.2.0', '1.10.0') < 0);
  assert.equal(compareVersions('1.2.3', '1.2.3'), 0);
  assert.ok(compareVersions('2.0.0', '1.99.99') > 0);
});

test('checkRelease passes and asks for a bump when package.json and the lockfile are behind the changelog', () => {
  const result = checkRelease({ changelog: CHANGELOG, changelogChanged: true, baseVersion: '1.1.0', versions: ['1.1.0', '1.1.0', '1.1.0'] });
  assert.deepEqual(result, { errors: [], target: '1.2.0', needsBump: true });
});

test('checkRelease passes without a bump when package.json and the lockfile already match', () => {
  const result = checkRelease({ changelog: CHANGELOG, changelogChanged: true, baseVersion: '1.1.0', versions: ['1.2.0', '1.2.0', '1.2.0'] });
  assert.deepEqual(result, { errors: [], target: '1.2.0', needsBump: false });
});

test('checkRelease asks for a bump when only a lockfile version is stale or missing', () => {
  const stale = checkRelease({ changelog: CHANGELOG, changelogChanged: true, baseVersion: '1.1.0', versions: ['1.2.0', '1.2.0', '1.1.0'] });
  assert.equal(stale.needsBump, true);
  const missing = checkRelease({ changelog: CHANGELOG, changelogChanged: true, baseVersion: '1.1.0', versions: ['1.2.0', '1.2.0', undefined] });
  assert.equal(missing.needsBump, true);
});

test('checkRelease fails when CHANGELOG.md was not modified', () => {
  const result = checkRelease({ changelog: CHANGELOG, changelogChanged: false, baseVersion: '1.1.0', versions: ['1.1.0', '1.1.0', '1.1.0'] });
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0]!, /was not modified/);
  assert.equal(result.needsBump, false);
});

test('checkRelease fails when the newest changelog version is not greater than the base version', () => {
  const result = checkRelease({ changelog: CHANGELOG, changelogChanged: true, baseVersion: '1.2.0', versions: ['1.2.0', '1.2.0', '1.2.0'] });
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0]!, /must be greater than the base branch's version \(1\.2\.0\)/);
});

test('checkRelease fails when the changelog has no version heading', () => {
  const result = checkRelease({ changelog: '# Changelog\n', changelogChanged: true, baseVersion: '1.1.0', versions: ['1.1.0', '1.1.0', '1.1.0'] });
  assert.match(result.errors[0]!, /no `## \[x\.y\.z\]` version heading/);
  assert.equal(result.target, null);
});

// The workflow runs the script with plain `node`, from a `.dev-toolkit` folder inside the caller's repo.
function runLikeTheWorkflow(callerPackageType: 'module' | 'commonjs', baseVersion: string, changelogChanged: string) {
  const repo = mkdtempSync(join(tmpdir(), 'release-metadata-'));
  try {
    const lib = join(repo, '.dev-toolkit/.github/workflows/lib');
    cpSync(new URL('.', import.meta.url), lib, { recursive: true, filter: (src) => !src.endsWith('.test.ts') });
    writeFileSync(join(repo, 'package.json'), JSON.stringify({ name: 'caller', type: callerPackageType, version: '1.2.0' }));
    writeFileSync(join(repo, 'package-lock.json'), JSON.stringify({ version: '1.2.0', packages: { '': { version: '1.2.0' } } }));
    writeFileSync(join(repo, 'CHANGELOG.md'), '# Changelog\n\n## [1.2.0] - 2026-11-18\n\n- x\n\n## [1.1.0]\n');
    const output = join(repo, 'out');
    const run = spawnSync(
      process.execPath,
      [join(lib, 'release-metadata.ts'), '--base-version', baseVersion, '--changelog-changed', changelogChanged, '--output', output],
      { cwd: repo, encoding: 'utf8' },
    );
    return { status: run.status, stdout: run.stdout, output: run.status === null ? '' : readFileSync(output, 'utf8') };
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
}

test('the script runs with plain node in a caller repo of either module type', () => {
  for (const type of ['module', 'commonjs'] as const) {
    const run = runLikeTheWorkflow(type, '1.1.0', 'true');
    assert.equal(run.status, 0, `${type}: ${run.stdout}`);
    assert.match(run.stdout, /Changelog OK: 1\.2\.0/);
    assert.equal(run.output, 'target=1.2.0\nneeds_bump=false\n');
  }
});

test('the script run with plain node fails when the version is not greater', () => {
  const run = runLikeTheWorkflow('commonjs', '1.2.0', 'false');
  assert.equal(run.status, 1);
  assert.match(run.stdout, /::error::CHANGELOG\.md was not modified/);
});
