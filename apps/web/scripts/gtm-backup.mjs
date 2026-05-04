/**
 * gtm-backup.mjs
 *
 * Downloads the full GTM container config (tags, triggers, variables, folders)
 * and writes it to data/gtm-backup-YYYY-MM-DD.json in the project root.
 *
 * Usage:
 *   npm run gtm:backup --workspace=apps/web
 *
 * Required env vars:
 *   GTM_ACCOUNT_ID           — numeric, found in GTM URL: accounts/{id}/containers/...
 *   GTM_CONTAINER_ID         — numeric, found in GTM URL: .../containers/{id}/...
 *   GOOGLE_ANALYTICS_SA_JSON — full service account JSON string (or set
 *                              GOOGLE_APPLICATION_CREDENTIALS to a key file path)
 *
 * The service account must have "Publish" access on the GTM container.
 * Grant it in GTM Admin → Container → User Management.
 */

import { config } from 'dotenv';
import { google } from 'googleapis';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSACredentials } from './google-auth.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..', '.');

// Load from apps/web/.env.local first, then fall back to root .env
config({ path: join(__dirname, '..', '.env.local') });
config({ path: join(__dirname, '..', '..', '..', '.env') });

// ── Validate env ─────────────────────────────────────────────────────────────
const accountId = process.env.GTM_ACCOUNT_ID;
const containerId = process.env.GTM_CONTAINER_ID;

if (!accountId || !containerId) {
  console.error('Missing GTM_ACCOUNT_ID or GTM_CONTAINER_ID env var');
  process.exit(1);
}

const credentials = loadSACredentials();
const authConfig = new google.auth.GoogleAuth({
  ...(credentials ? { credentials } : {}),
  scopes: ['https://www.googleapis.com/auth/tagmanager.readonly'],
});

// ── Fetch container data ──────────────────────────────────────────────────────
const tagmanager = google.tagmanager({ version: 'v2', auth: authConfig });
const parent = `accounts/${accountId}/containers/${containerId}/workspaces/1`;

console.log(`Fetching GTM container ${accountId}/${containerId}…`);

const [tagsRes, triggersRes, variablesRes] = await Promise.all([
  tagmanager.accounts.containers.workspaces.tags.list({ parent }),
  tagmanager.accounts.containers.workspaces.triggers.list({ parent }),
  tagmanager.accounts.containers.workspaces.variables.list({ parent }),
]);

const backup = {
  exportedAt: new Date().toISOString(),
  accountId,
  containerId,
  tags: tagsRes.data.tag ?? [],
  triggers: triggersRes.data.trigger ?? [],
  variables: variablesRes.data.variable ?? [],
};

// ── Write output ──────────────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);
const outDir = join(projectRoot, 'data');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `gtm-backup-${today}.json`);
writeFileSync(outPath, JSON.stringify(backup, null, 2), 'utf8');

console.log(`✓ Backed up ${backup.tags.length} tags, ${backup.triggers.length} triggers, ${backup.variables.length} variables → ${outPath}`);
