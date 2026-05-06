# CloudFront Cache Policy — Static Assets

## Why this matters

Amplify Gen 1 (WEB_COMPUTE / SSR mode) overrides `Cache-Control` headers set by
Next.js for files served from `public/`. The default Amplify CloudFront policy is
`max-age=5, stale-while-revalidate` — effectively no caching. This hurts Lighthouse
performance scores and wastes bandwidth on every page load.

Verified live: `curl -sI https://www.stpetemusic.live/images/hero/hero-1.webp | grep cache-control`
returns `max-age=5` even though `next.config.mjs` sets `max-age=31536000, immutable`.

**Goal:** `/images/*` → 1-year immutable cache · `/videos/*` → 1-day cache

---

## Option A — Amplify Custom Headers (recommended)

This is the Amplify-native way and survives redeployments.

1. Open [AWS Amplify Console](https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1)
2. Select **StPeteMusic** → app ID `d1fjwgk99cbqor`
3. Left sidebar → **Hosting** → **Custom headers**
4. Click **Edit** → paste the YAML below, then **Save**

```yaml
customHeaders:
  - pattern: '/images/**'
    headers:
      - key: 'Cache-Control'
        value: 'public, max-age=31536000, immutable'
  - pattern: '/videos/**'
    headers:
      - key: 'Cache-Control'
        value: 'public, max-age=86400'
```

5. Trigger a new build (push a commit or click **Redeploy this version**) — custom
   headers take effect after the next successful deploy, not immediately.

**Verify:**
```bash
curl -sI https://www.stpetemusic.live/images/hero/hero-1.webp | grep cache-control
# Expected: cache-control: public, max-age=31536000, immutable
```

---

## Option B — CloudFront Cache Behaviors (manual, requires console access)

Use this if Option A doesn't work (Amplify sometimes ignores custom headers for
WEB_COMPUTE mode on certain asset paths).

### Step 1 — Find the distribution

The CloudFront domain for the web app is `d35nc2e8nr92q9.cloudfront.net`.

1. Go to [CloudFront console](https://us-east-1.console.aws.amazon.com/cloudfront/home)
2. Find the distribution with origin domain `d35nc2e8nr92q9.cloudfront.net`
3. Note the **Distribution ID** (format: `EXXXXXXXXXXXXX`)

### Step 2 — Create a managed cache policy

AWS has a built-in **CachingOptimized** policy (`658327ea-f89d-4fab-a63d-7e88639e58f6`)
that sets a 1-year TTL and is the standard for static assets. Use it if available.

To create a custom policy with exact TTLs:
1. CloudFront → **Policies** → **Cache** → **Create cache policy**
2. Name: `StPeteMusic-StaticAssets-1Year`
3. TTL settings:
   - Minimum TTL: `0`
   - Maximum TTL: `31536000` (1 year)
   - Default TTL: `31536000`
4. Cache key: Headers → None · Query strings → None · Cookies → None
5. Click **Create**

### Step 3 — Add cache behaviors

In your distribution:
1. **Behaviors** tab → **Create behavior**

**Behavior 1 — Images:**
- Path pattern: `/images/*`
- Origin: the existing Amplify origin (S3 or Lambda)
- Cache policy: `StPeteMusic-StaticAssets-1Year` (or `CachingOptimized`)
- Viewer protocol policy: Redirect HTTP to HTTPS
- Allowed HTTP methods: GET, HEAD

**Behavior 2 — Videos:**
- Path pattern: `/videos/*`
- Cache policy: Create a `StPeteMusic-StaticAssets-1Day` policy with Default TTL `86400`
- Everything else same as above

### Step 4 — Invalidate existing cache

After saving behaviors, invalidate the stale cached responses:
1. **Invalidations** tab → **Create invalidation**
2. Paths:
```
/images/*
/videos/*
```

### Verify
```bash
curl -sI https://www.stpetemusic.live/images/hero/hero-1.webp | grep -i "cache-control\|x-cache"
# x-cache should show: Hit from cloudfront
# cache-control should show: public, max-age=31536000, immutable
```

---

## Gotcha: Amplify domain recreation resets distribution

From `.claude/infrastructure.md`:
> If domain association is deleted+recreated, a **new CloudFront distribution** is issued.

If that happens, Option B behaviors are lost and must be re-applied. Option A (custom
headers YAML) persists because it's stored in Amplify config, not the CF distribution.
**Prefer Option A for this reason.**

---

## Impact

Lighthouse `cache-insight` audit flagged 587 KiB wasted per visit on `/images/hero/hero-1.webp`
alone (5-second TTL = re-download on every visit). Fixing this should improve the
Lighthouse Performance score and significantly reduce bandwidth for repeat visitors.
