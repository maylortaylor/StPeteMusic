# StPeteMusic to roboBOREALIS platform (Galaxy client), retiring RDS + Amplify + this EC2

**Status:** planned, not started. Audited and re-scoped 2026-09-20.
**Tracking:** roboborealis/roboborealis-platform#357. This doc is the executable, audited runbook.

> Scope decision (Matt, 2026-09-20): a **true platform-client rebuild**, not a lift-and-shift. StPeteMusic becomes a roboBOREALIS platform client (`clients/stpetemusic/`), a Galaxy tier. Automation, newsletter, and streaming move to the shared **services box**, which already provisions them. RDS, Amplify, and eventually this repo's own EC2 all retire.

## Repos involved

- **roboborealis-platform**: build `clients/stpetemusic/` (the rebuild), plus any new shared capability the platform lacks. This is where most of the work happens.
- **StPeteMusic (this repo)**: retire the infra (Amplify, RDS, the app EC2) once the platform client is live. Streaming/automation config already exists on the services box.

## Why

RDS is the app database for the whole product. Both Amplify SSR apps read it directly over the public internet (`DATABASE_URL = postgresql://.../@<rds>:5432/n8n`), which is why RDS is `publicly_accessible = true`. RDS cannot retire until web + admin leave Amplify. Rebuilding SPM as a platform client removes Amplify, RDS, and the bespoke stack in one move, and folds SPM into the same operational model as every other client.

## End state

- **web + admin**: rebuilt as `clients/stpetemusic/` on the platform, using the shared `apps/web` + `apps/admin`, the section seam (ADR-0006), the client content contract (ADR-0043), platform auth (ADR-0017), and the client-editable CMS (ADR-0046). Runs on the platform client box.
- **database**: platform Postgres, one schema and a scoped role for the client (ADR-0032). Content arrives by ETL from Payload, not a raw dump.
- **n8n, listmonk, mediamtx, nocodb**: on the shared services box (ADR-0022), which already provisions all four (`infrastructure/services/provision/40-n8n.sh`, `41-listmonk.sh`, `42-mediamtx.sh`, `43-nocodb.sh`).
- **retired**: RDS, both Amplify apps, and this repo's `aws_instance.n8n` EC2 once streaming and automation are confirmed on the services box.

## Current state (verified from IaC, 2026-09-20)

- **Services box already provisions** n8n + listmonk + mediamtx + nocodb. #116 (listmonk to services box) is CLOSED. #117 (streaming location) is OPEN, so streaming may not have cut over yet even though the provisioning exists. The services box n8n has its own encryption key in SSM (`/roboborealis/services/n8n/encryption_key`), separate from this repo's.
- **This repo's EC2** (`aws_instance.n8n`, t3.small) still runs the old n8n + listmonk + mediamtx + nginx stack against RDS. It is the thing being retired.
- **RDS** (`db.t4g.micro`) holds the app data (db `n8n`, shared by Payload and n8n) and `listmonk_stpetemusic`. dev-brain claims Suite E + Nicole DBs are here too. Unverified. Confirm in Phase 0.
- **web + admin** are bespoke Next 16 on Amplify SSR: Payload CMS, Clerk auth, plus Eventbrite, YouTube, and featured-artist pipelines. None of these map one-to-one onto the platform yet.
- DNS is Cloudflare, DNS-only (proxy breaks Amplify ACM). That constraint disappears once Amplify is gone.

## The hard part

This is a **rebuild**, not a container port. SPM's bespoke features have to be mapped onto platform equivalents or built as new platform capabilities:

| SPM feature | Platform path |
|---|---|
| Payload CMS content | Platform client-editable CMS (ADR-0046) + client content (ADR-0043). Needs an ETL, schema differs. |
| Clerk auth (admin) | Platform admin auth (ADR-0017). Re-onboard admins, drop Clerk. |
| Newsletter (listmonk) | Services-box listmonk, already provisioned. Move lists + subscribers. |
| Live stream (mediamtx embed) | New shared "stream" section or a client-specific section behind the seam. Streaming runs on the services box. |
| Eventbrite / YouTube / featured-artists | No platform equivalent. Decide per feature: new shared capability, client-specific section, or drop. |

Data is an ETL from Payload's schema into the platform schema, not `pg_dump`/`pg_restore`.

## Phases (map-sized: promote #357 to a wayfinder:map with a child ticket per phase)

### Phase 0 - Verify current state (Matt)
- `psql "$RDS_URL" -c "\l+"` - confirm the databases and sizes. If Suite E / Nicole are on this RDS, they need their own homes before RDS can die.
- On the services box: confirm n8n, listmonk, mediamtx are actually running (not just provisioned), and whether streaming has cut over (#117).
- Inventory Payload content types and volumes (the ETL surface).

### Phase 1 - Feature map + gap analysis (design, grill)
- Map every SPM feature to a platform capability using the table above. For each gap (streaming embed, events, featured artists), decide: new shared capability behind the seam, client-specific section, or drop.
- Output: the `clients/stpetemusic/` shape, plus a list of shared-platform changes needed. Grill before building (WORKING-AGREEMENT).

### Phase 2 - Build the client (roboborealis-platform)
- Build `clients/stpetemusic/` like Nicole (ADR-0005) and FTM: tokens, globals, content, sections, overrides.
- Add any new shared capability the gap analysis found, behind the section seam. Never fork `apps/` per client.
- Provision the client schema (ADR-0014 / ADR-0032). Nothing creates a schema implicitly.

### Phase 3 - Data ETL (Payload to platform schema)
- Write and test a one-time ETL: Payload content to the platform content tables. Dry-run against a copy, diff row counts, verify media references.

### Phase 4 - Automation, newsletter, streaming on the services box
- Confirm n8n workflows run on the services box. Its n8n uses a different encryption key, so stored credentials do not carry over. Re-add credentials on the services-box n8n after importing workflows.
- Confirm listmonk on the services box holds the lists and subscribers (migrate if #116 did not fully move data).
- Cut streaming over to the services-box mediamtx and close #117. CloudFront HLS origin stays `n8n.stpetemusic.live/hls`.

### Phase 5 - Cutover (Matt)
- Point Cloudflare DNS for www + apex + admin at the platform CloudFront. Record the old Amplify targets first for rollback.
- Choose TLS on the platform path (platform already fronts clients with CloudFront + ACM, ADR-0010).
- Verify: homepage, admin login, newsletter, events, featured artists, and the live stream. Watch platform box RAM (ADR-0015 ceiling - adding a client may force a box resize).

### Phase 6 - Retire old infra (Matt, StPeteMusic repo, after stable)
- Snapshot RDS first. Then remove `aws_db_instance.main`, its SG and subnet group, and the `rds_host` SSM param. `awsp tofu apply`.
- Remove both `aws_amplify_app` blocks and domain associations. `awsp tofu apply`.
- Retire `aws_instance.n8n` and its EIP once nothing on the box is in use. `awsp tofu apply`.

## Risks and gotchas

- **Platform box capacity (ADR-0015)**: adding SPM as a client may push the box past its ceiling. Check RAM and resize before cutover.
- **n8n credentials do not migrate across encryption keys**: the services-box n8n has its own key, so credentials must be re-entered after importing workflows.
- **ETL, not a dump**: Payload schema differs from the platform schema. Budget real time for the content migration and verify it.
- **Cutover write-loss window**: freeze writes or take a final delta at DNS flip time.
- **Feature gaps**: Eventbrite, YouTube, and featured-artists have no platform home yet. These can stall the rebuild if not decided in Phase 1.
- **Suite E / Nicole on the same RDS**: if Phase 0 confirms it, RDS cannot die until they move too.

## Rollback

- Before Phase 6, cutover is reversible by pointing Cloudflare DNS back at the recorded Amplify targets. RDS and Amplify are still live.
- After Phase 6, RDS restores from the snapshot and Amplify is re-creatable from IaC in git history.

## Open questions for Matt

- Feature gaps (Eventbrite, YouTube, featured artists): shared capability, client section, or drop?
- Has the services box actually taken over streaming (#117), or is it still on this EC2?
- Confirm listmonk data already moved to the services box (#116 closed), or migrate it.
- Platform box size after adding SPM.

## Related

roboborealis-platform: #103 (The Bridge), #112, #116, #117, #357. ADR-0005 (Nicole rebuilt), ADR-0006 (section seam), ADR-0009 (postgres-on-instance), ADR-0014 / ADR-0032 (client DB + schema), ADR-0015 (box ceiling), ADR-0017 (auth), ADR-0022 (services box), ADR-0043 (content contract), ADR-0046 (client-editable CMS).
