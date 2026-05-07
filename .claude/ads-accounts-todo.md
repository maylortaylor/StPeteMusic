---
topic: ads-accounts
triggers: microsoft ads, google ads, bing ads, paid ads, ppc, advertising accounts
updated: 2026-05-07
---

# Paid Ads Accounts — TODO

Not yet set up. Create these accounts and wire into the existing IaC + GTM setup.

## Microsoft Advertising (Bing Ads)
- Create account at https://ads.microsoft.com
- Link to Bing Webmaster Tools (same Microsoft account)
- Add UET (Universal Event Tracking) tag via GTM (tag type: Microsoft Advertising UET)
- Add conversion goals: newsletter signup, contact form submit
- The Bing Webmaster verification TXT record IaC is already scaffolded in `infrastructure/cloudflare.tf` (just needs the verification code from Bing Webmaster Tools)

## Google Ads
- Create account at https://ads.google.com
- Link to GA4 property (Settings → Linked accounts → Google Analytics)
- Enable auto-tagging (GCLID)
- Import GA4 conversion events: `newsletter_signup`, `contact_form_submit` as Google Ads conversions
- No new GTM tags needed if GA4 link is active — conversions import automatically

## Notes
- Clarity is live (project ID: wnh6925i77) — Microsoft Ads remarketing can use the same Clarity session data once account is created
- Meta Pixel is live (ID: 1015368770610756) — already tracking ViewContent, Lead, Contact
- GTM container: GTM-WW7MSP3L
