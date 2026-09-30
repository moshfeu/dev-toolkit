import { test } from 'node:test';
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
