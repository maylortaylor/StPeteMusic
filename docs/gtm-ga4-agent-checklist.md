# GTM + GA4 Pre-Launch Verification Checklist

> **How to use:** Paste this document into a new Claude session that has web browsing access.
> The agent will work through each item, navigate to the relevant console, and report
> ✅ confirmed or ❌ needs action with the direct console URL to fix it.

---

## Context

- **GTM Container:** GTM-WW7MSP3L
- **Site:** www.stpetemusic.live
- **Google Account:** TheBurgMusic@gmail.com
- **Custom events tracked in code:**
  - `newsletter_signup` — fired when user subscribes to the newsletter
  - `contact_form_submit` — fired when contact form is submitted
  - `outbound_link_click` — fired on all external link clicks (params: `link_url`, `link_text`)
  - `cta_click` — fired on hero CTA buttons (params: `cta_label`, `cta_location`)

---

## Step 1 — Verify GTM Container is Published

Navigate to: https://tagmanager.google.com

1. Log in as TheBurgMusic@gmail.com
2. Find container **GTM-WW7MSP3L**
3. Confirm the container has a **Published** version (not only Draft or Preview)
   - Look for a version number in the top area (e.g. "Version 3 - Published")
   - ✅ Published = a version exists with "Published" status
   - ❌ Not published = all work is in draft; tags won't fire on production

**Fix if not published:** Click "Submit" → add a version name → click "Publish"

---

## Step 2 — Verify GA4 Configuration Tag Exists

Still in GTM-WW7MSP3L, go to **Tags** in the left sidebar.

4. Look for a tag of type **Google Tag** (or "GA4 Configuration")
   - Tag name should be something like "GA4 - Configuration" or "Google Tag - GA4"
5. Open the tag and confirm:
   - **Tag ID** is a valid GA4 Measurement ID (format: `G-XXXXXXXXXX`)
   - **Trigger:** fires on **All Pages** (or a page view trigger)
   - ✅ Tag exists + fires on All Pages = good
   - ❌ Missing = create it (see fix below)

**Fix if missing:**
- Tags → New → Tag type: "Google Tag"
- Tag ID: (enter the GA4 Measurement ID from Step 5)
- Trigger: All Pages
- Save → Submit → Publish

---

## Step 3 — Verify GA4 Event Tags Exist

In GTM Tags list, look for event tags for each of these:

| Expected tag | Event name | Required parameters |
|---|---|---|
| GA4 - newsletter_signup | `newsletter_signup` | none required |
| GA4 - contact_form_submit | `contact_form_submit` | none required |
| GA4 - outbound_link_click | `outbound_link_click` | `link_url`, `link_text` |
| GA4 - cta_click | `cta_click` | `cta_label`, `cta_location` |

6. For each row: confirm the tag exists, uses the correct event name, and fires on the
   correct GTM trigger (a Custom Event trigger matching the dataLayer event name)
   - ✅ All 4 event tags exist with correct names and triggers
   - ❌ Missing tags = create them (type: GA4 Event, event name from the table, trigger: Custom Event)

**Note:** The site's code pushes these events to `window.dataLayer` — GTM just needs to
listen for them and forward to GA4. The dataLayer push is already in the Next.js code.

---

## Step 4 — Verify GA4 Property Exists

Navigate to: https://analytics.google.com

7. Log in as TheBurgMusic@gmail.com
8. Check if there is a property for **stpetemusic.live**
   - ✅ Property exists = proceed to Step 5
   - ❌ No property = create one (see fix below)

**Fix if missing:**
- Admin (gear icon) → Create → Property
- Property name: "StPeteMusic.live"
- Reporting time zone: America/New_York
- Currency: US Dollar
- Click Next → Business info → save → Continue to setup

---

## Step 5 — Verify Web Data Stream

In GA4 Admin for the stpetemusic.live property:

9. Admin → Data collection and modification → **Data Streams**
10. Look for a Web stream with URL matching `https://www.stpetemusic.live`
11. Open the stream and copy the **Measurement ID** (format: `G-XXXXXXXXXX`)
    - ✅ Stream exists with correct URL
    - ❌ Missing = Add stream → Web → enter https://www.stpetemusic.live

12. **Cross-check:** Go back to GTM → the GA4 Configuration tag's Tag ID must match this
    Measurement ID exactly
    - ✅ IDs match = tracking is correctly wired
    - ❌ IDs don't match = update GTM tag ID → re-publish container

---

## Step 6 — Verify Realtime Data Flow

13. Open a new browser tab and navigate to: **https://www.stpetemusic.live**
14. In GA4: Reports → **Realtime**
15. Within 30 seconds, confirm:
    - At least 1 active user appears (you)
    - A `page_view` event appears in the events list
    - ✅ Data flows = GTM + GA4 are correctly connected
    - ❌ No data = check for browser extensions blocking GA, check GTM tag firing,
      check that the container is published

**Test a custom event (optional but recommended):**
- On stpetemusic.live, click the newsletter signup, enter a fake email, submit
- In GA4 Realtime, confirm `newsletter_signup` event appears within 30 seconds

---

## Step 7 — Mark Conversion Events

In GA4: Admin → **Events** (under Data display)

16. Find `newsletter_signup` → toggle **Mark as conversion** ON
    - ✅ Conversion enabled
    - ❌ Event not listed = wait until Step 6 test fires it, then it will appear

17. Find `contact_form_submit` → toggle **Mark as conversion** ON

---

## Step 8 — Link Google Search Console (do after domain is verified in Search Console)

In GA4: Admin → **Search Console links**

18. Click Link → select the stpetemusic.live Search Console property
    - ✅ Linked = organic search keywords will appear in GA4 Acquisition reports
    - ❌ Search Console not set up yet = skip; come back after running `tofu apply`
      to add the DNS verification TXT record

---

## Summary Checklist

| # | Item | Status |
|---|------|--------|
| 1 | GTM container published | |
| 2 | GA4 Configuration tag exists, fires on All Pages | |
| 3 | All 4 custom event tags exist | |
| 4 | GA4 property exists for stpetemusic.live | |
| 5 | Web data stream URL matches www.stpetemusic.live | |
| 6 | GTM Measurement ID matches GA4 stream ID | |
| 7 | Realtime data flows (page_view appears) | |
| 8 | newsletter_signup and contact_form_submit marked as conversions | |
| 9 | Search Console linked (post-launch) | |

---

## Scripts available if console work is too slow

From `apps/web/`:
```bash
# Back up current GTM config
npm run gtm:backup

# Apply gtm-config.json to the live container
npm run gtm:apply

# Mark GA4 conversion events via API
npm run ga4:conversions

# Check/create GA4 property and data stream
npm run ga4:setup
```
