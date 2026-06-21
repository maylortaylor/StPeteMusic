#!/usr/bin/env node
// Scans n8n workflow JSON for hardcoded internal hostnames that should be
// {{ $env.VAR }} expressions instead. Re-importing a workflow export (e.g.
// restoring from backup) can silently revert env-var refs back to literals,
// breaking portability between local/staging/prod without any warning.
// Run via pre-commit (n8n/workflows/StPeteMusic/*.json) or manually:
//   node scripts/validate-n8n-hostnames.js

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WORKFLOWS_DIR = path.join(ROOT, 'n8n/workflows/StPeteMusic');

// Our own infrastructure — hardcoding these breaks portability between
// environments, unlike third-party hosts (youtube.com, eventbrite.com, etc.)
// which are correctly the same everywhere and should stay hardcoded.
const INTERNAL_HOST_PATTERNS = [
  /[a-z0-9-]*\.?stpetemusic\.live/i,
  /n8n-stpetemusic\.duckdns\.org/i,
  /(?<=\/\/)listmonk(?=[:/]|$)/i, // bare docker-network hostname
];

const URL_RE = /https?:\/\/[^"'`\s\\,)}]+/g;

function findViolations(contents) {
  const violations = new Set();
  let match;
  while ((match = URL_RE.exec(contents))) {
    const url = match[0];
    if (url.includes('{{')) continue; // already parameterized
    if (INTERNAL_HOST_PATTERNS.some((re) => re.test(url))) {
      violations.add(url);
    }
  }
  return [...violations];
}

const files = fs.readdirSync(WORKFLOWS_DIR).filter((f) => f.endsWith('.json'));
let totalViolations = 0;

for (const file of files) {
  const contents = fs.readFileSync(path.join(WORKFLOWS_DIR, file), 'utf8');
  const violations = findViolations(contents);
  if (violations.length === 0) continue;
  totalViolations += violations.length;
  console.warn(`\n⚠ ${file}`);
  for (const url of violations) {
    console.warn(`    hardcoded: ${url}`);
  }
}

if (totalViolations > 0) {
  console.warn(
    `\n${totalViolations} hardcoded internal hostname(s) found above. These should be ` +
      '{{ $env.VAR }} expressions — re-importing a workflow export can silently revert ' +
      'env-var refs back to literals like these.'
  );
} else {
  console.log('✓ No hardcoded internal hostnames found in n8n workflow JSON.');
}

// Warn-only: several of these pre-date this check and migrating them touches
// live production automations, so we surface them without blocking CI/commits.
process.exit(0);
