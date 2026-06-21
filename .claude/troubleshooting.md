---
topic: troubleshooting
triggers: error, down, debug, troubleshoot, ssh, terraform issue, connection refused, 403, 500, not responding, credentials issue, env leakage, contamination, error logs, production errors, streaming, rtmp, obs, mediamtx, live page, unable to connect
updated: 2026-06-21
---

# Troubleshooting

## Querying Production Error Logs

Both the web app and admin app write structured errors to the `error_logs` table in Postgres. Logs are retained for 30 days.

**Via admin API (easiest for Claude agents — requires a logged-in Clerk session):**
```
GET https://admin.stpetemusic.live/api/admin/error-logs?hours=24
GET https://admin.stpetemusic.live/api/admin/error-logs?hours=48&app=web
GET https://admin.stpetemusic.live/api/admin/error-logs?hours=6&level=error&limit=50
```

Query params:
- `hours` — look back N hours (default 24, max 168)
- `app` — `web` or `admin` (default: both)
- `level` — `error` or `warn` (default: both)
- `limit` — number of results (default 100, max 500)

Response shape:
```json
{
  "summary": { "total": 12, "by_app": {"web": 8, "admin": 4}, "by_status_code": {"500": 10} },
  "errors": [{ "created_at": "...", "app": "web", "status_code": 500, "path": "/api/contact", "message": "..." }]
}
```

**Via direct DB query (for Claude agents with DATABASE_URL):**
```sql
SELECT app, status_code, path, message, created_at
FROM error_logs
WHERE created_at > now() - interval '24 hours'
ORDER BY created_at DESC
LIMIT 50;
```

---

## AWS Credentials Issues

**Problem:** `Error: No valid credential sources found`

**Solution:**
1. Verify `.envrc` is allowed: `direnv allow`
2. Configure AWS profile:
   ```bash
   aws configure --profile personal
   ```
3. Test: `AWS_PROFILE=personal aws sts get-caller-identity`

**Problem:** AWS commands reference `/Users/matttaylor/Documents/_dev/amver-hub/aws_token`

**Solution:** This is contamination from PSD projects. The `.envrc` file should clean this up automatically:
```bash
direnv allow
cd .  # refresh environment
AWS_PROFILE=personal aws sts get-caller-identity
```

If it persists, check your shell config (`.zshrc`, `.bashrc`) for `AWS_WEB_IDENTITY_TOKEN_FILE` and remove it.

## Terraform Issues

**Problem:** `Backend initialization required`

**Solution:**
```bash
cd infrastructure
unset AWS_WEB_IDENTITY_TOKEN_FILE && AWS_PROFILE=personal tofu init -reconfigure
```

**Problem:** `tofu plan` shows no changes but changes are expected

**Solution:** State might be out of sync:
```bash
unset AWS_WEB_IDENTITY_TOKEN_FILE
AWS_PROFILE=personal tofu refresh
AWS_PROFILE=personal tofu plan
```

## n8n Server Down

**Problem:** `https://n8n.stpetemusic.live` not responding

**Solutions (in order):**
1. Check AWS status:
   ```bash
   AWS_PROFILE=personal aws ec2 describe-instance-status \
     --instance-ids i-03874197d725b0455 --region us-east-1
   ```

2. Restart Docker containers:
   ```bash
   ssh -i ~/.ssh/stpetemusic-n8n.pem ec2-user@n8n.stpetemusic.live \
     "cd ~/stpetemusic/n8n && docker-compose -f docker-compose.prod.yaml restart"
   ```

3. Reboot instance:
   ```bash
   AWS_PROFILE=personal aws ec2 reboot-instances \
     --instance-ids i-03874197d725b0455 --region us-east-1
   ```

4. Full stop/start:
   ```bash
   AWS_PROFILE=personal aws ec2 stop-instances --instance-ids i-03874197d725b0455 --region us-east-1
   sleep 30
   AWS_PROFILE=personal aws ec2 start-instances --instance-ids i-03874197d725b0455 --region us-east-1
   ```

## Live Streaming Not Working (OBS / RTMP / /live page)

Full architecture + the 7 root causes already found and fixed (2026-06-21, PRs #236-#242) are in `.claude/infrastructure.md` under "Live Streaming". Check that section first — most repeat failures will be one of those same root causes resurfacing. Quick diagnostic order:

1. **OBS says "unable to connect"** → check network first, not auth:
   ```bash
   AWS_PROFILE=personal aws ec2 describe-instances --instance-ids i-03874197d725b0455 --query 'Reservations[].Instances[].State.Name' --profile personal
   nc -vz -G 5 stream.stpetemusic.live 1935
   ```
   If both are fine, it's almost certainly the OBS Stream Key format — must be `live?user=stream&pass=<key>`, not a bare key, not `rtmp://user:pass@host`, and not OBS's separate "Use Authentication" checkbox.
2. **OBS connects but auth fails repeatedly** → SSH in and check MediaMTX actually has the real key substituted (not the literal `${RTMP_STREAM_KEY}` string):
   ```bash
   ssh -i ~/.ssh/stpetemusic-n8n.pem ec2-user@54.235.171.182 "docker logs --tail 50 stpetemusic-mediamtx"
   ```
3. **OBS streams fine but `/live` shows "Off Air"** → check the manifest directly with cookies, since `curl` without `-L -b/-c` will always show a redirect loop even when the stream is live (this is normal MediaMTX behavior, not a bug):
   ```bash
   curl -s https://www.stpetemusic.live/api/stream/youtube-status   # should be {"live":true,...,"platform":"hls"}
   ```
4. **`/live` shows the player but the video is blank** → almost certainly CORS or CSP, not RTMP/MediaMTX. Check browser console for `Content-Security-Policy` violations or CORS errors — `curl` cannot reproduce these, use a headless browser (Playwright is already a devDependency):
   ```bash
   curl -s -D - -H "Origin: https://www.stpetemusic.live" https://hls.stpetemusic.live/live/index.m3u8 | grep -i access-control-allow-origin
   # should be exactly ONE line, matching the origin — not "*", not two lines
   ```
5. **Video plays but doesn't autostart** → browsers block unmuted autoplay without a user gesture; this is expected, see `LivePlayer.tsx`'s muted-autoplay + unmute-button handling.

## SSH Access Denied

**Problem:** `Connection refused` or `Operation timed out`

**Reason:** SSH is restricted to a specific IP (see `infrastructure/ec2.tf`)

**Solution:** Update the security group in Terraform:
```hcl
# In infrastructure/ec2.tf, find aws_security_group.n8n
# Update cidr_blocks for port 22:
cidr_blocks = ["YOUR.IP.ADDRESS/32"]  # Replace with your public IP
```

Then apply:
```bash
cd infrastructure
unset AWS_WEB_IDENTITY_TOKEN_FILE && AWS_PROFILE=personal tofu apply
```

## Environment Variable Leakage

**Problem:** Global env vars from other projects interfere

**Prevention:**
- ✅ Always run from this project directory (direnv will isolate environment)
- ✅ Use `AWS_PROFILE=personal` explicitly when not in directory
- ✅ Pre-commit hooks prevent committing bad configs
- ✅ Run setup.sh to validate clean environment

**If contamination happens:**
```bash
unset AWS_WEB_IDENTITY_TOKEN_FILE
unset DATABASE_URL
unset KEYCLOAK_ISSUER
direnv allow
cd .  # refresh
```
