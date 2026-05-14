#!/usr/bin/env node
// Syncs human-readable .md system prompt files into n8n workflow JSON.
// Run via pre-commit when the .md files change, or manually: node scripts/sync-n8n-prompts.js
//
// WHY: n8n workflow JSON embeds the systemMessage inline, making it hard to read/edit.
// These .md files are the canonical source; this script keeps the JSON in sync.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const WORKFLOWS = path.join(ROOT, 'n8n/workflows/StPeteMusic');

const MAPPINGS = [
  {
    source: path.join(WORKFLOWS, 'system-prompt.md'),
    target: path.join(WORKFLOWS, 'obsidian-post-creator.json'),
  },
  {
    source: path.join(WORKFLOWS, 'newsletter-system-prompt.md'),
    target: path.join(WORKFLOWS, 'newsletter-draft-creator.json'),
  },
];

let synced = 0;
let errors = 0;

for (const { source, target } of MAPPINGS) {
  const relSource = path.relative(ROOT, source);
  const relTarget = path.relative(ROOT, target);

  if (!fs.existsSync(source)) {
    console.error(`[sync] MISSING source: ${relSource}`);
    errors++;
    continue;
  }
  if (!fs.existsSync(target)) {
    console.error(`[sync] MISSING target: ${relTarget}`);
    errors++;
    continue;
  }

  const prompt = fs.readFileSync(source, 'utf8');
  let workflow;
  try {
    workflow = JSON.parse(fs.readFileSync(target, 'utf8'));
  } catch (e) {
    console.error(`[sync] Invalid JSON in ${relTarget}: ${e.message}`);
    errors++;
    continue;
  }

  let updated = false;
  for (const node of workflow.nodes ?? []) {
    if (node?.parameters?.options?.systemMessage !== undefined) {
      // n8n uses "=" prefix to mark a field as a fixed value (not a dynamic expression)
      node.parameters.options.systemMessage = `=${prompt}`;
      updated = true;
    }
  }

  if (!updated) {
    console.warn(`[sync] No systemMessage node found in ${relTarget} — skipping`);
    continue;
  }

  const newJson = JSON.stringify(workflow, null, 2) + '\n';
  const oldJson = fs.readFileSync(target, 'utf8');

  if (newJson === oldJson) {
    console.log(`[sync] ${relTarget} already up to date`);
    continue;
  }

  fs.writeFileSync(target, newJson);
  console.log(`[sync] ${relSource} → ${relTarget}`);

  // Stage the updated JSON so the commit includes the sync
  try {
    execSync(`git add "${target}"`, { cwd: ROOT });
  } catch {
    console.warn(`[sync] Could not auto-stage ${relTarget} — stage it manually`);
  }

  synced++;
}

if (errors > 0) {
  process.exit(1);
}

if (synced > 0) {
  console.log(`[sync] Done — ${synced} workflow(s) updated and staged.`);
} else {
  console.log('[sync] Nothing to sync.');
}
