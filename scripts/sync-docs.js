#!/usr/bin/env node
// Copies dev-toolkit's docs/ locally; see docs/local-sync.md.
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const srcDocs = join(packageRoot, 'docs');
const destDocs = join(process.cwd(), '.dev-toolkit', 'docs');

if (!existsSync(srcDocs)) {
  console.error(`dev-toolkit sync-docs: no docs/ found at ${srcDocs}`);
  process.exit(1);
}

rmSync(destDocs, { recursive: true, force: true });
cpSync(srcDocs, destDocs, { recursive: true });
console.log(`dev-toolkit: synced docs/ to ${relative(process.cwd(), destDocs)}`);
