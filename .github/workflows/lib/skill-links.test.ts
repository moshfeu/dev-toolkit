import assert from "node:assert/strict";
import { lstatSync, readdirSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const PLUGINS_DIR = join(REPO_ROOT, "claude-plugin", "plugins");
const PROJECT_SKILLS_DIR = join(REPO_ROOT, ".claude", "skills");
const SKILL_FILE = "SKILL.md";

function listDirectories(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function pluginSkills(): { name: string; dir: string }[] {
  return listDirectories(PLUGINS_DIR).flatMap((plugin) => {
    const skillsDir = join(PLUGINS_DIR, plugin, "skills");
    return listDirectories(skillsDir).map((name) => ({ name, dir: join(skillsDir, name) }));
  });
}

test("every plugin skill is exposed as a project-skill symlink to its folder", () => {
  const skills = pluginSkills();
  assert.ok(skills.length > 0, "no plugin skills found");

  for (const { name, dir } of skills) {
    const link = join(PROJECT_SKILLS_DIR, name);
    assert.ok(lstatSync(link).isSymbolicLink(), `.claude/skills/${name} is not a symlink`);
    assert.equal(realpathSync(link), realpathSync(dir), `.claude/skills/${name} points elsewhere`);
    assert.ok(realpathSync(join(link, SKILL_FILE)), `.claude/skills/${name} has no ${SKILL_FILE}`);
  }
});
