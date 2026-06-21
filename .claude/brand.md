---
topic: brand
triggers: brand, team, @stpetemusic, suite e, tangent, social, links, owners, google account, ig, fb, instagram, facebook, youtube, eventbrite
updated: 2026-06-21
---

# Brand Context

## Primary Brands
- **@StPeteMusic** — music promoter for booking, marketing, and managing live shows
- **Suite E Studios** — partner venue in the Historic Warehouse Arts District, St. Pete FL (~1700 sqft warehouse)
- **Tangent LLC** — parent company (use only in legal/formal contexts)

## Team
- **Owners (Suite E):** Matt Taylor & Austen Van Der Bleek
- **Support:** Rob Morey & Alex MacDonald
- **@StPeteMusic:** Managed by Matt Taylor

## Social Platforms
| Platform | URL |
|----------|-----|
| Main Website | https://linktr.ee/stpetemusic |
| Instagram | https://www.instagram.com/StPeteMusic |
| Facebook | https://www.facebook.com/StPeteFLMusic |
| YouTube | https://youtube.com/@StPeteMusic |
| EventBrite (Suite E Studios) | https://www.eventbrite.com/o/suite-e-studios-109188388681 |
| EventBrite (#FinalFriday) | https://final-friday.eventbrite.com/ |
| Suite E Studios | https://linktr.ee/suite_e_studios |

## OG / Social Share Images

All social preview images (shown when a stpetemusic.live link is shared on Facebook, Twitter/X, Discord, etc.) are managed from one folder:

- **Source folder:** `apps/web/social-images/` — 7 PNG files, one per page (`homepage-header.png`, `about-header.png`, etc.)
- **Required size:** 1200×630 px PNG
- **Process:** Replace a file in that folder → PR → merge to `main` → GitHub Action auto-uploads to CDN with a content hash, busts all platform caches, and triggers a Facebook re-scrape
- **CDN path:** `https://cdn.stpetemusic.live/social/{name}-{hash8}.png`
- **Config:** `apps/web/src/config/social-images.ts` (auto-generated — do not edit manually)
- **Full docs:** `apps/web/social-images/README.md`

## Google Account
- **Primary Gmail:** TheBurgMusic@gmail.com (manages all @StPeteMusic accounts and integrations)
- **Content Database:** Google Sheets (`IG_PastPosts` tab: archive · `PostSchedule` tab: future posts queue)
