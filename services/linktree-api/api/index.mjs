/**
 * Linktree API Lambda
 *
 * Handles GET /linktree and GET /linktree/{profile}.
 * Reads from DynamoDB and returns JSON with CORS headers.
 *
 * Connected via HTTP API Gateway (not REST API) — the event shape
 * uses the payload format version 2.0.
 */

import { DynamoDBClient, GetItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION ?? 'us-east-1' });
const TABLE_NAME = process.env.TABLE_NAME;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

/** Convert a DynamoDB item (AttributeValue map) to a plain JS object */
function fromDynamo(item) {
  if (!item) return null;
  return {
    profile:     item.profile?.S ?? '',
    name:        item.name?.S ?? '',
    bio:         item.bio?.S ?? '',
    avatarUrl:   item.avatarUrl?.S || null,
    links:       JSON.parse(item.links?.S ?? '[]'),
    socialLinks: JSON.parse(item.socialLinks?.S ?? '[]'),
    lastScraped: item.lastScraped?.S ?? null,
  };
}

function respond(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

/** GET /linktree/{profile} */
async function getOne(profile) {
  const res = await dynamo.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: { profile: { S: profile } },
    }),
  );

  const data = fromDynamo(res.Item);
  if (!data) {
    return respond(404, { error: `Profile '${profile}' not found` });
  }
  return respond(200, data);
}

/** GET /linktree — all profiles */
async function getAll() {
  const res = await dynamo.send(new ScanCommand({ TableName: TABLE_NAME }));
  const items = (res.Items ?? []).map(fromDynamo).filter(Boolean);
  // Sort deterministically so response order is stable
  items.sort((a, b) => a.profile.localeCompare(b.profile));
  return respond(200, items);
}

export const handler = async (event) => {
  if (!TABLE_NAME) {
    return respond(500, { error: 'Server misconfiguration: TABLE_NAME not set' });
  }

  // HTTP API Gateway v2 sends OPTIONS preflight — respond immediately
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  try {
    const profile = event.pathParameters?.profile;
    if (profile) {
      return await getOne(profile);
    }
    return await getAll();
  } catch (err) {
    console.error('API error:', err);
    return respond(500, { error: 'Internal server error' });
  }
};
