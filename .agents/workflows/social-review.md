# Workflow: social-review

**Slash command:** `/social-review`

## Purpose

Weekly social media health check — pull data from all sources, identify what's working, and propose a content + engagement strategy for the coming week.

---

## Agent Chain

```
User: /social-review
  │
  ▼
@social_manager (grow_social.md)
  - Runs GA4 weekly report (apps/web/scripts/ga4-weekly-report.mjs)
  - Reads account_snapshots (follower trends)
  - Reads post_stats (engagement by post)
  - Checks ig_mentions (who's talking about @StPeteMusic)
  - Pulls Listmonk newsletter stats
  - Generates weekly strategy summary
  - Saves to production_artifacts/social-strategy/week-YYYY-MM-DD.md
  - PRESENTS to user for review
  │
  ▼ (after user feedback)
User approves actions → @social_manager passes specific content requests to @content_writer
  │
  ▼
@content_writer generates approved pieces → /content-cycle continues
```

---

## Output

Saved to `production_artifacts/social-strategy/week-[YYYY-MM-DD].md`:

- Key metrics vs prior week
- Top performing content
- Insights + what to do differently
- Content calendar proposal (7 days)
- Recommended engagement actions

---

## Approval Gate

`@social_manager` presents the full strategy summary and waits for:
- "Approved — execute content calendar" → triggers `/content-cycle` for each piece
- "Adjust [X]" → revises and re-presents
- "No action this week" → saves summary for records only

---

## How to Invoke

```
/social-review
/social-review week of May 26
```
