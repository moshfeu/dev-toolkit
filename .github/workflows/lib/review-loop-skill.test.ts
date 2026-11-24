import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PLUGIN_COPY = '../../../claude-plugin/plugins/review-loop/skills/review-loop/SKILL.md';
const PROJECT_COPY = '../../../.claude/skills/review-loop/SKILL.md';

const read = (relative: string) => readFileSync(new URL(relative, import.meta.url), 'utf8');

test('the project skill copy matches the plugin skill', () => {
  assert.equal(read(PROJECT_COPY), read(PLUGIN_COPY));
});
