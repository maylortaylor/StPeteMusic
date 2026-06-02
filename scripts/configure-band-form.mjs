/**
 * Configures the existing StPeteMusic Google Form and Sheet for the artist info sync system.
 *
 * First run: performs an OAuth consent flow in your browser to authorize Forms + Sheets access.
 * Tokens are saved to scripts/.form-tokens.json so subsequent runs skip the browser step.
 *
 * Prerequisites:
 *   1. In GCP Console → spm-n8n-workflows → Credentials, create a Desktop app OAuth client
 *      and add its ID + secret to .env as GOOGLE_FORMS_CLIENT_ID and GOOGLE_FORMS_CLIENT_SECRET.
 *   2. Both GOOGLE_FORM_ID and GOOGLE_SHEET_ID must be set in .env.
 *
 * Usage:
 *   node scripts/configure-band-form.mjs
 *   node scripts/configure-band-form.mjs --add-admin-columns  (run after first test submission)
 */

import http from 'http';
import { google } from 'googleapis';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const TOKEN_PATH = resolve(__dirname, '.form-tokens.json');
const REDIRECT_URI = 'http://localhost:9876';
const SCOPES = ['https://www.googleapis.com/auth/forms.body', 'https://www.googleapis.com/auth/spreadsheets'];

// Load root .env
try {
  const envContent = readFileSync(resolve(ROOT, '.env'), 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
} catch { /* rely on exported env vars */ }

const CLIENT_ID = process.env.GOOGLE_FORMS_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_FORMS_CLIENT_SECRET;
const FORM_ID = process.env.GOOGLE_FORM_ID;
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing GOOGLE_FORMS_CLIENT_ID or GOOGLE_FORMS_CLIENT_SECRET in .env');
  console.error('  Create a Desktop app OAuth client at https://console.cloud.google.com/apis/credentials?project=spm-n8n-workflows');
  process.exit(1);
}
if (!FORM_ID || !SHEET_ID) { console.error('Missing GOOGLE_FORM_ID or GOOGLE_SHEET_ID in .env'); process.exit(1); }

const FORM_TITLE = 'StPeteMusic — Artist Info Submission';
const FORM_DESCRIPTION = "Fill this out to get your artist profile listed on www.stpetemusic.live. We'll review your submission and update your page within a few days. Instagram handle is required — we use it to find your existing profile in our system.";

const QUESTIONS = [
  { title: 'Band / Artist Name', type: 'SHORT_ANSWER', required: true },
  { title: 'Artist Type', type: 'RADIO', required: true, options: ['Band', 'Solo Artist', 'DJ', 'Event Producer', 'Creative', 'Other'] },
  { title: 'Instagram Handle', type: 'SHORT_ANSWER', required: true, description: 'e.g. @yourbandname — we use this to find your profile in our system' },
  { title: 'Email', type: 'SHORT_ANSWER', required: false },
  { title: 'Bio / Description', type: 'PARAGRAPH', required: false },
  { title: 'City / Home Base', type: 'SHORT_ANSWER', required: false },
  { title: 'Instagram URL', type: 'SHORT_ANSWER', required: false },
  { title: 'Facebook URL', type: 'SHORT_ANSWER', required: false },
  { title: 'YouTube URL', type: 'SHORT_ANSWER', required: false },
  { title: 'Spotify URL', type: 'SHORT_ANSWER', required: false },
  { title: 'Bandcamp URL', type: 'SHORT_ANSWER', required: false },
  { title: 'SoundCloud URL', type: 'SHORT_ANSWER', required: false },
  { title: 'Linktree URL', type: 'SHORT_ANSWER', required: false },
  { title: 'Bandsintown URL', type: 'SHORT_ANSWER', required: false },
  { title: 'Website URL', type: 'SHORT_ANSWER', required: false },
  { title: 'Custom Link — Label', type: 'SHORT_ANSWER', required: false, description: 'e.g. Merch, Press Kit, Tickets' },
  { title: 'Custom Link — URL', type: 'SHORT_ANSWER', required: false },
];

const ADMIN_COLUMNS = ['Approved', 'Processed', 'Matched Artist ID', 'Match Method', 'Error Notes'];

function columnLetter(index) {
  let letter = '', n = index + 1;
  while (n > 0) { const rem = (n - 1) % 26; letter = String.fromCharCode(65 + rem) + letter; n = Math.floor((n - 1) / 26); }
  return letter;
}

function buildQuestionItem(q, index) {
  const item = { title: q.title };
  if (q.description) item.description = q.description;
  if (q.type === 'RADIO') {
    item.questionItem = { question: { required: q.required, choiceQuestion: { type: 'RADIO', options: q.options.map(v => ({ value: v })) } } };
  } else {
    item.questionItem = { question: { required: q.required, textQuestion: { paragraph: q.type === 'PARAGRAPH' } } };
  }
  return { createItem: { item, location: { index } } };
}

async function authorize() {
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  if (existsSync(TOKEN_PATH)) {
    const tokens = JSON.parse(readFileSync(TOKEN_PATH, 'utf8'));
    oauth2Client.setCredentials(tokens);
    if (tokens.expiry_date && Date.now() > tokens.expiry_date - 60000) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      writeFileSync(TOKEN_PATH, JSON.stringify(credentials, null, 2));
      oauth2Client.setCredentials(credentials);
    }
    return oauth2Client;
  }

  const authUrl = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES, prompt: 'consent' });
  console.log('\n=== Google Authorization Required ===\n');
  console.log('Open this URL in your browser:\n');
  console.log(authUrl);
  console.log('\nWaiting for callback on http://localhost:9876 ...\n');

  const tokens = await new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      if (!req.url?.startsWith('/?')) { res.writeHead(404); res.end(); return; }
      const url = new URL(req.url, 'http://localhost:9876');
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      if (error) { res.writeHead(400, { 'Content-Type': 'text/html' }); res.end(`<p>OAuth error: ${error}</p>`); server.close(); reject(new Error(error)); return; }
      try {
        const { tokens } = await oauth2Client.getToken(code);
        res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<p>Authorization successful! Return to the terminal.</p>');
        server.close(); resolve(tokens);
      } catch (err) { res.writeHead(500, { 'Content-Type': 'text/html' }); res.end('<p>Failed.</p>'); server.close(); reject(err); }
    });
    server.listen(9876);
  });

  writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log('✅ Authorized — tokens saved to scripts/.form-tokens.json\n');
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}

async function configureForm(auth) {
  const forms = google.forms({ version: 'v1', auth });
  console.log('📋 Fetching existing form...');
  const { data: form } = await forms.forms.get({ formId: FORM_ID });
  const existingItems = form.items ?? [];
  console.log(`   Found ${existingItems.length} existing question(s) — will replace all.`);

  const requests = [
    { updateFormInfo: { info: { title: FORM_TITLE, description: FORM_DESCRIPTION }, updateMask: 'title,description' } },
    ...Array.from({ length: existingItems.length }, (_, i) => ({ deleteItem: { location: { index: existingItems.length - 1 - i } } })),
    ...QUESTIONS.map((q, i) => buildQuestionItem(q, i)),
  ];

  console.log('📝 Applying batchUpdate...');
  await forms.forms.batchUpdate({ formId: FORM_ID, requestBody: { requests } });

  console.log('\n✅ Form configured!');
  console.log(`   View: https://docs.google.com/forms/d/${FORM_ID}/viewform`);
  console.log(`   Edit: https://docs.google.com/forms/d/${FORM_ID}/edit`);
  console.log('\n📊 Sheet column mapping (for n8n):');
  console.log('   A  — Timestamp');
  QUESTIONS.forEach((q, i) => console.log(`   ${columnLetter(i + 1).padEnd(2)} — ${q.title}`));
  console.log(`\n⚠️  NEXT: Submit one test entry, then run: node scripts/configure-band-form.mjs --add-admin-columns`);
}

async function addAdminColumns(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  console.log('📊 Reading Sheet headers...');
  const { data } = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: '1:1' });
  const existingHeaders = data.values?.[0] ?? [];
  if (existingHeaders.length === 0) { console.error('❌ Sheet is empty. Submit a test form entry first.'); process.exit(1); }
  if (ADMIN_COLUMNS.some(col => existingHeaders.includes(col))) { console.warn('⚠️  Admin columns already exist — skipping.'); process.exit(0); }

  const startColIndex = existingHeaders.length;
  const range = `${columnLetter(startColIndex)}1:${columnLetter(startColIndex + ADMIN_COLUMNS.length - 1)}1`;
  await sheets.spreadsheets.values.update({ spreadsheetId: SHEET_ID, range, valueInputOption: 'RAW', requestBody: { values: [ADMIN_COLUMNS] } });

  const { data: ss } = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID, fields: 'sheets.properties' });
  const sheetTabId = ss.sheets?.[0]?.properties?.sheetId ?? 0;
  const checkboxRule = { condition: { type: 'BOOLEAN' }, showCustomUi: true, strict: false };
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { requests: [startColIndex, startColIndex + 1].map(colIndex => ({ setDataValidation: { range: { sheetId: sheetTabId, startRowIndex: 1, endRowIndex: 1000, startColumnIndex: colIndex, endColumnIndex: colIndex + 1 }, rule: checkboxRule } })) },
  });

  console.log('\n✅ Admin columns added!');
  console.log('\n📌 Complete column map (for n8n):');
  console.log('   A  — Timestamp');
  QUESTIONS.forEach((q, i) => console.log(`   ${columnLetter(i + 1).padEnd(2)} — ${q.title}`));
  ADMIN_COLUMNS.forEach((col, i) => console.log(`   ${columnLetter(startColIndex + i).padEnd(2)} — ${col} [ADMIN]`));
}

const isAddAdminColumns = process.argv.includes('--add-admin-columns');
try {
  const auth = await authorize();
  if (isAddAdminColumns) { await addAdminColumns(auth); } else { await configureForm(auth); }
} catch (err) { console.error('\n❌ Error:', err.message ?? err); process.exit(1); }
