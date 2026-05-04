/**
 * gtm-validate.mjs
 *
 * Validates the live published GTM container version against gtm-config.json.
 * Reads the latest published version (not a workspace draft) and checks that
 * every variable, trigger, and tag defined in config exists in the live container.
 *
 * Usage:
 *   npm run gtm:validate
 *
 * Required env vars:
 *   GTM_ACCOUNT_ID, GTM_CONTAINER_ID
 *   GOOGLE_SA_KEY_FILE or GOOGLE_APPLICATION_CREDENTIALS
 *   GA4_PROPERTY_ID (for key event check)
 *
 * Exit codes:
 *   0 — all checks pass
 *   1 — one or more checks failed
 */

import { config } from 'dotenv';
import { google } from 'googleapis';
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AnalyticsAdminServiceClient } from '@google-analytics/admin';
import { loadSACredentials } from './google-auth.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env.local') });
config({ path: join(__dirname, '..', '..', '..', '.env') });

const gtmConfig = JSON.parse(readFileSync(resolve(__dirname, 'gtm-config.json'), 'utf8'));
const accountId   = process.env.GTM_ACCOUNT_ID;
const containerId = process.env.GTM_CONTAINER_ID;
const propertyId  = process.env.GA4_PROPERTY_ID;

if (!accountId || !containerId || !propertyId) {
  console.error('Missing required env vars: GTM_ACCOUNT_ID, GTM_CONTAINER_ID, GA4_PROPERTY_ID');
  process.exit(1);
}

const credentials = loadSACredentials();
const auth = new google.auth.GoogleAuth({
  ...(credentials ? { credentials } : {}),
  scopes: ['https://www.googleapis.com/auth/tagmanager.readonly'],
});
const gtm = google.tagmanager({ version: 'v2', auth });
const ga4Admin = new AnalyticsAdminServiceClient(credentials ? { credentials } : {});

const containerPath = `accounts/${accountId}/containers/${containerId}`;

// ── Helpers ───────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function pass(label) {
  console.log(`  ✅ ${label}`);
  passed++;
}

function fail(label) {
  console.log(`  ❌ ${label}`);
  failed++;
}

// ── Fetch latest published version ───────────────────────────────────────────

async function validate() {
  console.log(`\n🔍 Fetching live GTM container: ${containerPath}`);

  // Fetch the currently published (live) version directly
  const liveRes = await gtm.accounts.containers.versions.live({ parent: containerPath });
  const version = liveRes.data;

  console.log(`   Checking version: ${version.containerVersionId} (${version.name ?? 'unnamed'})\n`);

  const liveVarNames  = new Set((version.variable  ?? []).map(v => v.name));
  const liveTrigNames = new Set((version.trigger    ?? []).map(t => t.name));
  const liveTagNames  = new Set((version.tag        ?? []).map(t => t.name));

  // ── Variables ────────────────────────────────────────────────────────────────
  console.log('📦 Variables:');
  for (const { name } of gtmConfig.variables) {
    liveVarNames.has(name) ? pass(name) : fail(`${name} — MISSING`);
  }

  // ── Triggers ─────────────────────────────────────────────────────────────────
  console.log('\n⚡ Triggers:');
  for (const { name } of gtmConfig.triggers) {
    liveTrigNames.has(name) ? pass(name) : fail(`${name} — MISSING`);
  }

  // ── Tags ─────────────────────────────────────────────────────────────────────
  console.log('\n🏷️  Tags:');
  for (const { name } of gtmConfig.tags) {
    liveTagNames.has(name) ? pass(name) : fail(`${name} — MISSING`);
  }

  // ── GA4 key events ────────────────────────────────────────────────────────────
  console.log('\n📊 GA4 Key Events:');
  const ga4Property = `properties/${propertyId}`;
  const [keyEvents] = await ga4Admin.listKeyEvents({ parent: ga4Property });
  const liveKeyEventNames = new Set(keyEvents.map(e => e.eventName));
  for (const eventName of gtmConfig.conversions) {
    liveKeyEventNames.has(eventName)
      ? pass(eventName)
      : fail(`${eventName} — NOT marked as key event`);
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log(`\n${'─'.repeat(50)}`);
  if (failed === 0) {
    console.log(`✅ All ${total} checks passed — GTM + GA4 config is fully live.\n`);
  } else {
    console.log(`❌ ${failed}/${total} checks FAILED — run 'npm run gtm:apply' to fix.\n`);
    process.exit(1);
  }
}

validate().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
