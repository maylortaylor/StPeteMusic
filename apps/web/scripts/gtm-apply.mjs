/**
 * gtm-apply.mjs
 * Reads scripts/gtm-config.json and applies it to the live GTM container.
 * Idempotent: skips items that already exist by name, only publishes if changes were made.
 *
 * Required env vars:
 *   GTM_ACCOUNT_ID, GTM_CONTAINER_ID, GTM_WORKSPACE_ID (default: 1)
 *   GOOGLE_SA_KEY_FILE or GOOGLE_APPLICATION_CREDENTIALS
 *   GA4_PROPERTY_ID (for conversion events)
 *
 * Scopes needed on service account:
 *   tagmanager.edit.containers
 *   tagmanager.publish
 *   analytics.management.events (Editor role on GA4 property)
 */

import { config } from 'dotenv';
import { google } from 'googleapis';
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AnalyticsAdminServiceClient } from '@google-analytics/admin';
import { loadSACredentials } from './google-auth.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env: apps/web/.env.local first, then root .env as fallback
config({ path: join(__dirname, '..', '.env.local') });
config({ path: join(__dirname, '..', '..', '..', '.env') });

// --- Config & env ---
const gtmConfig = JSON.parse(
  readFileSync(resolve(__dirname, 'gtm-config.json'), 'utf8'),
);
const accountId   = process.env.GTM_ACCOUNT_ID;
const containerId = process.env.GTM_CONTAINER_ID;
const workspaceId = process.env.GTM_WORKSPACE_ID ?? '1';
const propertyId  = process.env.GA4_PROPERTY_ID;
const measurementId = gtmConfig.measurementId;

if (!accountId || !containerId || !propertyId) {
  console.error('Missing required env vars: GTM_ACCOUNT_ID, GTM_CONTAINER_ID, GA4_PROPERTY_ID');
  process.exit(1);
}

const parent = `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`;
const credentials = loadSACredentials();

// --- GTM Auth (edit + publish scopes) ---
const auth = new google.auth.GoogleAuth({
  ...(credentials ? { credentials } : {}),
  scopes: [
    'https://www.googleapis.com/auth/tagmanager.edit.containers',
    'https://www.googleapis.com/auth/tagmanager.publish',
  ],
});
const gtm = google.tagmanager({ version: 'v2', auth });

// --- GA4 Auth ---
const ga4Admin = new AnalyticsAdminServiceClient(credentials ? { credentials } : {});

// ---- Helpers ----

function buildDLVariable(name, dlKey) {
  return {
    name,
    type: 'v',
    parameter: [
      { type: 'integer',  key: 'dataLayerVersion', value: '2' },
      { type: 'template', key: 'name',              value: dlKey },
      { type: 'boolean',  key: 'setDefaultValue',   value: 'false' },
    ],
  };
}

function buildCustomEventTrigger(name, eventName) {
  return {
    name,
    type: 'customEvent',
    customEventFilter: [{
      type: 'equals',
      parameter: [
        { type: 'template', key: 'arg0', value: '{{_event}}' },
        { type: 'template', key: 'arg1', value: eventName },
      ],
    }],
  };
}

function buildGA4EventTag(name, triggerId, eventName, paramNames) {
  return {
    name,
    type: 'gaawe',
    parameter: [
      { type: 'template', key: 'measurementIdOverride', value: measurementId },
      { type: 'template', key: 'eventName',             value: eventName },
      {
        type: 'list',
        key: 'eventParameters',
        list: paramNames.map(p => ({
          type: 'map',
          map: [
            { type: 'template', key: 'name',  value: p },
            { type: 'template', key: 'value', value: `{{DL - ${p}}}` },
          ],
        })),
      },
    ],
    firingTriggerId: [triggerId],
  };
}

// ---- Main ----

async function apply() {
  console.log(`\n🔍 Reading live GTM workspace: ${parent}`);

  // 1. Fetch existing state
  const [existingVarsRes, existingTrigsRes, existingTagsRes] = await Promise.all([
    gtm.accounts.containers.workspaces.variables.list({ parent }),
    gtm.accounts.containers.workspaces.triggers.list({ parent }),
    gtm.accounts.containers.workspaces.tags.list({ parent }),
  ]);

  const existingVarNames = new Set(
    (existingVarsRes.data.variable ?? []).map(v => v.name),
  );
  const existingTrigsByName = Object.fromEntries(
    (existingTrigsRes.data.trigger ?? []).map(t => [t.name, t]),
  );
  const existingTagNames = new Set(
    (existingTagsRes.data.tag ?? []).map(t => t.name),
  );

  let changes = 0;

  // 2. Create missing variables
  console.log('\n📦 Variables:');
  for (const { name, dlKey } of gtmConfig.variables) {
    if (existingVarNames.has(name)) {
      console.log(`  ✅ ${name} (exists)`);
      continue;
    }
    await gtm.accounts.containers.workspaces.variables.create({
      parent,
      requestBody: buildDLVariable(name, dlKey),
    });
    console.log(`  ➕ ${name} (created)`);
    changes++;
  }

  // 3. Create missing triggers, capture IDs
  console.log('\n⚡ Triggers:');
  const triggerIdByName = { ...Object.fromEntries(
    Object.entries(existingTrigsByName).map(([n, t]) => [n, t.triggerId]),
  )};
  for (const { name, eventName } of gtmConfig.triggers) {
    if (existingTrigsByName[name]) {
      console.log(`  ✅ ${name} (exists)`);
      continue;
    }
    const res = await gtm.accounts.containers.workspaces.triggers.create({
      parent,
      requestBody: buildCustomEventTrigger(name, eventName),
    });
    triggerIdByName[name] = res.data.triggerId;
    console.log(`  ➕ ${name} (created, id: ${res.data.triggerId})`);
    changes++;
  }

  // 4. Create missing tags (resolve trigger IDs)
  console.log('\n🏷️  Tags:');
  for (const { name, trigger, eventName, params } of gtmConfig.tags) {
    if (existingTagNames.has(name)) {
      console.log(`  ✅ ${name} (exists)`);
      continue;
    }
    const triggerId = triggerIdByName[trigger];
    if (!triggerId) {
      console.error(`  ❌ ${name} — trigger '${trigger}' not found, skipping`);
      continue;
    }
    await gtm.accounts.containers.workspaces.tags.create({
      parent,
      requestBody: buildGA4EventTag(name, triggerId, eventName, params),
    });
    console.log(`  ➕ ${name} (created)`);
    changes++;
  }

  // 5. Publish only if there were changes
  if (changes > 0) {
    console.log('\n🚀 Creating new version...');
    const versionRes = await gtm.accounts.containers.workspaces.create_version({
      path: parent,
      requestBody: {
        name: `gtm-apply — ${new Date().toISOString().slice(0, 10)}`,
        notes: `Applied via gtm-apply.mjs IaC (${changes} changes): event_click, ticket_link_click, outbound_link_click, cta_click, newsletter_signup, contact_form_submit, video_engage, artist_click, venue_click, events_filter, events_view_toggle, discover_search, discover_filter, artist_social_click, venue_social_click`,
      },
    });
    const containerVersion = versionRes.data.containerVersion;
    console.log(`  ✅ Version created: ${containerVersion.containerVersionId}`);

    const versionPath = `accounts/${accountId}/containers/${containerId}/versions/${containerVersion.containerVersionId}`;
    await gtm.accounts.containers.versions.publish({ path: versionPath });
    console.log('  ✅ Published!');
  } else {
    console.log('\n⏭️  No GTM changes — skipping publish.');
  }

  // 6. GA4 conversion events (driven entirely by gtm-config.json)
  console.log('\n📊 GA4 Conversions:');
  const ga4Property = `properties/${propertyId}`;
  const [existing] = await ga4Admin.listConversionEvents({ parent: ga4Property });
  const existingConversionNames = new Set(existing.map(e => e.eventName));

  for (const eventName of gtmConfig.conversions) {
    if (existingConversionNames.has(eventName)) {
      console.log(`  ✅ ${eventName} (already conversion)`);
      continue;
    }
    await ga4Admin.createConversionEvent({
      parent: ga4Property,
      conversionEvent: { eventName },
    });
    console.log(`  ➕ ${eventName} (marked as conversion)`);
  }

  console.log('\n✅ Done — GTM published, GA4 conversions updated.\n');
}

apply().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
