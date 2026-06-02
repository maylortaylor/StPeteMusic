/**
 * Configures the existing StPeteMusic Google Form and Sheet for the artist info sync system.
 *
 * Prerequisites (run once before this script):
 *   gcloud auth application-default login \
 *     --scopes=https://www.googleapis.com/auth/forms,https://www.googleapis.com/auth/spreadsheets
 *
 * Usage:
 *   node scripts/configure-band-form.mjs
 *     → Replaces Form questions with the canonical 17-question set
 *     → Prints the Sheet column mapping needed to configure n8n
 *
 *   node scripts/configure-band-form.mjs --add-admin-columns
 *     → Appends Approved/Processed/etc. columns to the Sheet
 *     → Run AFTER submitting one test form entry (Google creates form columns on first response)
 *
 * Required in .env (local only — never add to Amplify):
 *   GOOGLE_FORM_ID   — from Form edit URL: /forms/d/{ID}/edit
 *   GOOGLE_SHEET_ID  — 1TlCiXriCaVxcWIvax-ec5shMbhNLcE78p2jnyQhwRu8
 */

import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Load root .env into process.env (skip already-set vars)
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
} catch {
  // rely on already-exported env vars
}

const FORM_ID = process.env.GOOGLE_FORM_ID;
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

if (!FORM_ID || !SHEET_ID) {
  console.error('Missing required env vars: GOOGLE_FORM_ID and/or GOOGLE_SHEET_ID');
  console.error('Add them to .env (local only — not needed at runtime).');
  console.error('  GOOGLE_FORM_ID   — from Form edit URL: /forms/d/{ID}/edit');
  console.error('  GOOGLE_SHEET_ID  — 1TlCiXriCaVxcWIvax-ec5shMbhNLcE78p2jnyQhwRu8');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Form configuration
// ---------------------------------------------------------------------------

const FORM_TITLE = 'StPeteMusic — Artist Info Submission';
const FORM_DESCRIPTION =
  'Fill this out to get your artist profile listed on www.stpetemusic.live. ' +
  "We'll review your submission and update your page within a few days. " +
  'Instagram handle is required — we use it to find your existing profile in our system.';

// Canonical question list — order matters (drives Sheet column order)
const QUESTIONS = [
  {
    title: 'Band / Artist Name',
    type: 'SHORT_ANSWER',
    required: true,
  },
  {
    title: 'Artist Type',
    type: 'RADIO',
    required: true,
    options: ['Band', 'Solo Artist', 'DJ', 'Event Producer', 'Creative', 'Other'],
  },
  {
    title: 'Instagram Handle',
    type: 'SHORT_ANSWER',
    required: true,
    description: 'e.g. @yourbandname — we use this to find your profile in our system',
  },
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
  {
    title: 'Custom Link — Label',
    type: 'SHORT_ANSWER',
    required: false,
    description: 'e.g. Merch, Press Kit, Tickets',
  },
  { title: 'Custom Link — URL', type: 'SHORT_ANSWER', required: false },
];

// Admin columns appended to Sheet after first test submission
const ADMIN_COLUMNS = [
  'Approved',
  'Processed',
  'Matched Artist ID',
  'Match Method',
  'Error Notes',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildQuestionItem(q, index) {
  const item = { title: q.title };
  if (q.description) item.description = q.description;

  if (q.type === 'RADIO') {
    item.questionItem = {
      question: {
        required: q.required,
        choiceQuestion: {
          type: 'RADIO',
          options: q.options.map((v) => ({ value: v })),
        },
      },
    };
  } else {
    item.questionItem = {
      question: {
        required: q.required,
        textQuestion: { paragraph: q.type === 'PARAGRAPH' },
      },
    };
  }

  return {
    createItem: {
      item,
      location: { index },
    },
  };
}

// Column index → letter(s), 0-based (0 → 'A', 25 → 'Z', 26 → 'AA')
function columnLetter(index) {
  let letter = '';
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

// ---------------------------------------------------------------------------
// Main: configure Form questions
// ---------------------------------------------------------------------------

async function configureForm(forms) {
  console.log('\n📋 Fetching existing form...');
  const { data: form } = await forms.forms.get({ formId: FORM_ID });

  const existingItems = form.items ?? [];
  console.log(`   Found ${existingItems.length} existing question(s) — will replace all.`);

  const requests = [];

  // 1. Update form title + description
  requests.push({
    updateFormInfo: {
      info: { title: FORM_TITLE, description: FORM_DESCRIPTION },
      updateMask: 'title,description',
    },
  });

  // 2. Delete existing items (highest index first to avoid shifting)
  for (let i = existingItems.length - 1; i >= 0; i--) {
    requests.push({ deleteItem: { location: { index: i } } });
  }

  // 3. Create all questions in order
  QUESTIONS.forEach((q, i) => requests.push(buildQuestionItem(q, i)));

  console.log('📝 Applying batchUpdate to Form...');
  await forms.forms.batchUpdate({
    formId: FORM_ID,
    requestBody: { requests },
  });

  console.log('\n✅ Form configured successfully!');
  console.log(`   Title:    ${FORM_TITLE}`);
  console.log(`   Questions: ${QUESTIONS.length}`);
  console.log(`   Form URL: https://docs.google.com/forms/d/${FORM_ID}/viewform`);
  console.log(`   Edit URL: https://docs.google.com/forms/d/${FORM_ID}/edit`);

  // Print the expected Sheet column mapping (Timestamp is col A, questions follow)
  console.log('\n📊 Expected Sheet column mapping (for n8n):');
  console.log('   A  — Timestamp (auto-generated by Google)');
  QUESTIONS.forEach((q, i) => {
    const col = columnLetter(i + 1); // offset by 1 for Timestamp in col A
    console.log(`   ${col.padEnd(2)} — ${q.title}`);
  });

  const adminStartCol = columnLetter(QUESTIONS.length + 1);
  console.log(`\n⚠️  NEXT STEPS:`);
  console.log(
    '   1. Submit one test form entry: https://docs.google.com/forms/d/' + FORM_ID + '/viewform',
  );
  console.log('      This triggers Google to create the Sheet column headers.');
  console.log(
    `   2. Then run:  node scripts/configure-band-form.mjs --add-admin-columns`,
  );
  console.log(
    `      Admin columns (Approved, Processed, etc.) will be added starting at column ${adminStartCol}.`,
  );
}

// ---------------------------------------------------------------------------
// Main: add admin columns to Sheet
// ---------------------------------------------------------------------------

async function addAdminColumns(sheets) {
  console.log('\n📊 Reading Sheet headers...');

  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: '1:1', // first row only
  });

  const existingHeaders = data.values?.[0] ?? [];
  if (existingHeaders.length === 0) {
    console.error(
      '❌ Sheet row 1 is empty. Submit a test form entry first so Google creates the column headers.',
    );
    process.exit(1);
  }

  console.log(`   Found ${existingHeaders.length} existing column(s).`);

  // Check if admin columns already exist
  const existingAdminCols = ADMIN_COLUMNS.filter((col) => existingHeaders.includes(col));
  if (existingAdminCols.length > 0) {
    console.warn(`⚠️  Some admin columns already exist: ${existingAdminCols.join(', ')}`);
    console.warn('   Skipping to avoid duplicates.');
    process.exit(0);
  }

  // Append admin column headers in row 1
  const startColIndex = existingHeaders.length; // 0-based
  const startColLetter = columnLetter(startColIndex);
  const endColLetter = columnLetter(startColIndex + ADMIN_COLUMNS.length - 1);
  const range = `${startColLetter}1:${endColLetter}1`;

  console.log(`📝 Writing admin headers to range ${range}...`);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: 'RAW',
    requestBody: { values: [ADMIN_COLUMNS] },
  });

  // Add checkbox data validation to Approved and Processed columns
  const { data: spreadsheet } = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: 'sheets.properties',
  });

  const sheetTab = spreadsheet.sheets?.[0];
  const sheetTabId = sheetTab?.properties?.sheetId ?? 0;
  const approvedColIndex = startColIndex;     // first admin column
  const processedColIndex = startColIndex + 1; // second admin column

  const checkboxRule = {
    condition: { type: 'BOOLEAN' },
    showCustomUi: true,
    strict: false,
  };

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [approvedColIndex, processedColIndex].map((colIndex) => ({
        setDataValidation: {
          range: {
            sheetId: sheetTabId,
            startRowIndex: 1,   // skip header row
            endRowIndex: 1000,
            startColumnIndex: colIndex,
            endColumnIndex: colIndex + 1,
          },
          rule: checkboxRule,
        },
      })),
    },
  });

  console.log('\n✅ Admin columns added!');
  ADMIN_COLUMNS.forEach((col, i) => {
    console.log(`   ${columnLetter(startColIndex + i)} — ${col}${i < 2 ? ' (checkbox)' : ''}`);
  });

  console.log('\n📌 n8n workflow — column summary:');
  console.log('   A  — Timestamp');
  QUESTIONS.forEach((q, i) => {
    const col = columnLetter(i + 1);
    console.log(`   ${col.padEnd(2)} — ${q.title}`);
  });
  ADMIN_COLUMNS.forEach((col, i) => {
    const letter = columnLetter(startColIndex + i);
    console.log(`   ${letter.padEnd(2)} — ${col} [ADMIN]`);
  });
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const isAddAdminColumns = process.argv.includes('--add-admin-columns');

try {
  const auth = new google.auth.GoogleAuth({
    scopes: [
      'https://www.googleapis.com/auth/forms',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });
  const client = await auth.getClient();
  google.options({ auth: client });

  if (isAddAdminColumns) {
    const sheets = google.sheets({ version: 'v4' });
    await addAdminColumns(sheets);
  } else {
    const forms = google.forms({ version: 'v1' });
    await configureForm(forms);
  }
} catch (err) {
  if (err.message?.includes('Could not load the default credentials')) {
    console.error('\n❌ No Google credentials found.');
    console.error('   Run this first:');
    console.error(
      '   gcloud auth application-default login \\',
    );
    console.error(
      '     --scopes=https://www.googleapis.com/auth/forms,https://www.googleapis.com/auth/spreadsheets',
    );
    process.exit(1);
  }
  console.error('\n❌ Error:', err.message ?? err);
  process.exit(1);
}
