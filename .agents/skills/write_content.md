# Skill: write_content — @content_writer

## Objective

Generate high-quality, on-brand content for all platforms — social media captions, YouTube descriptions, newsletter copy, and blog posts. Always working from approved brand voice and event guidelines.

---

## Rules of Engagement

1. **ALWAYS load `.agents/context/brand-voice.md` before generating any content** — no exceptions, no shortcuts
2. **Load `.agents/context/event-types.md`** when writing about any recurring event (Final Friday, Instant Noodles, Art Walk)
3. **Never make up event details, band names, dates, or URLs** — only use data provided by the user or confirmed via the DB
4. Always generate a **multi-platform bundle**: YouTube title + caption + IG/FB post + newsletter snippet simultaneously
5. Save output to `production_artifacts/content/[event-or-topic]-bundle.md` for user review
6. **Approval gate:** Present the bundle; do not pass to `@workflow_builder` or `@social_manager` until user says "approved"

---

## Instructions

### Step 1: Gather Information

Ask the user for (or extract from their request):
- Band name + Instagram handle (exact capitalization matters)
- Event type (Final Friday? Instant Noodles? Regular show? Something else?)
- Date of recording/event (`recordDate`)
- Any special context (ticket price, special guests, themes)

If band name, Instagram handle, or recording date are missing → ask before generating.
Do NOT ask about postDate or postTime — these are calculated automatically (next weekday, 3–7 days out, 8am EST).

### Step 2: Load Brand Context

Before writing, read:
- `.agents/context/brand-voice.md` — tone, platform formats, hashtags
- `.agents/context/event-types.md` — if event type is recurring

### Step 3: Generate the Bundle

Output a single markdown file with all platform variants:

```markdown
# Content Bundle: [Band/Event Name] — [MM.DD.YYYY]

## YouTube Title
[Full title in MM.DD.YYYY || @Handle at @Suite.E.Studios #StPeteMusic format]

## YouTube Caption (video title field — max 100 chars)
[Short caption in MM.DD || @Handle at @Suite.E.Studios #StPeteMusic #StPeteFL format]

## YouTube Description
[Full description with boilerplate]

## YouTube ytTags
[Comma-separated tags array]

## Instagram / Facebook Post
[3-section post with triple newlines between sections]

## Newsletter Snippet (1-2 sentences)
[Short teaser suitable for featured bands section of newsletter]

## Metadata
- bandName: [exact band name]
- bandInstagram: @[handle]
- recordDate: [YYYY-MM-DDTHH:MM:SS.0Z]
- postDate: [calculated — next Mon-Fri, 3-7 days out, T13:00:00.0Z]
- hashtags: ["#StPeteMusic", "#SuiteEStudios", "#StPeteFL", "#TampaBay"]
- ytPlaylist: PL5gTeopOibQREpXSSqHwVaZTWv1EdUuki
- status: draft
```

### Step 4: Save and Present

Save to `production_artifacts/content/[band-or-event]-YYYY-MM-DD-bundle.md`

Present to user:
```
@content_writer: Content bundle ready for [band/event].

[bundle content]

---
Approve to send to n8n queue, or provide feedback for revisions.
```

### Step 5: After Approval

If user approves → pass the bundle's metadata to `@workflow_builder` to queue in n8n (or create a draft in the `social_posts` DB table if that feature is built).

---

## Brand Voice Quick Reference

- Tone: Enthusiastic, authentic, community-oriented, slightly informal but professional
- Opening emojis for IG/FB: 🎸 🎶 🔥 ✨ 🎤 🎵
- Default hashtags: `#StPeteMusic #SuiteEStudios #StPeteFL #TampaBay`
- Always tag: `@suite.e.studios` on IG, `@Suite.E.Studios` in text
- Date format: `MM.DD` in captions, `MM.DD.YYYY` in titles
