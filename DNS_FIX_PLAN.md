# DNS Fix Plan — stpetemusic.live
> Last updated: 2026-04-25

## Problem Summary

- **Cloudflare Registrar locks nameservers** — cannot switch to Route 53. `cora.ns.cloudflare.com` + `kurt.ns.cloudflare.com` are permanent.
- **Amplify generates a new CloudFront URL every time the domain is re-added** — docs had 4 different stale URLs, Cloudflare was always pointing to old ones.
- **Cloudflare DNS is currently EMPTY** — all records were deleted.
- **Route 53 hosted zone exists but is useless** — world resolves through Cloudflare, not Route 53. Costing $0.50/month.

## Definitive Values (authoritative — do not change)

| Thing | Value |
|-------|-------|
| Amplify App ID | `d1fjwgk99cbqor` |
| Amplify App Name | `stpetemusic-web` |
| Current CloudFront URL | `d35nc2e8nr92q9.cloudfront.net` |
| AWS Account | `767350869653` |
| Region | `us-east-1` |
| Route 53 Zone ID (to delete) | `Z019153510JAZNJAOL0J6` |
| Cloudflare Account | `TheBurgMusic@gmail.com` |
| Domain | `stpetemusic.live` |

## DNS Records to Add in Cloudflare

All three must be **DNS only (grey cloud, NOT proxied)**.

| Type | Name | Content | Proxy | Purpose |
|------|------|---------|-------|---------|
| CNAME | `_ddf1b33c5eab2d60eddc95848a12d240` | `_bf19e363018afabe1b2e49737993dac9.jkddzztszm.acm-validations.aws.` | DNS only | ACM SSL validation — do not touch |
| CNAME | `www` | `d35nc2e8nr92q9.cloudfront.net` | DNS only | www → Amplify |
| CNAME | `@` | `d35nc2e8nr92q9.cloudfront.net` | DNS only | apex → Amplify (Cloudflare CNAME flattening) |

## Step-by-Step Fix

### Step 1 — Add DNS records to Cloudflare (manual or API)

**Option A: Cloudflare Dashboard (manual)**
1. Go to dash.cloudflare.com → stpetemusic.live → DNS → Records
2. Add each record from the table above
3. Make sure proxy status is grey cloud (DNS only) for all three

**Option B: Cloudflare API (CLI)**
```bash
# Replace <ZONE_ID> and <API_TOKEN> with your Cloudflare values
# Zone ID is on the Cloudflare dashboard Overview page (right sidebar)
# API Token: dash.cloudflare.com/profile/api-tokens → Create Token

CF_ZONE_ID="<ZONE_ID>"
CF_TOKEN="<API_TOKEN>"

# ACM validation record
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "_ddf1b33c5eab2d60eddc95848a12d240",
    "content": "_bf19e363018afabe1b2e49737993dac9.jkddzztszm.acm-validations.aws.",
    "proxied": false
  }'

# www record
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "www",
    "content": "d35nc2e8nr92q9.cloudfront.net",
    "proxied": false
  }'

# apex record (CNAME flattening)
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "@",
    "content": "d35nc2e8nr92q9.cloudfront.net",
    "proxied": false
  }'
```

### Step 2 — Delete Route 53 hosted zone (CLI — already scripted)

```bash
unset AWS_WEB_IDENTITY_TOKEN_FILE

# Delete non-NS/SOA records first
AWS_PROFILE=personal aws route53 change-resource-record-sets \
  --hosted-zone-id Z019153510JAZNJAOL0J6 \
  --change-batch '{
    "Changes": [
      {"Action": "DELETE", "ResourceRecordSet": {"Name": "stpetemusic.live.", "Type": "A", "AliasTarget": {"HostedZoneId": "Z35SXDOTRQ7X7K", "DNSName": "d35nc2e8nr92q9.cloudfront.net.", "EvaluateTargetHealth": false}}},
      {"Action": "DELETE", "ResourceRecordSet": {"Name": "_ddf1b33c5eab2d60eddc95848a12d240.stpetemusic.live.", "Type": "CNAME", "TTL": 500, "ResourceRecords": [{"Value": "_bf19e363018afabe1b2e49737993dac9.jkddzztszm.acm-validations.aws."}]}},
      {"Action": "DELETE", "ResourceRecordSet": {"Name": "www.stpetemusic.live.", "Type": "CNAME", "TTL": 500, "ResourceRecords": [{"Value": "d35nc2e8nr92q9.cloudfront.net"}]}}
    ]
  }' --region us-east-1

# Then delete the hosted zone itself
AWS_PROFILE=personal aws route53 delete-hosted-zone \
  --id Z019153510JAZNJAOL0J6 --region us-east-1
```

### Step 3 — Monitor Amplify until domain activation

```bash
unset AWS_WEB_IDENTITY_TOKEN_FILE

# Poll domain status (run every 30-60s, watch for AVAILABLE)
AWS_PROFILE=personal aws amplify get-domain-association \
  --app-id d1fjwgk99cbqor \
  --domain-name stpetemusic.live \
  --region us-east-1 \
  --query 'domainAssociation.{status: domainStatus, verified: subDomains[*].verified}'
```

Expected status progression:
- `PENDING_VERIFICATION` → `IN_PROGRESS` → `AVAILABLE` ✅

### Step 4 — Verify site is live

```bash
curl -I https://www.stpetemusic.live
# Should return HTTP 200 or 301 redirect
```

## DO NOT DO AGAIN

- **Do NOT re-add the custom domain in Amplify** — every re-add generates a new CloudFront URL, breaking DNS.
- **Do NOT proxy the CNAMEs through Cloudflare** — CloudFront is already a CDN; double-proxying breaks SSL.
- **Do NOT create a Route 53 hosted zone** — Cloudflare nameservers are locked, Route 53 is ignored.

## After Fix — Update These Files

- [ ] `INFRA.md` — update CloudFront URL, DNS record table, app ID, remove "Known Issue" section
- [x] `AWS_SETUP.md` — replaced stale RECENT FIX / DNS sections with authoritative Cloudflare DNS section
- [x] `CLAUDE.md` — fixed Amplify app ID, added DNS (Cloudflare) section, removed "(after DNS setup)" from prod URL
