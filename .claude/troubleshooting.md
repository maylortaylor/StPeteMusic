---
topic: troubleshooting
triggers: errors, down, 403, 500, not responding, connection refused, site down, streaming, rtmp, obs not connecting, live page broken, tofu, credentials
updated: 2026-09-23
---

# Troubleshooting

The site, admin, n8n and listmonk are debugged in `roboborealis/roboborealis-platform`, not here.
Start with that repo's `docs/INFRASTRUCTURE.md`. This file covers what this repo still owns.

## Quick health check

```bash
for u in https://stpetemusic.live/ https://admin.stpetemusic.live/ https://n8n.stpetemusic.live/healthz https://stpetemusic.live/api/stream/status; do
  curl -s -o /dev/null -w "$u %{http_code}\n" --max-time 10 "$u"
done
```

`/api/stream/status` returns `{"live":false}` when nothing is publishing. That is normal.

## AWS credentials

`Error: No valid credential sources found`, or a path to `amver-hub/aws_token` in an error:
a PSD env var is leaking in. Use the `awsp` alias, or `unset AWS_WEB_IDENTITY_TOKEN_FILE
AWS_ROLE_ARN` then `AWS_PROFILE=personal aws sts get-caller-identity`.

## OpenTofu

- `Backend initialization required`: `cd infrastructure && awsp tofu init -reconfigure`.
- A local `plan` without every CI `TF_VAR_*` flips count-gated resources to 0 and plans
  phantom destroys. Read the CI plan on the PR instead of trusting a local one.

## Live streaming (OBS / RTMP / `/live`)

1. **OBS "unable to connect":** `nc -vz -G 5 stream.stpetemusic.live 1935`. If that works, the
   Stream Key format is wrong: it must be `live?user=stream&pass=<key>`.
2. **OBS connects but auth fails:** mediamtx on the services box has the wrong key. Check its
   logs over SSM (no SSH, port 22 is closed):
   ```bash
   awsp aws ssm send-command --instance-ids i-00a2e6f72b886b28b --document-name AWS-RunShellScript \
     --parameters 'commands=["docker logs --tail 50 rb-services-mediamtx"]'
   ```
3. **Streaming but `/live` says off air:** check the manifest and the platform's status route:
   `curl -s https://stpetemusic.live/api/stream/status` and
   `curl -sI https://hls.stpetemusic.live/live/index.m3u8`.
4. **Player shows but video is blank:** usually CORS or CSP. Check the browser console. The HLS
   response must carry exactly one `access-control-allow-origin` header.
5. **No autoplay:** browsers block unmuted autoplay without a user gesture. Expected.

The `stpetemusic-rtmp-unhealthy` alarm (via SNS `stpetemusic-alerts`) fires when the Route 53
health check cannot reach `:1935`.
