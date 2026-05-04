/**
 * ga4-conversions.mjs
 *
 * Marks a list of GA4 event names as conversion events via the Admin API.
 * Safe to re-run — already-marked events are skipped.
 *
 * Usage:
 *   npm run ga4:conversions --workspace=apps/web
 *
 * Required env vars:
 *   GA4_PROPERTY_ID          — numeric property ID, e.g. 123456789
 *   GOOGLE_ANALYTICS_SA_JSON — full service account JSON string (or set
 *                              GOOGLE_APPLICATION_CREDENTIALS to a key file path)
 *
 * The service account must have "Editor" role on the GA4 property.
 * Grant it in GA4 Admin → Property → Property Access Management.
 */

import { config } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AnalyticsAdminServiceClient } from '@google-analytics/admin';
import { loadSACredentials } from './google-auth.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load from apps/web/.env.local first, then fall back to root .env
config({ path: join(__dirname, '..', '.env.local') });
config({ path: join(__dirname, '..', '..', '..', '.env') });

// ── Events to mark as conversions ─────────────────────────────────────────────
// Primary goal: event_click (user showed intent toward an event)
// Secondary: contact + newsletter as lead-gen conversions
const CONVERSION_EVENTS = [
  'ticket_link_click',    // highest intent — user clicked a ticket purchase link
  'cta_click',            // hero Get Tickets / tune_in CTA
  'event_click',          // user showed interest in a specific event
  'newsletter_signup',    // lead gen
  'contact_form_submit',  // lead gen / booking inquiry
];

// ── Validate env ─────────────────────────────────────────────────────────────
const propertyId = process.env.GA4_PROPERTY_ID;
if (!propertyId) {
  console.error('Missing GA4_PROPERTY_ID env var');
  process.exit(1);
}

const credentials = loadSACredentials();

const adminClient = new AnalyticsAdminServiceClient(credentials ? { credentials } : {});
const property = `properties/${propertyId}`;

// ── Fetch existing conversion events ─────────────────────────────────────────
console.log(`Fetching existing conversion events for property ${propertyId}…`);
const [existingConversions] = await adminClient.listConversionEvents({ parent: property });
const alreadyMarked = new Set(existingConversions.map(e => e.eventName));

// ── Mark new ones ─────────────────────────────────────────────────────────────
let created = 0;
let skipped = 0;

for (const eventName of CONVERSION_EVENTS) {
  if (alreadyMarked.has(eventName)) {
    console.log(`  ↳ skip  ${eventName} (already a conversion)`);
    skipped++;
    continue;
  }

  await adminClient.createConversionEvent({
    parent: property,
    conversionEvent: { eventName },
  });

  console.log(`  ✓ marked ${eventName}`);
  created++;
}

console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
