# Skill: grow_social — @social_manager

## Objective

Grow @StPeteMusic's presence across all platforms through data-driven strategy, content scheduling, and community engagement. Social growth is paramount — every recommendation serves the goal of building real community, not just follower counts.

---

## Rules of Engagement

- **Never post or schedule without explicit user approval** — always output a proposal/strategy first
- **Always cite your data source** for any analytics claim (GA4, `post_stats` table, `account_snapshots` table, Listmonk API)
- **Always align recommendations with brand voice** in `.agents/context/brand-voice.md`
- Strategies must include approval steps — no "just post this" recommendations
- Prioritize authentic community engagement over vanity metrics

---

## Data Sources Available

| Source | What It Contains | How to Access |
|--------|-----------------|---------------|
| `post_stats` DB table | Per-post likes, comments, shares, views, saves by platform | Query via Drizzle in admin API |
| `account_snapshots` DB table | Follower count snapshots over time (IG, FB, YT) | Query via Drizzle in admin API |
| `ig_mentions` DB table | Instagram mentions of @StPeteMusic by other accounts | Query via Drizzle in admin API |
| GA4 weekly report | Traffic sources, event counts, conversion data | Run `apps/web/scripts/ga4-weekly-report.mjs` |
| Listmonk | Newsletter open rates, click rates, subscriber count | `GET https://admin.stpetemusic.live/api/listmonk/campaigns` |

---

## Instructions

### Weekly Social Review (`/social-review`)

1. **Gather current data:**
   - Run GA4 weekly report (or read most recent output from `apps/web/`)
   - Check `account_snapshots` for follower trend (last 4 weeks)
   - Check `post_stats` for top 5 performing posts this month

2. **Analyze:**
   - What content types performed best? (Video vs image vs carousel)
   - What posting days/times had highest engagement?
   - Which events/bands drove the most traffic to website?
   - Newsletter open rate trend

3. **Generate strategy summary:**

```markdown
# Social Strategy: Week of [YYYY-MM-DD]

## Key Metrics
- IG followers: [X] ([+/-Y] vs last week)
- FB followers: [X] ([+/-Y] vs last week)
- YT subscribers: [X] ([+/-Y] vs last week)
- Newsletter subscribers: [X] | Last campaign open rate: [Y]%

## Top Performing Content (This Month)
[Table of top 3 posts by engagement with platform, type, engagement count]

## Insights
[2-3 bullet observations about what's working and what's not]

## Recommended Actions This Week
[Numbered list of specific, actionable steps — each with platform, content type, and why]

## Content Calendar Proposal (Next 7 Days)
[Table: Day | Platform | Content Type | Topic | Status]

## Approval Required
[ ] Confirm the content calendar
[ ] Approve any new posting strategy changes
```

4. **Save to** `production_artifacts/social-strategy/week-[YYYY-MM-DD].md`

5. **Present to user for review** before any action is taken.

---

### Growth Strategy Principles

**Content pillars for @StPeteMusic:**
1. **Live performance videos** (YouTube → IG Reels → FB) — highest engagement driver
2. **Event promotion** (IG/FB posts) — drives EventBrite traffic
3. **Artist spotlights** (IG Stories/Reels) — community building
4. **Behind-the-scenes** (IG Stories) — authenticity + connection
5. **Newsletter** — deepest relationship, highest intent audience

**Posting frequency targets:**
- Instagram: 3–4 posts/week + Stories 5x/week
- Facebook: 3–4 posts/week
- YouTube: 1–2 videos/week

**Engagement tactics:**
- Always reply to comments within 24 hours
- Re-share band content when they tag @StPeteMusic
- Use `ig_mentions` data to identify bands who mention us — thank them / repost
- EventBrite attendance tracking → identify returning fans → engage directly

**Growth levers:**
- YouTube performance videos → Shorts repurposing
- Cross-tagging with Suite E Studios on every post
- Consistent Final Friday + Instant Noodles content builds recurring audience expectation
