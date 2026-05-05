/**
 * ga4-setup.mjs
 *
 * Idempotent GA4 property + data stream setup for stpetemusic.live.
 *
 * What it does (safe to re-run):
 *   1. Lists GA4 properties in the account — finds one for stpetemusic.live
 *   2. Creates the property if it doesn't exist
 *   3. Lists/creates a Web data stream for https://www.stpetemusic.live
 *   4. Outputs the Measurement ID (G-XXXXXXXXXX) to add to GTM
 *
 * Usage:
 *   npm run ga4:setup --workspace=apps/web
 *
 * Required env vars:
 *   GA4_ACCOUNT_ID           — numeric Google Analytics account ID
 *                              Found in: GA4 console → Admin → Account Settings → Account ID
 *   GOOGLE_SA_KEY_FILE       — path to service account JSON (or set GOOGLE_APPLICATION_CREDENTIALS)
 *
 * Permissions required on the service account:
 *   Google Analytics account: Editor role (to create properties)
 *   Grant in: GA4 Admin → Account → Account Access Management
 *
 * Note: If the service account doesn't have account-level Editor access, property
 * creation will fail with a permissions error. In that case, create the property
 * manually in analytics.google.com and set GA4_PROPERTY_ID instead.
 */

import { config } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AnalyticsAdminServiceClient } from '@google-analytics/admin';
import { loadSACredentials } from './google-auth.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env.local') });
config({ path: join(__dirname, '..', '..', '..', '.env') });

const SITE_URL         = 'https://www.stpetemusic.live';
const SITE_DISPLAY_URL = 'www.stpetemusic.live';
const PROPERTY_NAME    = 'StPeteMusic.live';
const TIMEZONE         = 'America/New_York';
const CURRENCY         = 'USD';

// ── Validate env ─────────────────────────────────────────────────────────────

const accountId = process.env.GA4_ACCOUNT_ID;
if (!accountId) {
  console.error('❌ Missing GA4_ACCOUNT_ID env var.');
  console.error('   Find it: analytics.google.com → Admin → Account Settings → Account ID');
  process.exit(1);
}

const credentials = loadSACredentials();
const adminClient = new AnalyticsAdminServiceClient(credentials ? { credentials } : {});
const accountResource = `accounts/${accountId}`;

// ── Step 1: Find existing property ───────────────────────────────────────────

console.log(`\n🔍 Looking for GA4 property for ${SITE_DISPLAY_URL} in account ${accountId}…`);

let property = null;
try {
  const [properties] = await adminClient.listProperties({
    filter: `parent:${accountResource}`,
  });

  // Match by display URL in data streams (a property can have multiple streams)
  for (const prop of properties) {
    const [streams] = await adminClient.listDataStreams({ parent: prop.name });
    const match = streams.find(
      s => s.type === 'WEB_DATA_STREAM' && s.webStreamData?.defaultUri?.includes('stpetemusic.live')
    );
    if (match) {
      property = prop;
      console.log(`  ✅ Found existing property: ${prop.displayName} (${prop.name})`);
      break;
    }
  }
} catch (err) {
  if (err.code === 7 || err.message?.includes('PERMISSION_DENIED')) {
    console.error('❌ Permission denied listing properties.');
    console.error('   The service account needs "Editor" access on the Analytics account.');
    console.error('   Grant it: GA4 Admin → Account → Account Access Management');
    process.exit(1);
  }
  throw err;
}

// ── Step 2: Create property if missing ───────────────────────────────────────

if (!property) {
  console.log(`\n📦 Property not found — creating "${PROPERTY_NAME}"…`);
  try {
    const [created] = await adminClient.createProperty({
      property: {
        parent: accountResource,
        displayName: PROPERTY_NAME,
        timeZone: TIMEZONE,
        currencyCode: CURRENCY,
        industryCategory: 'ARTS_AND_ENTERTAINMENT',
      },
    });
    property = created;
    console.log(`  ✅ Created property: ${property.displayName} (${property.name})`);
  } catch (err) {
    if (err.code === 7 || err.message?.includes('PERMISSION_DENIED')) {
      console.error('❌ Cannot create property — service account lacks account-level Editor access.');
      console.error('\n  Manual fix (2 minutes):');
      console.error('  1. Go to analytics.google.com → Admin → Create Property');
      console.error('  2. Name: "StPeteMusic.live"  |  Timezone: America/New_York  |  Currency: USD');
      console.error('  3. Note the Property ID (numeric)');
      console.error('  4. Set GA4_PROPERTY_ID=<id> in .env.local');
      console.error('  5. Re-run: npm run ga4:conversions');
      process.exit(1);
    }
    throw err;
  }
}

const propertyId = property.name.split('/').pop();
console.log(`\n  Property resource: ${property.name}`);
console.log(`  Property ID: ${propertyId}`);
console.log(`  → Add to .env.local: GA4_PROPERTY_ID=${propertyId}`);

// ── Step 3: Find or create Web data stream ────────────────────────────────────

console.log(`\n🔍 Checking data streams for ${SITE_URL}…`);

const [streams] = await adminClient.listDataStreams({ parent: property.name });
let webStream = streams.find(
  s => s.type === 'WEB_DATA_STREAM' && s.webStreamData?.defaultUri?.includes('stpetemusic.live')
);

if (webStream) {
  console.log(`  ✅ Web stream found: ${webStream.displayName}`);
} else {
  console.log(`  📦 Creating web data stream for ${SITE_URL}…`);
  const [created] = await adminClient.createDataStream({
    parent: property.name,
    dataStream: {
      type: 'WEB_DATA_STREAM',
      displayName: 'StPeteMusic.live Web',
      webStreamData: {
        defaultUri: SITE_URL,
      },
    },
  });
  webStream = created;
  console.log(`  ✅ Created stream: ${webStream.displayName}`);
}

// ── Step 4: Output Measurement ID ─────────────────────────────────────────────

const measurementId = webStream.webStreamData?.measurementId;
console.log('\n' + '═'.repeat(60));
console.log('✅ GA4 setup complete');
console.log('═'.repeat(60));
console.log(`\n  Measurement ID:  ${measurementId ?? '(not available yet — wait a few minutes)'}`);
console.log(`  Property ID:     ${propertyId}`);
console.log('\n  Next steps:');
console.log('  1. Add to .env.local:');
console.log(`       GA4_PROPERTY_ID=${propertyId}`);
if (measurementId) {
  console.log(`  2. In GTM (GTM-WW7MSP3L): set GA4 Configuration tag ID to ${measurementId}`);
  console.log('  3. Publish GTM container');
}
console.log('  4. Run: npm run ga4:conversions (marks conversion events)');
console.log('  5. Open docs/gtm-ga4-agent-checklist.md to verify end-to-end');
