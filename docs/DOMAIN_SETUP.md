# Domain Setup — stpetemusic.live

How the custom domain is wired: **Cloudflare DNS → AWS Amplify → ACM SSL cert**

---

## Architecture

```
Browser
  → stpetemusic.live (Cloudflare DNS)
    → d3vawaunbp8pn9.cloudfront.net (Amplify CloudFront)
      → AWS Amplify app (stpetemusic-web)
        → Next.js SSR on WEB_COMPUTE
```

---

## AWS Amplify

- **App name:** `stpetemusic-web`
- **App ID:** `d1fjwgk99cbqor`
- **Default domain:** `d1fjwgk99cbqor.amplifyapp.com`
- **Production URL (default):** `https://main.d1fjwgk99cbqor.amplifyapp.com`
- **Staging URL (default):** `https://develop.d1fjwgk99cbqor.amplifyapp.com`
- **Custom domain:** `stpetemusic.live`
- **CloudFront target:** `d3vawaunbp8pn9.cloudfront.net`
- **SSL:** Amplify managed certificate (via ACM)

### IAM role required for custom domain

Amplify needs this role to manage the SSL cert:

- **Role name:** `AWSAmplifyDomainRole-Z05908243VGNRQT241IZB`
- **ARN:** `arn:aws:iam::767350869653:role/AWSAmplifyDomainRole-Z05908243VGNRQT241IZB`

If you ever recreate the Amplify app, this role must exist before adding the custom domain.

---

## Cloudflare DNS Records

All records for `stpetemusic.live`. Managed at **dash.cloudflare.com**.

> **Important:** During initial SSL cert validation, all records must be **grey cloud (DNS only / proxy OFF)**.
> After cert validates and domain is active, you can re-enable orange cloud proxy on `www` and `@`.

### Required records

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| CNAME | `www` | `d3vawaunbp8pn9.cloudfront.net` | DNS only (grey) |
| CNAME | `@` | `d3vawaunbp8pn9.cloudfront.net` | DNS only (grey) |
| CNAME | `_ddf1b33c5eab2d60eddc95848a12d240` | `_bf19e363018afabe1b2e49737993dac9.jkddzztszm.acm-validations.aws` | DNS only (grey — always) |

> The `_ddf1b33c...` record is the ACM SSL verification record. It must stay **forever** (Amplify uses it to renew the cert automatically). Never delete it.

---

## Setup Steps (for reference / if you ever redo this)

### 1. Create the IAM service role
Amplify needs this before it can manage SSL certs for a custom domain.

In IAM console → Roles → Create role:
- Trusted entity: **AWS service → Amplify**
- Role name: `AWSAmplifyDomainRole-<app-id-suffix>`
- Policy: `AdministratorAccess-Amplify`

### 2. Add the domain in Amplify console
Amplify console → `stpetemusic-web` → Hosting → Custom domains → Add domain → `stpetemusic.live`

Configure subdomains:
- `www` → branch `main`
- `@` (apex) → branch `main`

SSL certificate: **Amplify managed certificate**

### 3. Add DNS records in Cloudflare
After Amplify shows the DNS records table, add all three records (see table above).
Set all to **DNS only (grey cloud)** during validation.

### 4. Wait for SSL validation
ACM cert validation via DNS typically takes **5–30 minutes** after the verification CNAME propagates.

Amplify domain status progression:
1. SSL creation
2. **SSL configuration** ← where it waits for the CNAME
3. Domain activation
4. ✅ Active

### 5. Re-enable Cloudflare proxy (optional)
Once domain status is **Active**, you can set `www` and `@` back to orange cloud.
Leave the `_ddf1b33c...` verification record as DNS only forever.

---

## Troubleshooting

**"CNAME verification record not found"**
→ Add the `_ddf1b33c...` CNAME to Cloudflare. Make sure proxy is OFF.

**"Cannot find role AWSAmplifyDomainRole-..."**
→ Create the IAM role manually (see Step 1 above).

**SSL stuck at "SSL configuration" for 30+ min**
→ Check that the `_ddf1b33c...` CNAME exists in Cloudflare with proxy OFF.
→ Check that `www` and `@` CNAMEs are also proxy OFF.
→ Click "Make SSL changes and try again" in Amplify after confirming DNS is correct.

**Site loads on `www` but not apex (`stpetemusic.live`)**
→ Cloudflare CNAME flattening should handle apex automatically. Verify the `@` record exists.

**CloudFront target changed**
→ If you ever delete and recreate the Amplify app, the CloudFront URL (`d3vawaunbp8pn9...`) will change.
→ Update all CNAME values in Cloudflare to the new target shown in Amplify's DNS records table.
