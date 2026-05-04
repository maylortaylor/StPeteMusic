/**
 * Shared helper: load Google service account credentials for scripts.
 *
 * Checks in order:
 *   1. GOOGLE_SA_KEY_FILE  — path to a .json key file (recommended)
 *   2. GOOGLE_APPLICATION_CREDENTIALS — standard Google env var (path to key file)
 *   3. GOOGLE_ANALYTICS_SA_JSON / GCAL_SERVICE_ACCOUNT_JSON — raw JSON string
 *      (only works if the value is on a single line in .env)
 *
 * Returns parsed credentials object, or null if using GOOGLE_APPLICATION_CREDENTIALS
 * (the Google client libraries pick that up automatically).
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadSACredentials() {
  // 1. Prefer a key file path — avoids all multiline dotenv issues
  const keyFile =
    process.env.GOOGLE_SA_KEY_FILE ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (keyFile) {
    // Resolve relative to the scripts/ directory so the path works regardless
    // of which directory the user runs the script from.
    const abs = isAbsolute(keyFile) ? keyFile : resolve(__dirname, keyFile);
    return JSON.parse(readFileSync(abs, 'utf8'));
  }

  // 2. Fall back to inline JSON env var
  const raw =
    process.env.GOOGLE_ANALYTICS_SA_JSON ||
    process.env.GCAL_SERVICE_ACCOUNT_JSON;

  if (raw && raw.trim().startsWith('{')) {
    try {
      return JSON.parse(raw);
    } catch {
      console.error(
        'Failed to parse service account JSON from env var.\n' +
        'The value is likely truncated by dotenv (multiline values are not supported).\n\n' +
        'Fix: save the JSON to a file and set GOOGLE_SA_KEY_FILE=./scripts/sa-key.json',
      );
      process.exit(1);
    }
  }

  console.error(
    'No Google credentials found.\n' +
    'Set GOOGLE_SA_KEY_FILE=./scripts/sa-key.json (path to your service account JSON file)',
  );
  process.exit(1);
}
