/**
 * ga4-export.mjs
 *
 * Pulls GA4 event + page data for the last 30 days and writes a CSV to
 * data/ga4-export-YYYY-MM-DD.csv in the project root.
 *
 * Usage:
 *   npm run ga4:export --workspace=apps/web
 *
 * Required env vars (in .env.local or shell):
 *   GA4_PROPERTY_ID          — numeric property ID, e.g. 123456789
 *   GOOGLE_ANALYTICS_SA_JSON — full service account JSON string (or set
 *                              GOOGLE_APPLICATION_CREDENTIALS to a key file path)
 */

import { config } from 'dotenv';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSACredentials } from './google-auth.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..', '..');

// Load from apps/web/.env.local first, then fall back to root .env
config({ path: join(__dirname, '..', '.env.local') });
config({ path: join(__dirname, '..', '..', '..', '.env') });

// ── Auth ────────────────────────────────────────────────────────────────────
const propertyId = process.env.GA4_PROPERTY_ID;
if (!propertyId) {
  console.error('Missing GA4_PROPERTY_ID env var');
  process.exit(1);
}

const credentials = loadSACredentials();
const analyticsClient = new BetaAnalyticsDataClient(credentials ? { credentials } : {});

// ── Query ────────────────────────────────────────────────────────────────────
console.log(`Fetching GA4 data for property ${propertyId}…`);

const [response] = await analyticsClient.runReport({
  property: `properties/${propertyId}`,
  dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
  dimensions: [
    { name: 'date' },
    { name: 'pagePath' },
    { name: 'eventName' },
  ],
  metrics: [
    { name: 'eventCount' },
    { name: 'sessions' },
    { name: 'activeUsers' },
  ],
  orderBys: [
    { dimension: { dimensionName: 'date' }, desc: true },
    { metric: { metricName: 'eventCount' }, desc: true },
  ],
  limit: 10000,
});

// ── Build CSV ─────────────────────────────────────────────────────────────────
const headers = ['date', 'pagePath', 'eventName', 'eventCount', 'sessions', 'activeUsers'];
const rows = (response.rows ?? []).map(row => {
  const dims = (row.dimensionValues ?? []).map(d => d.value ?? '');
  const mets = (row.metricValues ?? []).map(m => m.value ?? '0');
  return [...dims, ...mets].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
});

const csv = [headers.join(','), ...rows].join('\n');

// ── Write output ──────────────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);
const outDir = join(projectRoot, 'data');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `ga4-export-${today}.csv`);
writeFileSync(outPath, csv, 'utf8');

console.log(`✓ Written ${rows.length} rows → ${outPath}`);
