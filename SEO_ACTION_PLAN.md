# St. Pete Music SEO Improvement Plan

## Phase 1: Technical SEO (Already Implemented in Codebase ✅)

✅ **Sitemap**: Auto-generated at `https://www.stpetemusic.live/sitemap.xml` (dynamic + static routes)
✅ **Robots.txt**: Set at `https://www.stpetemusic.live/robots.txt` (allows crawling, protects /api/)
✅ **Twitter/X cards**: Added to all pages (summary_large_image cards on social shares)
✅ **H1 on homepage**: Added hidden h1 for search engine crawlers
✅ **Dynamic event dates**: Fixed hardcoded JSON-LD dates to calculate next event automatically

**To verify these work:**
- Visit `https://www.stpetemusic.live/sitemap.xml` — should list all pages
- Visit `https://www.stpetemusic.live/robots.txt` — should show crawl policy
- Share a page on Twitter/X and preview the card at https://cards-dev.twitter.com/validator
- Use Google Search Console to submit the sitemap: https://search.google.com/search-console

---

## Phase 2: Off-Site Actions (YOU MUST DO THESE — No Code Changes)

### 2.1 — Google Business Profile ⭐ #1 Priority

This is THE most direct way to answer "I want people searching St Pete Music to find my website."

**Steps:**
1. Go to https://business.google.com
2. Sign in with your Google account (ideally `TheBurgMusic@gmail.com`)
3. Search for "St Pete Music" — you may see an existing listing to claim, or create new
4. Fill out:
   - **Business name:** `St Pete Music` (exact match — how people search)
   - **Categories:** Music Venue (primary), Event Promoter (secondary)
   - **Address:** 615 27th St S STE E, St. Petersburg, FL 33712 (Suite E Studios)
   - **Phone:** [Your phone number]
   - **Website:** `https://www.stpetemusic.live`
   - **Hours:** (optional — set if you want to show event times)
5. **Add photos:**
   - Logo
   - Final Friday crowd shots
   - Suite E Studios interior/exterior
6. **Verification:** Google will send a postcard to the address (arrives ~1 week). Follow the verification code to activate.

**After Verification — Post Updates:**
- Every Final Friday: Use **Google Posts** feature to add event details. These appear directly in search results and Maps.
- Example: "Final Friday — 3 bands, 7pm doors, 8pm–midnight. Doors at Suite E Studios."

---

### 2.2 — Local Business Citations (Consistency is Key)

Google cross-references your **NAP** (Name, Address, Phone) across the web. Mismatches hurt ranking.

**Use exactly this everywhere:**
- **Business name:** `St Pete Music`
- **Address:** `615 27th St S STE E, St. Petersburg, FL 33712`
- **Phone:** [Your number]
- **Website:** `https://www.stpetemusic.live`

**Add your business to these directories:**

| Directory | URL | Notes |
|-----------|-----|-------|
| **Yelp** | https://biz.yelp.com | Click "Add your business" |
| **Apple Maps** | https://mapsconnect.apple.com | Category: Music Venue |
| **Bing Places** | https://www.bingplaces.com | Similar to Google My Business |
| **TripAdvisor** | https://www.tripadvisor.com/GetListedNew | For venue reviews |
| **St. Pete Chamber of Commerce** | https://www.stpete.org | Add as member/listing |

**Social platforms — add website link to profile:**
- **Instagram:** Bio → Link to `https://www.stpetemusic.live` (consider swapping from linktr.ee or dual-listing)
- **Facebook:** About section → Website field → `https://www.stpetemusic.live`
- **YouTube:** About → Links → add website
- **Eventbrite:** Organizer profile → Website field (ensure it's set)

---

### 2.3 — Backlinks from Event Platforms

Every event you list gives you a backlink. These platforms already exist in your workflow:

| Platform | Action | Why It Helps |
|----------|--------|--------------|
| **Eventbrite** | Already active — ensure org profile links to stpetemusic.live | Backlink authority |
| **Bandsintown** | Add Final Friday as recurring event + artist links | Music-specific backlink |
| **Songkick** | Add Final Friday recurring event | Music event backlink |
| **Local news/arts guides** | Pitch Final Friday to local bloggers/journalists | Editorial backlinks = strong SEO signal |

---

### 2.4 — Gather Google Reviews (Post-GBP Verification)

Once your Google Business Profile is verified, you'll get a unique review link.

**How to drive reviews:**
1. Print QR code linking to your review page (or use URL shortener)
2. Display at Final Friday events: "Leave us a review — tell people about your experience"
3. Share on Instagram Stories / Facebook with link
4. Email your newsletter: "Help us rank locally — leave a 30-second review on Google"

**Target:** 10–20 reviews in first month. Each review boosts local pack ranking + helps people trust your brand.

---

## Phase 3: Content Strategy (Medium/Long Term)

Your `/discover` and `/venues` pages are already search-optimized:
- Each artist slug (`/discover/[slug]`) = custom landing page (currently auto-indexed)
- Each venue slug (`/venues/[slug]`) = custom landing page (currently auto-indexed)

**Growth opportunities:**
1. **Expand artist/venue database** — more entries = more indexed pages targeting local searches
2. **Blog posts** (optional but valuable):
   - "Best Live Music Venues in St. Petersburg FL"
   - "Final Friday St Pete — Local Music Event Guide"
   - "Local Bands to Check Out in Tampa Bay 2026"
   - Artist spotlights (cross-link from `/discover/[slug]`)
3. **Keep Final Friday + Instant Noodles active in Eventbrite** — recurring events get indexed and rank for "live music st pete" searches

---

## Verification Checklist

### Before you go live with changes:
- [ ] Push new code (sitemap.ts, robots.ts, Twitter cards, h1, event dates) to production
- [ ] Wait ~24h for Amplify to deploy
- [ ] Test sitemap: https://www.stpetemusic.live/sitemap.xml (should show 10+ URLs)
- [ ] Test robots.txt: https://www.stpetemusic.live/robots.txt (should allow /)
- [ ] Test Twitter cards: https://cards-dev.twitter.com/validator (paste any page URL)

### Google Search Console:
1. Add property: https://search.google.com/search-console
2. Submit sitemap: Sitemaps → Add new → `https://www.stpetemusic.live/sitemap.xml`
3. Monitor coverage over 1–2 weeks (should see all your dynamic routes indexed)

### On-page SEO testing:
- Use https://search.google.com/test/rich-results to verify JSON-LD is valid
- Use https://www.seobility.net/en/seocheck/ for a free full audit

---

## FAQ

### "When will I rank for 'St Pete Music'?"
- **GBP (Google Business Profile)**: Typically 1–3 weeks after verification
- **Organic search**: 6–12 weeks to start ranking (depends on backlinks + content)
- **Local pack**: Weeks to 2 months once GBP is verified + you have 5+ reviews

### "Do I need a blog?"
Not immediately. Your `/discover` and `/venues` pages are already SEO-strong. A blog helps long-term, but GBP + citations are higher ROI first.

### "Should I update event dates manually if the function doesn't work?"
No. The function auto-calculates the last Friday/Wednesday of the month. It should never go stale. If it breaks, raise an issue in the repo.

### "What if someone searches 'Final Friday Tampa Bay'?"
Your site should rank because:
1. Google Business Profile mentions Final Friday
2. Eventbrite page is active and indexed
3. Your `/events` page has JSON-LD schema mentioning Final Friday

### "How do I know citations are working?"
Use https://www.whitespark.ca/local-citation-checker/ (free tier) to scan if your NAP appears in major directories.

---

## Next Steps (Ranked by impact)

1. **TODAY:** Push code changes to production + verify sitemap/robots.txt work
2. **THIS WEEK:** Create Google Business Profile + wait for postcard (submit code when arrives)
3. **NEXT WEEK:** Add your business to Yelp, Apple Maps, Bing Places, TripAdvisor
4. **ONGOING:** Gather reviews after GBP verification, post Google Updates for Final Friday events
5. **LATER (Nice-to-have):** Expand artist/venue database, blog posts for long-tail SEO

---

## Questions?

- Sitemap not updating? → Check `apps/web/src/app/sitemap.ts`
- Twitter cards not showing? → Test at https://cards-dev.twitter.com/validator
- Google Business Profile slow to rank? → Patience + reviews + keep it updated
- Event dates going stale? → The code auto-calculates; no manual updates needed

Good luck! 🚀
