# StPeteMusic: Amplify to container migration, and retiring RDS

**Status:** planned, not started. Audited 2026-09-20.
**Tracking:** roboborealis/roboborealis-platform#357 (decision + spec). This doc is the executable, audited runbook. It lives here because the work happens in this repo.

> This repo auto-applies OpenTofu on push to `main` (`tofu-apply.yml`). Every infra change lands via a branch and a reviewed merge. Never push infra to `main` directly, and never merge a destructive IaC change before the data has moved.

## Why

RDS is the app database for the whole product, not just automation. Both Amplify SSR apps read it directly over the public internet:

```
# amplify.tf, web AND admin:
DATABASE_URL = "postgresql://<user>:<pass>@<rds>:5432/n8n"
```

RDS is `publicly_accessible = true` with 5432 open to `0.0.0.0/0` on purpose, because Amplify SSR Lambdas have no fixed egress IPs. So RDS cannot retire until web and admin leave Amplify. Doing that also removes the Amplify SSR cost, which is the larger line. Retiring both together is the real cost win. There was never a safe quick port.

## Scope (confirm before starting)

Target: containerize web and admin and self-host them on the existing EC2 (the one already running mediamtx, n8n, listmonk), backed by on-box Postgres. Retire Amplify and RDS.

This is NOT a rebuild onto the roboBOREALIS platform client seam (`clients/stpetemusic/`). A true "Galaxy client" rebuild is Nicole-sized (Payload CMS, Clerk auth, Eventbrite and YouTube pipelines) and is a separate future effort. **Open question for Matt: confirm self-host now, platform-client rebuild later.**

## Current state (verified from IaC + compose, 2026-09-20)

- One EC2 `aws_instance.n8n` (t3.small, 2 GB, Elastic IP) runs everything on the box via `n8n/docker-compose.prod.yaml`: n8n, listmonk, mediamtx, nginx, autoheal. Streaming origin is `n8n.stpetemusic.live/hls`.
- All three data consumers point at `RDS_HOST`: the app uses db `n8n`, n8n uses db `n8n`, listmonk uses db `listmonk_stpetemusic` with `ssl_mode=require`.
- Web and admin are Amplify SSR only. No Dockerfiles, no `output: 'standalone'` in either next config.
- `apps/web/src/lib/db.ts` already sets `ssl:false` for localhost and SSL for remote, so pointing at localhost Postgres needs no app code change.
- DNS is Cloudflare, all records `proxied = false` (DNS-only), because Cloudflare proxy breaks Amplify ACM validation. www, apex, and admin are CNAMEs to Amplify targets. The apex to www redirect is an Amplify edge `custom_rule`.
- Deploy today (`deploy.yml`): build a tarball, scp to EC2, extract, `docker compose up` with public images. Secrets flow from GitHub Actions into a `.env` on the box.
- `backup.tf` already provides an S3 bucket (`stpetemusic-n8n-backups`, 7-day expiry) and an EC2 instance role that can write to it.
- CloudWatch alarms in `alarms.tf` are tuned for the current load.

## Phases

### Phase 0 - Confirm current state (Matt, ~15 min)
- `psql "$RDS_URL" -c "\l+"` - list every database and its size. Confirms whether only `n8n` and `listmonk_stpetemusic` live there, or Suite E and Nicole too (a dev-brain note claims they do, unverified). If Suite E or Nicole are present, widen scope before proceeding.
- `docker ps` on the EC2 - confirm the running set.
- Record the current Cloudflare CNAME targets for www, apex, admin, so cutover is reversible.
- Decide the target instance size (see Phase 2).

### Phase 1 - Containerize web + admin (agent-preppable, zero prod impact)
- Add `output: 'standalone'` to `apps/web/next.config.*` and `apps/admin/next.config.*`.
- Add a multi-stage Dockerfile per app, built for arm64 to match the EC2. Include `sharp` for `next/image` (Amplify bundled it, a plain standalone image does not), or set an unoptimized loader.
- Extend `n8n/docker-compose.prod.yaml` with `web`, `admin`, and `postgres:16` services. Give Postgres a named volume. Pin every image to an explicit version, not `:latest` (platform rule, and `n8nio/n8n:latest` etc are currently unpinned).
- Add nginx (already on the box) server blocks for `www.` and `admin.`, keeping the existing `n8n.` and `/hls` routes untouched.
- `DATABASE_URL` for both apps points at the `postgres` service. `db.ts` drops SSL for localhost automatically.
- `docker exec` a healthcheck against each real image before committing it (the mediamtx restart-loop lesson).

### Phase 2 - CI/CD for images + on-box Postgres + data migration (Matt runs, agent preps)
- **New pipeline**: web and admin are not containerized today, and `deploy.yml` only ships public images in a tarball. Add an image build and push (ECR or GHCR, arm64) and have the EC2 pull them. Retire `amplify-deploy.yml`, and fold `web-ci.yml` / `admin-ci.yml` into the container build.
- Matt: take an RDS snapshot first. This is the rollback:
  ```
  awsp aws rds create-db-snapshot --db-instance-identifier stpetemusic-postgres --db-snapshot-identifier spm-pre-migration-<date>
  ```
- Bring up `postgres:16` on the box. `pg_dump` each database from RDS and restore into it, roles and passwords included.
- **Preserve `N8N_ENCRYPTION_KEY` exactly.** n8n stored credentials are encrypted with it. A different key bricks every credential. It is already a GitHub secret, so keep the compose value identical.
- Change listmonk `LISTMONK_db__ssl_mode` from `require` to `disable` for localhost.
- **RAM**: t3.small (2 GB) already runs mediamtx + n8n + listmonk. Adding two Node SSR apps + Postgres does not fit. Plan t3.medium at minimum, more likely t3.large. Net saving is (RDS + Amplify SSR) minus the instance bump, still positive. Do not repeat the 2026-04-28 OOM.
- Add a nightly `pg_dump` to S3 (reuse the `backup.tf` bucket and role) and run one restore test. RDS gave automated backups for free, so this is not optional. Raise the bucket lifecycle expiry above 7 days for the migration window.

### Phase 3 - Cutover (Matt, one maintenance window)
- **Freeze writes** or take a final incremental dump at flip time. Writes to RDS between the Phase 2 dump and this flip (newsletter signups, admin edits, n8n runs) are otherwise lost.
- Bring web and admin up on the EC2 against localhost Postgres.
- **TLS decision** (pick one, then implement): Cloudflare proxied (orange cloud) + a Cloudflare origin cert on nginx, OR CloudFront + ACM in front of the EC2, OR nginx + Let's Encrypt. The Amplify-ACM constraint that forced DNS-only is gone once Amplify is gone.
- Move the apex to www redirect off Amplify into nginx or a Cloudflare rule.
- Flip the Cloudflare CNAMEs for www, apex, admin from the Amplify targets to the EC2 origin (or the new CloudFront).
- Schedule this in a low-traffic window: an instance resize reboots the box and interrupts the live stream.
- Verify: homepage renders, admin login (Clerk), newsletter subscribe (listmonk), a featured-artist sync, revalidation, and the live stream. Watch box RAM.

### Phase 4 - Retire Amplify + RDS (Matt, after a few days stable)
- Remove `aws_amplify_app.web` / `.admin`, their branches and domain associations from `amplify.tf`. `awsp tofu apply`.
- Remove `aws_db_instance.main`, `aws_security_group.rds`, `aws_db_subnet_group.main`, and the `rds_host` SSM param from `database.tf`. `awsp tofu apply`. The Phase 2 snapshot is the undo.
- Update `DATABASE_URL` construction and any `/stpetemusic/rds/*` SSM references to the on-box host.
- Re-tune the CloudWatch alarms in `alarms.tf` for the new load, especially the memory alarm.
- Decide the S3 upload credential path: keep the explicit `admin_s3_upload` IAM keys, or switch the container to the EC2 instance role (cleaner, needs S3 perms added to the role).

## Cutover data-loss guard (do not skip)

The dump-restore-flip sequence loses anything written to RDS after the dump. Options, cheapest first:
1. Short maintenance window: put the site in a read-only or maintenance state, dump, restore, flip.
2. Final incremental dump at flip time and load only new rows.
3. Logical replication from RDS to on-box Postgres, then flip with near-zero lag.

## Rollback

- Before Phase 4, cutover is reversible: flip the Cloudflare CNAMEs back to the recorded Amplify targets. RDS is still live.
- After Phase 4, RDS is restorable from the Phase 2 snapshot, and Amplify is re-creatable from IaC in git history.

## Acceptance criteria

- `www.stpetemusic.live` and `admin.stpetemusic.live` served from containers on the EC2, no Amplify.
- No `aws_db_instance` or `aws_amplify_app` in the IaC. `tofu plan` clean.
- Both apps on on-box Postgres. Newsletter, admin auth, featured-artist pipeline, revalidation, and live streaming verified.
- n8n credentials still decrypt (encryption key preserved).
- Nightly `pg_dump` to S3 exists and a restore has been run once.
- RDS snapshot retained at least 30 days post-cutover.

## Open questions for Matt

- Confirm scope: self-host on the SPM EC2 now, platform-client rebuild later.
- Instance size after the move (measure in Phase 0 and 2).
- Do n8n and listmonk stay on this EC2, or move to the platform services box? Platform issues #112 and #116 (shared n8n, listmonk to services box) are closed, but the IaC shows both still here on this RDS. Confirm whether those shipped or were reverted.
- TLS path: Cloudflare-proxied + origin cert, CloudFront + ACM, or nginx + Let's Encrypt.
- Staging: Amplify has `develop` branches. Keep a staging environment, or drop it.

## Related

roboborealis-platform #103 (The Bridge), #112, #116, #117 (where streaming lives), ADR-0005 (Nicole rebuilt), ADR-0009 (postgres-on-instance), ADR-0015 (the box has a ceiling).
