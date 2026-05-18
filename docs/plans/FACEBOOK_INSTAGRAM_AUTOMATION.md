---
topic: n8n-fb-ig-automation
triggers: n8n, facebook webhook, instagram webhook, post event, fb automation, ig automation, page webhook, comment, message, mention
updated: 2026-05-07
---

# n8n Facebook & Instagram POST Event Handler — Feature Plan

Webhook verification is live (`GET /webhook/fb-page` → returns hub.challenge).
This covers the next phase: handling actual incoming events via POST.

## Architecture

Two separate n8n workflows sharing path `fb-page`:
- **Workflow A** (existing): `GET fb-page` — webhook verification only
- **Workflow B** (new): `POST fb-page` — receives and routes all FB/IG events

## Workflow B Structure

```
Webhook (POST)
    └── Switch node (branch on entry.changes[0].field)
            ├── "feed"         → Page Feed Handler
            ├── "messages"     → Messenger Handler
            ├── "mention"      → Mention Handler
            ├── "comments"     → Instagram Comment Handler
            └── default        → Log & discard
```

### Incoming payload shape (Facebook sends):
```json
{
  "object": "page",
  "entry": [
    {
      "id": "PAGE_ID",
      "time": 1234567890,
      "changes": [
        {
          "field": "feed",
          "value": { ... }
        }
      ]
    }
  ]
}
```

## Handler Branches

### Feed (new posts/comments on Page)
- Trigger: `changes[0].field === "feed"`
- Use cases:
  - New comment on a post → log to Google Sheet or notify via email/Slack
  - New post by someone else on Page → moderate or acknowledge
- n8n nodes: Switch → Set (extract comment text + author) → Google Sheets / Email

### Messenger (new DMs to Page inbox)
- Trigger: `object === "page"` + `messaging` array present
- Use cases:
  - Auto-reply acknowledgement ("Thanks for reaching out! We'll respond soon.")
  - Log to CRM/Sheet with sender PSID + message text
- n8n nodes: Switch → HTTP Request (send reply via Graph API) → Google Sheets

### Mention
- Trigger: `changes[0].field === "mention"`
- Use cases:
  - Log every @StPeteMusic mention
  - Alert Matt via email when mentioned
- n8n nodes: Switch → Email/notification

### Instagram Comments
- Trigger: `object === "instagram"` + `changes[0].field === "comments"`
- Use cases:
  - Log all comments with post ID + commenter username
  - Flag comments containing certain keywords (venue names, "when is", etc.)
- n8n nodes: Switch → Set → Google Sheets

### Instagram Mentions
- Trigger: `changes[0].field === "mentions"`
- Use cases:
  - Notify when someone tags @stpetemusic in a Story or post
  - Log for UGC repurposing

## Security — Verify Facebook Signature

Facebook signs every POST with `X-Hub-Signature-256: sha256=<hmac>`.
Must verify before processing — prevents spoofed payloads.

App secret is in Meta Developer Portal → App Settings → Basic → App Secret.
Add to n8n credentials or env as `FB_APP_SECRET`.

Verification in a Code node (runs before the Switch):
```javascript
const crypto = require('crypto');
const body = JSON.stringify($input.first().json.body);
const sig = $input.first().json.headers['x-hub-signature-256'];
const expected = 'sha256=' + crypto.createHmac('sha256', FB_APP_SECRET).update(body).digest('hex');
if (sig !== expected) throw new Error('Invalid signature');
return $input.all();
```

## Reporting Workflows (separate, scheduled)

Pull data on a schedule rather than event-driven:

| Workflow | Schedule | Data pulled | Destination |
|---|---|---|---|
| FB Page Weekly Report | Monday 9am | reach, impressions, new fans, top posts | Google Sheet / Email |
| IG Weekly Report | Monday 9am | followers, reach, top posts, story views | Google Sheet / Email |
| Ad Spend Report | Monday 9am | spend, CPM, reach by campaign | Google Sheet |

APIs to use:
- `GET /{page-id}/insights?metric=page_fans,page_impressions&period=week`
- `GET /{ig-user-id}/insights?metric=follower_count,reach,impressions&period=day`
- `GET /{ad-account-id}/insights?fields=spend,reach,impressions&date_preset=last_7d`

## Credentials needed in n8n
- Facebook Graph API token: `FACEBOOK_SYSTEM_USER_TOKEN` (already in GitHub Secrets)
- Page ID: stpetemusic Facebook Page ID
- Instagram Business Account ID: from Graph API (`GET /me/accounts` → get IG account linked to Page)
- FB App Secret: for signature verification (Meta Developer Portal → App Settings → Basic)
- Google Sheets OAuth: for logging/reporting destination

## Implementation Order
1. Signature verification Code node (security first)
2. Switch node routing
3. Messenger auto-reply (highest value — users expect fast response)
4. Feed comment logging
5. IG comment logging
6. Scheduled reporting workflows
