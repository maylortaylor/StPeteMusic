# Content Management Platform — Usage Guide

Everything added in `feature/content-management-platform`. This doc covers what you can do, where to find it, and how the pieces fit together.

---

## What Was Built

Two complementary layers:

1. **Agent files** (`.agents/`) — portable markdown role + skill definitions that any AI IDE can use
2. **Admin app features** — database tables + UI pages for content calendar and brand voice management

---

## Layer 1: AI Agent System

### Slash Commands

Run these from Claude Code inside the `StPeteMusic/` directory.

#### `/content-cycle <event-or-topic>`

Generates a multi-platform content bundle for an event or topic.

```
/content-cycle Final Friday May 30
/content-cycle Beach Terror at Suite E Studios
/content-cycle Second Saturday Art Walk June
```

What it does:
1. `@content_writer` loads `.agents/context/brand-voice.md` + `.agents/context/event-types.md`
2. Generates a YouTube title (≤100 chars), IG/FB caption (~300 chars, 3-section structure), and newsletter snippet
3. Saves the bundle to `production_artifacts/content/YYYY-MM-DD-<topic>.md`
4. **Pauses for your approval** before queuing anything
5. After approval, `@workflow_builder` pushes the post to the `social_posts` table as a draft

Output format matches what n8n expects — so approved drafts can be published directly from the Content Calendar.

---

#### `/social-review`

Weekly social media strategy session.

```
/social-review
```

What it does:
1. `@social_manager` pulls GA4 weekly data (top events, traffic sources)
2. Reads `post_stats` and `account_snapshots` from the database
3. Produces a strategy summary: what's working, hashtag performance, recommended posting calendar
4. Saves the report to `production_artifacts/social-strategy/week-YYYY-MM-DD.md`
5. **Pauses for your review** — approve to commit the strategy as a reference doc

---

#### `/feature-cycle <idea>`

Builds a new app feature end-to-end.

```
/feature-cycle add artist spotlight carousel to homepage
/feature-cycle newsletter unsubscribe page
```

What it does:
1. `@orchestrator` writes a spec to `production_artifacts/specs/`
2. **Pauses for your approval** of the spec before writing any code
3. After approval, `@frontend` builds the feature
4. `@qa` runs tests and checks ≥75% coverage
5. `@infra` handles any infrastructure changes if needed

---

### Agent Context Files

These are the shared knowledge files all agents load:

| File | What it contains |
|------|-----------------|
| `.agents/context/brand-voice.md` | Brand identity, tone, all social handles, platform formatting rules, post scheduling rules, hashtag defaults, JSON output format for n8n, evolving voice log |
| `.agents/context/event-types.md` | Final Friday, Instant Noodles, Second Saturday templates with exact hashtags and post structures |

**To update the brand voice:** Either edit `.agents/context/brand-voice.md` directly (affects agent behavior immediately) or use the Brand Voice page in the admin app (affects n8n workflows at runtime).

---

### Agent Skills Reference

| Agent | What it does | Skill file |
|-------|-------------|------------|
| `@orchestrator` | Writes feature specs, manages approval gates | `.agents/skills/write_specs.md` |
| `@frontend` | Builds Next.js features in web + admin apps | `.agents/skills/build_feature.md` |
| `@infra` | OpenTofu plan/apply, Amplify env vars, DNS | `.agents/skills/manage_infra.md` |
| `@workflow_builder` | Creates/modifies n8n workflow JSON | `.agents/skills/build_workflow.md` |
| `@content_writer` | Generates multi-platform content bundles | `.agents/skills/write_content.md` |
| `@social_manager` | GA4 + social analytics, weekly strategy | `.agents/skills/grow_social.md` |
| `@qa` | Tests, coverage checks, migration safety | `.agents/skills/run_tests.md` |

---

### Production Artifacts

Generated content lands in `production_artifacts/` (gitignored — local only):

```
production_artifacts/
├── content/          # /content-cycle outputs
├── social-strategy/  # /social-review weekly reports
└── specs/            # /feature-cycle specs
```

These files are local only — they're your working drafts. Once a content bundle is approved, it's pushed to the DB as a social post draft for final review in the admin app.

---

## Layer 2: Admin App Pages

### Content Calendar

**URL:** `admin.stpetemusic.live/dashboard/content-calendar`

The social media command center. Shows all post drafts from AI agents AND manually created posts.

**Workflow:**
1. AI generates a content bundle via `/content-cycle` → appears as a `draft` post
2. You review it in the Content Calendar
3. Click **Approve** → status moves to `approved`
4. n8n picks up approved posts and publishes them on schedule

**What you can do:**
- Filter by platform (Instagram, Facebook, YouTube, Newsletter) or status
- Expand any post to read the full caption
- Approve posts that are in `draft` or `pending_approval` status
- Archive posts you don't want (soft delete — they go to `archived`, not deleted)
- Create a new draft manually with the **New Draft** button

**Post statuses:**

| Status | Meaning |
|--------|---------|
| `draft` | Just created — not yet reviewed |
| `pending_approval` | AI-generated and flagged for human review |
| `approved` | You've approved it — ready for n8n to schedule |
| `scheduled` | n8n has picked it up and queued it |
| `published` | Live on the platform |
| `failed` | Publishing attempt failed — needs attention |
| `archived` | Removed from queue |

---

### Brand Voice

**URL:** `admin.stpetemusic.live/dashboard/brand-voice`

Manage the system prompt used by AI agents for all content generation.

**Two sources of truth:**
- `.agents/context/brand-voice.md` — static file used by Claude Code agents in this repo
- The **active version in the database** — fetched by n8n workflows at runtime

Keep these in sync when making major voice changes.

**What you can do:**
- View all brand voice versions with their full system prompts
- **Edit** any version inline (name, system prompt, tone descriptors, hashtag library)
- **Set Active** to switch which version n8n workflows use
- **New Version** to create a variant (Hype Mode, Educational, etc.) without losing the current one

**Recommended workflow for voice changes:**
1. Create a new version in the admin (so you have a backup)
2. Edit and test the new version
3. Set it as active when you're happy with it
4. Update `.agents/context/brand-voice.md` to stay in sync

---

## Database Tables Added

### `social_posts`

Stores all content drafts, approvals, and publish history.

Key columns:
- `platform` — instagram, facebook, youtube, newsletter
- `status` — see status table above
- `caption` — the post text
- `hashtags TEXT[]` — stored as an array
- `scheduled_publish_at` — when n8n should publish
- `artist_id` — optional FK to artists table
- `approved_by` — Clerk user ID of the approver
- `platform_post_id` — returned by IG/YT API after publish

### `brand_guidelines`

Versioned brand voice storage.

Key columns:
- `version` — auto-incremented integer
- `system_prompt` — the full prompt text loaded by AI agents
- `tone_descriptors TEXT[]` — e.g., ["enthusiastic", "authentic", "community-first"]
- `hashtag_library TEXT[]` — default hashtags for this voice
- `is_active BOOLEAN` — only one version is active at a time

---

## API Endpoints

All routes require Clerk auth (401 if not signed in).

### Social Posts

| Method | URL | What it does |
|--------|-----|-------------|
| GET | `/api/social-posts` | List posts; supports `?platform=` and `?status=` filters |
| POST | `/api/social-posts` | Create a new draft |
| GET | `/api/social-posts/:id` | Get a single post |
| PUT | `/api/social-posts/:id` | Update post fields |
| DELETE | `/api/social-posts/:id` | Archive post (sets status=archived) |
| POST | `/api/social-posts/:id/approve` | Approve post, records approver + timestamp |

### Brand Guidelines

| Method | URL | What it does |
|--------|-----|-------------|
| GET | `/api/brand-guidelines` | List all versions (add `?active=true` for active only) |
| POST | `/api/brand-guidelines` | Create new version (auto-increments version number) |
| GET | `/api/brand-guidelines/:id` | Get a single version |
| PUT | `/api/brand-guidelines/:id` | Update version fields |
| POST | `/api/brand-guidelines/:id/activate` | Set as active (deactivates all others) |

---

## n8n Integration

When you're ready to have n8n fetch the active brand voice instead of reading the static `.md` file:

1. In your n8n workflow, add an HTTP Request node at the start
2. **Method:** GET
3. **URL:** `https://admin.stpetemusic.live/api/brand-guidelines?active=true`
4. Add a header: `Cookie: <session cookie>` or use an API key once you add that endpoint
5. Extract `guidelines[0].system_prompt` and pass it to your AI node

This replaces the hardcoded `system-prompt.md` read in existing workflows. The static file stays as a fallback.

---

## Quick Start: Generating Content

To create a post for Final Friday on June 27:

```
# 1. Generate the content bundle
/content-cycle Final Friday June 27 — headliners are The Gaslight Anthem cover band, some jazz trio, and a singer-songwriter

# 2. Review the output in production_artifacts/content/
# The agent will pause and wait for you to approve

# 3. Approve → it creates a draft in the social_posts table

# 4. Open admin.stpetemusic.live/dashboard/content-calendar
# Review and approve the post there

# 5. n8n picks it up on schedule and publishes
```

---

## Quick Start: Weekly Social Review

Every Monday morning:

```
/social-review
```

The agent pulls last week's GA4 data and your post performance stats, then recommends:
- Best posting times based on your engagement data
- Hashtags that are gaining traction
- Content types performing well (Reels vs. Posts vs. Stories)
- Suggested posting calendar for the week

Review the report in `production_artifacts/social-strategy/` and keep the ones worth referencing later.
