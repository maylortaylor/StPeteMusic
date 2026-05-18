# Newsletter Campaign — June–December 2026

Monthly newsletter to subscribers goes out on the **1st of each month**.
Each issue: 2 featured bands + 1 venue spotlight + events.

---

## Workflow (per month)

1. Go to `/dashboard/featured/` and select the month
2. Add the 2 featured artists → run enrichment → approve blurbs
3. Add the venue spotlight → write callout text → mark Approved
4. Go to `/dashboard/newsletter/compose` → confirm content → copy HTML
5. Paste into Listmonk → schedule for 1st of the month, 9am ET

---

## Campaign Calendar

### June 2026 — Website Launch Issue 🚀
**Featured Artists:** Beach Terror · Ajeva
**Venue Spotlight:** TBD — pick via admin
**Special:** First-ever issue. Announce the new website:
- Artist directory: fans can browse every St. Pete band we work with
- Event calendar: upcoming shows always up to date at stpetemusic.live
- Tone: excited but grounded. "We've been building something for you."

June system prompt note: pass `special_announcement` with:
```json
{
  "headline": "Our Website Is Live",
  "body": "Introduce the artist directory and event calendar. 2–3 warm sentences. Link to the site.",
  "cta_text": "Explore the site →",
  "cta_url": "https://www.stpetemusic.live"
}
```

---

### July 2026 — Summer Heat
**Featured Artists:** Liquid Pennies · Earth Girl
**Venue Spotlight:** TBD — pick via admin
**Tone:** Sun-soaked, energetic. St. Pete summer vibes. Lean into outdoor shows if any.

---

### August 2026 — Summer Send-Off
**Featured Artists:** Sauce Pocket · Minim
**Venue Spotlight:** TBD — pick via admin
**Tone:** Last summer hurrah. Bittersweet warmth. Great month to spotlight a neighborhood venue.

---

### September 2026 — Fall Season Opener
**Featured Artists:** TBD via admin
**Venue Spotlight:** TBD via admin
**Tone:** Fresh start. New season energy. Good month for highlighting a venue that does weeknight shows.

---

### October 2026
**Featured Artists:** TBD via admin
**Venue Spotlight:** TBD via admin
**Tone:** Spooky/Halloween angle if there are themed events. Otherwise: late-night energy, warehouse vibes.

---

### November 2026 — Community Appreciation
**Featured Artists:** TBD via admin
**Venue Spotlight:** TBD via admin
**Tone:** Gratitude. Shoutout the community. Lean into how far the scene has come this year.

---

### December 2026 — Year in Review
**Featured Artists:** TBD via admin
**Venue Spotlight:** TBD via admin
**Tone:** Warmth, reflection, looking ahead. Good time for a "best of 2026" mention. Holiday energy without being cheesy.

---

## Brand Voice Reminders

- **Warm but not fluffy.** Real community tone, not PR copy.
- **Enthusiastic, not hypey.** "This band is great" > "This band is INCREDIBLE!!!"
- **Short.** Newsletter readers scan. Each blurb is 100–150 words max.
- **Local pride.** Always mention St. Pete, the Warehouse Arts District, Suite E when relevant.
- Keywords to weave in naturally: community, local, live, St. Pete, arts, culture, connect.

---

## Venue Spotlight Format

3–4 sentences:
1. Who the venue is and what makes it special
2. The specific event happening there this month
3. Why readers should go / what they'll experience
4. Instagram or website link at the end

Example tone: "Mandarin Hide is one of those rooms that feels like a secret even when it's packed.
This month they're hosting [BAND] on the [DATE] — a perfect Saturday night in downtown St. Pete.
If you haven't been, this is your excuse. Follow them at @mandarinhide."

---

## Picking Featured Artists

- Aim for variety: don't feature the same genre back-to-back
- Mix established and emerging: one band people know, one to discover
- Check that they have enrichment data (Instagram active, some web presence)
- Prefer artists with upcoming shows that month if possible
