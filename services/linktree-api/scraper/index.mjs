/**
 * Linktree Scraper Lambda
 *
 * Triggered hourly by EventBridge. Fetches both Linktree profiles,
 * parses the embedded __NEXT_DATA__ JSON, and writes to DynamoDB.
 *
 * No npm deps needed — uses native fetch (Node 20) and the AWS SDK
 * bundled in the Lambda runtime.
 */

import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION ?? 'us-east-1' });

const TABLE_NAME = process.env.TABLE_NAME;
// e.g. '["stpetemusic","suite_e_studios"]'
const PROFILES = JSON.parse(process.env.LINKTREE_PROFILES ?? '[]');

/** Extract the __NEXT_DATA__ JSON blob from Linktree HTML */
function extractNextData(html) {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error('__NEXT_DATA__ script tag not found');
  return JSON.parse(match[1]);
}

/** Normalize the raw Linktree pageProps into a clean shape */
function normalize(profile, pageProps) {
  const account = pageProps?.account ?? {};
  const links = (pageProps?.links ?? []).map((l) => ({
    id: l.id ?? null,
    title: l.title ?? '',
    url: l.url ?? '',
    thumbnailUrl: l.thumbnailUrl ?? null,
    position: l.position ?? 0,
  }));
  const socialLinks = (pageProps?.socialLinks ?? []).map((s) => ({
    type: s.type ?? '',
    url: s.url ?? '',
  }));

  return {
    profile,
    name: account.name ?? '',
    bio: account.description ?? '',
    avatarUrl: account.profilePictureUrl ?? null,
    links,
    socialLinks,
    lastScraped: new Date().toISOString(),
  };
}

/** Write one profile record to DynamoDB */
async function persist(data) {
  const expiresAt = Math.floor(Date.now() / 1000) + 48 * 60 * 60; // 48h TTL safety net

  await dynamo.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        profile:     { S: data.profile },
        name:        { S: data.name },
        bio:         { S: data.bio },
        avatarUrl:   { S: data.avatarUrl ?? '' },
        links:       { S: JSON.stringify(data.links) },
        socialLinks: { S: JSON.stringify(data.socialLinks) },
        lastScraped: { S: data.lastScraped },
        expiresAt:   { N: String(expiresAt) },
      },
    }),
  );
}

/** Scrape a single Linktree profile */
async function scrapeProfile(profile) {
  const url = `https://linktr.ee/${profile}`;
  const res = await fetch(url, {
    headers: {
      // Mimic a real browser so Linktree doesn't block us
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);

  const html = await res.text();
  const nextData = extractNextData(html);
  const pageProps = nextData?.props?.pageProps ?? {};
  const data = normalize(profile, pageProps);
  await persist(data);
  console.log(`Scraped and saved: ${profile} (${data.links.length} links)`);
  return data;
}

export const handler = async () => {
  if (!TABLE_NAME) throw new Error('TABLE_NAME env var is required');
  if (PROFILES.length === 0) throw new Error('LINKTREE_PROFILES env var is required');

  const results = await Promise.allSettled(PROFILES.map(scrapeProfile));

  const errors = results
    .filter((r) => r.status === 'rejected')
    .map((r) => r.reason?.message ?? String(r.reason));

  if (errors.length > 0) {
    console.error('Scrape errors:', errors);
    // Partial success is fine — don't kill the whole invocation for one profile
  }

  return {
    statusCode: 200,
    scraped: PROFILES.length - errors.length,
    errors,
  };
};
