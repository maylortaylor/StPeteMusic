/**
 * ga4-weekly-report.mjs
 *
 * Pulls last 7 days of GA4 data and:
 *   1. Emails a formatted HTML report via Resend to theburgmusic@gmail.com
 *   2. Appends rows to the StPeteMusic Analytics Google Sheet for tracking
 *
 * Usage:
 *   npm run ga4:weekly-report   (from apps/web/)
 *   node scripts/ga4-weekly-report.mjs
 *
 * Required env vars:
 *   GA4_PROPERTY_ID         — numeric GA4 property ID (e.g. 535560580)
 *   RESEND_API_KEY          — Resend API key for sending email
 *   WEEKLY_REPORT_SHEETS_ID — Google Sheet ID for tracking data
 *   GOOGLE_SA_KEY_FILE / GOOGLE_APPLICATION_CREDENTIALS / GOOGLE_ANALYTICS_SA_JSON
 */

import { config } from 'dotenv';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { google } from 'googleapis';
import { Resend } from 'resend';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSACredentials } from './google-auth.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

config({ path: join(__dirname, '..', '.env.local') });
config({ path: join(__dirname, '..', '..', '..', '.env') });

// ── Validate env ──────────────────────────────────────────────────────────────

const propertyId = process.env.GA4_PROPERTY_ID;
const resendApiKey = process.env.RESEND_API_KEY;
const sheetsId = process.env.WEEKLY_REPORT_SHEETS_ID;

if (!propertyId) { console.error('Missing GA4_PROPERTY_ID'); process.exit(1); }
if (!resendApiKey) { console.error('Missing RESEND_API_KEY'); process.exit(1); }
if (!sheetsId) { console.error('Missing WEEKLY_REPORT_SHEETS_ID'); process.exit(1); }

const REPORT_EMAIL = 'theburgmusic@gmail.com';

// ── Date range ────────────────────────────────────────────────────────────────

const endDate = new Date();
endDate.setDate(endDate.getDate() - 1); // yesterday
const startDate = new Date(endDate);
startDate.setDate(startDate.getDate() - 6); // 7 days back

const fmt = d => d.toISOString().slice(0, 10);
const startStr = fmt(startDate);
const endStr = fmt(endDate);
const weekLabel = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

console.log(`Generating weekly report for ${weekLabel}…`);

// ── Auth ──────────────────────────────────────────────────────────────────────

const credentials = loadSACredentials();
const analyticsClient = new BetaAnalyticsDataClient(credentials ? { credentials } : {});

const auth = new google.auth.GoogleAuth({
  credentials: credentials ?? undefined,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// ── GA4 queries ───────────────────────────────────────────────────────────────

const property = `properties/${propertyId}`;
const dateRanges = [{ startDate: startStr, endDate: endStr }];

console.log('  Fetching summary metrics…');
const [summaryResp] = await analyticsClient.runReport({
  property,
  dateRanges,
  metrics: [
    { name: 'sessions' },
    { name: 'newUsers' },
    { name: 'totalUsers' },
    { name: 'averageSessionDuration' },
    { name: 'engagementRate' },
    { name: 'screenPageViews' },
  ],
});

console.log('  Fetching top pages…');
const [pagesResp] = await analyticsClient.runReport({
  property,
  dateRanges,
  dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
  metrics: [{ name: 'screenPageViews' }, { name: 'averageSessionDuration' }],
  orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
  limit: 10,
});

console.log('  Fetching top events…');
const [eventsResp] = await analyticsClient.runReport({
  property,
  dateRanges,
  dimensions: [{ name: 'eventName' }],
  metrics: [{ name: 'eventCount' }],
  dimensionFilter: {
    filter: {
      fieldName: 'eventName',
      inListFilter: {
        values: [
          'ticket_link_click',
          'cta_click',
          'artist_click',
          'venue_click',
          'outbound_link_click',
          'newsletter_signup',
          'contact_form_submit',
          'video_engage',
          'artist_social_click',
          'venue_social_click',
          'discover_search',
        ],
      },
    },
  },
  orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
});

console.log('  Fetching acquisition sources…');
const [acquisitionResp] = await analyticsClient.runReport({
  property,
  dateRanges,
  dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
  metrics: [{ name: 'sessions' }],
  orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
  limit: 8,
});

console.log('  Fetching geo data…');
const [geoResp] = await analyticsClient.runReport({
  property,
  dateRanges,
  dimensions: [{ name: 'city' }, { name: 'country' }],
  metrics: [{ name: 'activeUsers' }],
  orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
  limit: 10,
});

// Demographics require Google Signals — attempt but don't fail if unavailable
let demoResp = null;
try {
  console.log('  Fetching demographics…');
  [demoResp] = await analyticsClient.runReport({
    property,
    dateRanges,
    dimensions: [{ name: 'userAgeBracket' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
  });
} catch {
  console.log('  Demographics unavailable (Google Signals may not be enabled) — skipping.');
}

// ── Parse helpers ─────────────────────────────────────────────────────────────

const val = (row, i, isMetric = false) =>
  (isMetric ? row.metricValues : row.dimensionValues)?.[i]?.value ?? '';

const summaryRow = summaryResp.rows?.[0];
const summary = {
  sessions: summaryRow ? val(summaryRow, 0, true) : '0',
  newUsers: summaryRow ? val(summaryRow, 1, true) : '0',
  totalUsers: summaryRow ? val(summaryRow, 2, true) : '0',
  avgDuration: summaryRow ? Math.round(Number(val(summaryRow, 3, true))) : 0,
  engagementRate: summaryRow ? (Number(val(summaryRow, 4, true)) * 100).toFixed(1) : '0',
  pageViews: summaryRow ? val(summaryRow, 5, true) : '0',
};

const fmtDuration = secs => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
};

// ── Build HTML email ──────────────────────────────────────────────────────────

const tableStyle = 'width:100%;border-collapse:collapse;margin:12px 0;font-size:14px;';
const thStyle = 'padding:8px 12px;background:#1a1a2e;color:#fff;text-align:left;';
const tdStyle = 'padding:7px 12px;border-bottom:1px solid #eee;';
const tdNumStyle = `${tdStyle}text-align:right;`;

const pagesTable = (pagesResp.rows ?? []).map((row, i) => `
  <tr style="${i % 2 === 0 ? '' : 'background:#f9f9f9;'}">
    <td style="${tdStyle}">${val(row, 0)}</td>
    <td style="${tdNumStyle}">${Number(val(row, 0, true)).toLocaleString()}</td>
    <td style="${tdNumStyle}">${fmtDuration(Math.round(Number(val(row, 1, true))))}</td>
  </tr>`).join('');

const eventsTable = (eventsResp.rows ?? []).map((row, i) => `
  <tr style="${i % 2 === 0 ? '' : 'background:#f9f9f9;'}">
    <td style="${tdStyle}">${val(row, 0)}</td>
    <td style="${tdNumStyle}">${Number(val(row, 0, true)).toLocaleString()}</td>
  </tr>`).join('');

const acquisitionTable = (acquisitionResp.rows ?? []).map((row, i) => `
  <tr style="${i % 2 === 0 ? '' : 'background:#f9f9f9;'}">
    <td style="${tdStyle}">${val(row, 0)} / ${val(row, 1)}</td>
    <td style="${tdNumStyle}">${Number(val(row, 0, true)).toLocaleString()}</td>
  </tr>`).join('');

const geoTable = (geoResp.rows ?? []).map((row, i) => `
  <tr style="${i % 2 === 0 ? '' : 'background:#f9f9f9;'}">
    <td style="${tdStyle}">${val(row, 0)}, ${val(row, 1)}</td>
    <td style="${tdNumStyle}">${Number(val(row, 0, true)).toLocaleString()}</td>
  </tr>`).join('');

const demoSection = demoResp?.rows?.length ? `
  <h2 style="color:#1a1a2e;margin-top:28px;">Age Breakdown</h2>
  <table style="${tableStyle}">
    <thead><tr>
      <th style="${thStyle}">Age Group</th>
      <th style="${thStyle}text-align:right;">Users</th>
    </tr></thead>
    <tbody>${demoResp.rows.map((row, i) => `
      <tr style="${i % 2 === 0 ? '' : 'background:#f9f9f9;}">
        <td style="${tdStyle}">${val(row, 0)}</td>
        <td style="${tdNumStyle}">${Number(val(row, 0, true)).toLocaleString()}</td>
      </tr>`).join('')}
    </tbody>
  </table>` : '';

const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;color:#333;">

  <div style="background:#1a1a2e;padding:20px 24px;border-radius:8px;margin-bottom:28px;">
    <h1 style="color:#fff;margin:0;font-size:22px;">StPeteMusic Weekly Report</h1>
    <p style="color:#aaa;margin:6px 0 0;">${weekLabel}</p>
  </div>

  <h2 style="color:#1a1a2e;">Summary</h2>
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="padding:12px 16px;background:#f4f4f8;border-radius:6px;text-align:center;width:16%;">
        <div style="font-size:24px;font-weight:bold;color:#1a1a2e;">${Number(summary.sessions).toLocaleString()}</div>
        <div style="font-size:12px;color:#666;margin-top:4px;">Sessions</div>
      </td>
      <td style="width:2%;"></td>
      <td style="padding:12px 16px;background:#f4f4f8;border-radius:6px;text-align:center;width:16%;">
        <div style="font-size:24px;font-weight:bold;color:#1a1a2e;">${Number(summary.totalUsers).toLocaleString()}</div>
        <div style="font-size:12px;color:#666;margin-top:4px;">Users</div>
      </td>
      <td style="width:2%;"></td>
      <td style="padding:12px 16px;background:#f4f4f8;border-radius:6px;text-align:center;width:16%;">
        <div style="font-size:24px;font-weight:bold;color:#1a1a2e;">${Number(summary.newUsers).toLocaleString()}</div>
        <div style="font-size:12px;color:#666;margin-top:4px;">New Users</div>
      </td>
      <td style="width:2%;"></td>
      <td style="padding:12px 16px;background:#f4f4f8;border-radius:6px;text-align:center;width:16%;">
        <div style="font-size:24px;font-weight:bold;color:#1a1a2e;">${Number(summary.pageViews).toLocaleString()}</div>
        <div style="font-size:12px;color:#666;margin-top:4px;">Page Views</div>
      </td>
      <td style="width:2%;"></td>
      <td style="padding:12px 16px;background:#f4f4f8;border-radius:6px;text-align:center;width:16%;">
        <div style="font-size:24px;font-weight:bold;color:#1a1a2e;">${fmtDuration(summary.avgDuration)}</div>
        <div style="font-size:12px;color:#666;margin-top:4px;">Avg Session</div>
      </td>
      <td style="width:2%;"></td>
      <td style="padding:12px 16px;background:#f4f4f8;border-radius:6px;text-align:center;width:16%;">
        <div style="font-size:24px;font-weight:bold;color:#1a1a2e;">${summary.engagementRate}%</div>
        <div style="font-size:12px;color:#666;margin-top:4px;">Engagement</div>
      </td>
    </tr>
  </table>

  <h2 style="color:#1a1a2e;margin-top:28px;">Top Pages</h2>
  <table style="${tableStyle}">
    <thead><tr>
      <th style="${thStyle}">Page</th>
      <th style="${thStyle}text-align:right;">Views</th>
      <th style="${thStyle}text-align:right;">Avg Time</th>
    </tr></thead>
    <tbody>${pagesTable}</tbody>
  </table>

  <h2 style="color:#1a1a2e;margin-top:28px;">Key Interactions</h2>
  <table style="${tableStyle}">
    <thead><tr>
      <th style="${thStyle}">Event</th>
      <th style="${thStyle}text-align:right;">Count</th>
    </tr></thead>
    <tbody>${eventsTable}</tbody>
  </table>

  <h2 style="color:#1a1a2e;margin-top:28px;">Traffic Sources</h2>
  <table style="${tableStyle}">
    <thead><tr>
      <th style="${thStyle}">Source / Medium</th>
      <th style="${thStyle}text-align:right;">Sessions</th>
    </tr></thead>
    <tbody>${acquisitionTable}</tbody>
  </table>

  <h2 style="color:#1a1a2e;margin-top:28px;">Top Locations</h2>
  <table style="${tableStyle}">
    <thead><tr>
      <th style="${thStyle}">City</th>
      <th style="${thStyle}text-align:right;">Users</th>
    </tr></thead>
    <tbody>${geoTable}</tbody>
  </table>

  ${demoSection}

  <p style="font-size:12px;color:#999;margin-top:32px;border-top:1px solid #eee;padding-top:16px;">
    Generated automatically every Monday · <a href="https://analytics.google.com" style="color:#999;">View in GA4</a>
  </p>
</body>
</html>`;

// ── Send email ────────────────────────────────────────────────────────────────

console.log(`Sending email to ${REPORT_EMAIL}…`);
const resend = new Resend(resendApiKey);
const { error: emailError } = await resend.emails.send({
  from: 'StPeteMusic Reports <reports@stpetemusic.live>',
  to: [REPORT_EMAIL],
  subject: `StPeteMusic Weekly Report — ${weekLabel}`,
  html,
});

if (emailError) {
  console.error('Email send failed:', emailError);
  process.exit(1);
}
console.log('  ✓ Email sent');

// ── Write to Google Sheets ────────────────────────────────────────────────────

console.log('Writing to Google Sheets…');

async function ensureSheet(name) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetsId });
  const exists = meta.data.sheets?.some(s => s.properties?.title === name);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetsId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: name } } }],
      },
    });
    console.log(`  Created sheet tab: ${name}`);
  }
}

async function appendRows(sheetName, headers, rows) {
  await ensureSheet(sheetName);

  // Write headers if this is the first row (A1 is empty)
  const check = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetsId,
    range: `${sheetName}!A1`,
  });
  if (!check.data.values) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetsId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    });
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetsId,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows },
  });
}

// Weekly Summary tab
await appendRows(
  'Weekly Summary',
  ['Week', 'Sessions', 'Total Users', 'New Users', 'Page Views', 'Avg Session (s)', 'Engagement Rate %'],
  [[weekLabel, summary.sessions, summary.totalUsers, summary.newUsers, summary.pageViews, summary.avgDuration, summary.engagementRate]],
);

// Top Pages tab
await appendRows(
  'Top Pages',
  ['Week', 'Page Path', 'Page Views', 'Avg Session (s)'],
  (pagesResp.rows ?? []).map(row => [
    weekLabel,
    val(row, 0),
    val(row, 0, true),
    Math.round(Number(val(row, 1, true))),
  ]),
);

// Top Events tab
await appendRows(
  'Top Events',
  ['Week', 'Event Name', 'Count'],
  (eventsResp.rows ?? []).map(row => [weekLabel, val(row, 0), val(row, 0, true)]),
);

// Audience tab (geo + optional demo)
const geoRows = (geoResp.rows ?? []).map(row => [
  weekLabel, 'geo', `${val(row, 0)}, ${val(row, 1)}`, val(row, 0, true),
]);
const demoRows = (demoResp?.rows ?? []).map(row => [
  weekLabel, 'age', val(row, 0), val(row, 0, true),
]);
await appendRows(
  'Audience',
  ['Week', 'Type', 'Segment', 'Users'],
  [...geoRows, ...demoRows],
);

console.log('  ✓ Sheets updated');
console.log(`\n✓ Weekly report complete for ${weekLabel}`);
