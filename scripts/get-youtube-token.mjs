/**
 * One-time OAuth2 flow to generate YOUTUBE_REFRESH_TOKEN.
 * Run: node scripts/get-youtube-token.mjs
 * Then paste the printed YOUTUBE_REFRESH_TOKEN into apps/admin/.env.local
 *
 * Requires in .env.local (or exported env vars):
 *   YOUTUBE_OAUTH_CLIENT_ID
 *   YOUTUBE_OAUTH_CLIENT_SECRET
 */

import http from 'http';
import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local from apps/admin if not already in env
try {
  const envPath = resolve(process.cwd(), 'apps/admin/.env.local');
  const envContent = readFileSync(envPath, 'utf8');
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
  // .env.local not found — rely on already-exported env vars
}

const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID;
const clientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('Missing YOUTUBE_OAUTH_CLIENT_ID or YOUTUBE_OAUTH_CLIENT_SECRET');
  console.error('Add them to apps/admin/.env.local or export them before running this script.');
  process.exit(1);
}

const REDIRECT_URI = 'http://localhost:9876/oauth/callback';

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

// Scopes needed: YouTube write + Google Calendar read
const SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/calendar.readonly',
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent', // force consent screen to ensure refresh_token is returned
});

console.log('\n=== YouTube OAuth Setup ===\n');
console.log('1. Open this URL in your browser:\n');
console.log(authUrl);
console.log('\n2. Authorize the app with the maylortaylor@gmail.com account');
console.log('3. You will be redirected — this script will capture the code automatically\n');

// Start local server to catch the OAuth redirect
const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith('/oauth/callback')) {
    res.writeHead(404);
    res.end();
    return;
  }

  const url = new URL(req.url, 'http://localhost:9876');
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end(`<p>OAuth error: ${error}. Check the terminal.</p>`);
    console.error('\nOAuth error:', error);
    server.close();
    return;
  }

  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end('<p>No authorization code received.</p>');
    server.close();
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<p>Authorization successful! Check the terminal for your refresh token.</p>');

    console.log('\n✅ Authorization successful!\n');
    console.log('Add this to apps/admin/.env.local:\n');
    console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('\n(Access token expires — the refresh token is what you need to keep.)\n');
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('<p>Token exchange failed. Check the terminal.</p>');
    console.error('\nToken exchange error:', err);
  } finally {
    server.close();
  }
});

server.listen(9876, () => {
  console.log('Waiting for OAuth callback on http://localhost:9876 ...\n');
});
