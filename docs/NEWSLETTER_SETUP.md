# Newsletter Setup — StPeteMusic

The frontend form and API route are already built. This doc covers everything needed to make it live.

---

## What's Already Done

- `apps/web/src/app/api/newsletter/subscribe/route.ts` — API route, connects to Listmonk via basic auth, handles 409 (already subscribed) gracefully
- `apps/web/src/components/NewsletterSignup.tsx` — form component with loading/success/error states
- EC2 server running Postgres + nginx — perfect home for Listmonk, zero new infrastructure cost

---

## Step 1 — Pick an SMTP Provider

Listmonk needs an email sender to actually deliver newsletters.

**Option A: Resend (recommended for getting started)**
- Free tier: 3,000 emails/month
- Setup: verify domain → get API key → done
- SMTP host: `smtp.resend.com`, port `465`, user `resend`, pass = API key
- Sign up: https://resend.com

**Option B: AWS SES (best long-term, cheapest at scale)**
- $0.10 per 1,000 emails after free tier
- Requires: verify `stpetemusic.live` domain in SES → request production access (removes sandbox)
- Sandbox mode blocks sending to unverified addresses — must escape it before going live
- Console: https://console.aws.amazon.com/ses

---

## Step 2 — Add Listmonk to Docker Compose

In `n8n/docker-compose.prod.yaml`, add the Listmonk service after the `n8n` service:

```yaml
  listmonk:
    image: listmonk/listmonk:latest
    container_name: listmonk
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      - LISTMONK_db__host=postgres
      - LISTMONK_db__port=5432
      - LISTMONK_db__user=${POSTGRES_USER}
      - LISTMONK_db__password=${POSTGRES_PASSWORD}
      - LISTMONK_db__database=listmonk
      - LISTMONK_app__admin_username=${LISTMONK_USERNAME}
      - LISTMONK_app__admin_password=${LISTMONK_PASSWORD}
    ports:
      - "127.0.0.1:9000:9000"
    networks:
      - n8n-net
    mem_limit: 256m
    command: ["./listmonk", "--install", "--idempotent"]  # safe to run repeatedly
```

Also create the `listmonk` database in Postgres on first deploy:

```sql
-- Run once via SSH on the EC2:
docker exec -it stpetemusic-postgres psql -U $POSTGRES_USER -c "CREATE DATABASE listmonk;"
```

Then change the command after first install:
```yaml
    command: ["./listmonk"]
```

---

## Step 3 — Add nginx Proxy Rule

SSH into EC2 and add this block to `/etc/nginx/conf.d/stpetemusic.conf` (or wherever your nginx config lives):

```nginx
location /listmonk/ {
    proxy_pass         http://127.0.0.1:9000/;
    proxy_http_version 1.1;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
}
```

Reload nginx: `sudo nginx -s reload`

Listmonk admin UI will then be at:
`https://n8n-stpetemusic.duckdns.org/listmonk`

---

## Step 4 — Add GitHub Secrets

Go to: https://github.com/maylortaylor/StPeteMusic/settings/secrets/actions

Add these two secrets:

| Secret Name | Value |
|---|---|
| `LISTMONK_USERNAME` | `admin` |
| `LISTMONK_PASSWORD` | (pick a strong password) |

Then add them to the deploy workflow in `.github/workflows/deploy.yml` — in both the `env:` block and the `envs:` list:

```yaml
# In env: block
LISTMONK_USERNAME: ${{ secrets.LISTMONK_USERNAME }}
LISTMONK_PASSWORD: ${{ secrets.LISTMONK_PASSWORD }}

# In envs: list (append to the existing comma-separated list)
LISTMONK_USERNAME,LISTMONK_PASSWORD
```

And in the deploy script section, write them to `.env`:
```bash
echo "LISTMONK_USERNAME=${LISTMONK_USERNAME}" >> ~/stpetemusic/.env
echo "LISTMONK_PASSWORD=${LISTMONK_PASSWORD}" >> ~/stpetemusic/.env
```

---

## Step 5 — Set Amplify Environment Variables

Go to: AWS Console → Amplify → stpetemusic app → Environment variables

Add these for both `main` (production) and `develop` (staging) branches:

| Variable | Value |
|---|---|
| `LISTMONK_API_URL` | `https://n8n-stpetemusic.duckdns.org/listmonk` |
| `LISTMONK_USERNAME` | `admin` |
| `LISTMONK_PASSWORD` | (same password from Step 4) |
| `LISTMONK_LIST_ID` | `1` (update after Step 6 if the list ID differs) |

---

## Step 6 — First-Time Listmonk Admin Setup

Once deployed, go to `https://n8n-stpetemusic.duckdns.org/listmonk` and log in.

**Configure SMTP (Settings → SMTP):**
- If using Resend: host `smtp.resend.com`, port `465`, user `resend`, pass = Resend API key
- If using AWS SES: host `email-smtp.us-east-1.amazonaws.com`, port `587`, user/pass = SES SMTP credentials

**Create the mailing list (Lists → New List):**
- Name: `StPeteMusic Newsletter`
- Type: Public
- Note the list ID — update `LISTMONK_LIST_ID` in Amplify if it's not `1`

**Set from-address (Settings → General):**
- From name: `StPeteMusic`
- From email: `hello@stpetemusic.live` (must be verified in your SMTP provider)

**Test it:**
```bash
curl -X POST https://www.stpetemusic.live/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com"}'
# Should return: {"message":"Subscribed."}
```

---

## Summary Checklist

- [ ] Choose SMTP provider (Resend or AWS SES) and get credentials
- [ ] Add Listmonk service to `n8n/docker-compose.prod.yaml`
- [ ] Create `listmonk` database in Postgres on EC2
- [ ] Add nginx proxy rule at `/listmonk/`
- [ ] Add `LISTMONK_USERNAME` + `LISTMONK_PASSWORD` GitHub Secrets
- [ ] Update `.github/workflows/deploy.yml` to pass Listmonk secrets
- [ ] Set 4 env vars in Amplify console
- [ ] Log into Listmonk admin → configure SMTP, create list, set from-address
- [ ] Verify `LISTMONK_LIST_ID` matches the created list and update Amplify if needed
- [ ] Send a test subscription via curl or the site form
