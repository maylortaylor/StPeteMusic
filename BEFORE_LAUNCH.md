# Before Launch Checklist

## ✅ Done

- [x] Security headers — X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy
- [x] CSP headers — script/style/img/connect/frame directives for GTM + YouTube
- [x] Image optimization — JPGs compressed, `.webp` siblings generated
- [x] Hero poster + `sizes` — mobile LCP (5.8s → expected < 2.5s after deploy)
- [x] Browserslist — modern browser targets eliminate legacy JS polyfills
- [x] Color contrast — Footer `/50,/60` → `/70`, `--text-muted` `#888` → `#767676`
- [x] Color contrast — Newsletter + Contact `text-white/40` bumped on black bg
- [x] Privacy Policy page (`/privacy`) + cookie banner
- [x] GTM container published — 15 tags, 15 triggers, 19 dataLayer vars
- [x] GA4 property confirmed — `G-RZJP9NFXX4` / property `535560580`
- [x] GA4 key events marked — newsletter, contact, ticket, cta, event click
- [x] Sitemap (`/sitemap.xml`) — static routes + dynamic artist/venue slugs
- [x] robots.ts — allows `/`, disallows `/api/`
- [x] 404 page — on-brand with nav + footer
- [x] Error page — standalone 500 boundary (error.tsx)
- [x] GCP consolidated — 3 projects under `theburgmusic-org`, managed by tofu
- [x] n8n OAuth — migrated to `spm-n8n-workflows`, old projects deleted

---

## 🔴 Blocking — do before merging to main

- [ ] **E2E: newsletter signup** — submit a real email on https://www.stpetemusic.live, confirm subscriber appears in Listmonk
- [ ] **E2E: contact form** — submit the contact form, confirm Resend delivers the email
- [ ] **GTM Preview + GA4 Realtime** — open GTM Preview on the live site, click around, confirm `page_view` + `cta_click` appear in GA4 Realtime within 30s
- [ ] **Run `ga4:conversions`** — `npm run ga4:conversions --workspace=apps/web`
- [ ] **Commit + push** this session's changes (see below)
- [ ] **PR `develop` → `main`** — 1 review required

---

## 🟡 Launch Day — do right after `main` deploy goes live

- [ ] **Google Search Console** — see `docs/search-console-setup.md`
  - Add domain property for `stpetemusic.live`
  - Add TXT record to Cloudflare (`tofu apply` or manual in CF dashboard)
  - Verify → Submit sitemap → Request indexing for `/`, `/events`, `/discover`, `/venues`
  - Link GA4 property `535560580`
- [ ] **Bing Webmaster** — import from Google Search Console (2 min)
- [ ] **Extend GA4 data retention** — Analytics Admin → Data Retention → 14 months (default is 2 months)
- [ ] **Announce** — Instagram / social post

---

## 🟢 Post-Launch (first week)

- [ ] **Re-run Lighthouse on production** — confirm mobile LCP < 2.5s after deploy
- [ ] **Check Amplify build logs** — no SSR errors, build completes cleanly
- [ ] **GA4 Realtime** — confirm real traffic is flowing day 1
- [ ] **Search Console coverage** — check for any crawl errors after 2-3 days
- [ ] **CSP Report-Only upgrade** — add `Content-Security-Policy-Report-Only` once you've confirmed no violations in console
- [ ] **Add `error.tsx` to admin app** if needed

---

## Commit what's staged this session

```bash
# Gitignore lighthouse report files first
echo "lighthouse-*.json" >> .gitignore

# Stage everything
git add \
  .gitignore \
  BEFORE_LAUNCH.md \
  GOOGLE_CLEANUP.md \
  apps/admin/.env.local.example \
  apps/web/.env.local.example \
  apps/web/next.config.mjs \
  apps/web/public/images/ \
  apps/web/src/app/error.tsx \
  apps/web/src/app/globals.css \
  apps/web/src/components/ContactSection.tsx \
  apps/web/src/components/Footer.tsx \
  apps/web/src/components/Hero.tsx \
  apps/web/src/components/NewsletterSignup.tsx \
  apps/web/src/config/focal-points.json \
  docs/ \
  images/ \
  infrastructure/.terraform.lock.hcl \
  package.json

git commit -m "feat(pre-launch): CSP headers, a11y, LCP fix, error page, GCP migration"
git push origin develop
```
