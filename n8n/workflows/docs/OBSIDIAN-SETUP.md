# Obsidian N8N Workflows Setup Guide

This guide explains how to set up and configure the two new Obsidian-based N8N workflows for @StPeteMusic.

---

## 📋 Overview

Two workflows have been created to replace the Notion-based setup:

1. **obsidian-post-creator.json** — AI-powered chat interface to generate social media posts
2. **obsidian-to-social-media-posting.json** — Automatic posting to Instagram, Facebook, YouTube

---

## 🔧 Prerequisites

Before importing these workflows, you need:

### 1. Obsidian Local REST API Plugin
- ✅ Already installed (per NEXT-STEPS.md)
- ✅ API key already saved
- **Verify**: Open Obsidian → Settings → Local REST API → copy API key

### 2. N8N Running Locally
- URL: `http://localhost:5678`
- Default port: 5678

### 3. API Keys & Credentials

You'll need to set up credentials in N8N for:

| Service | Type | Where to Get | Used By |
|---------|------|-------------|---------|
| **OpenAI API** | API Key | https://platform.openai.com/api-keys | Post Creator (AI Agent) |
| **Instagram Graph API** | Access Token | https://developers.facebook.com/docs/instagram-graph-api | Social Posting |
| **Facebook Graph API** | Access Token | https://developers.facebook.com/docs/facebook-login/access-tokens | Social Posting |
| **YouTube Data API** | OAuth 2.0 | https://console.cloud.google.com | Social Posting |
| **Obsidian Local REST API** | API Key | Obsidian Settings | Both |

---

## 📝 Workflow 1: Obsidian Post Creator

### What It Does

Chat-based interface that uses Claude/OpenAI to generate social media posts for @StPeteMusic based on provided information. Posts are saved directly to Obsidian vault.

**Flow:**
1. User sends chat message with event/band details
2. AI Agent reads existing posts from Obsidian for style consistency
3. AI generates JSON with platform-specific captions
4. Posts are written to `🎵 StPeteMusic/Content/Drafts/` as markdown files

### Setup Steps

#### Step 1: Configure OpenAI Credentials

1. In N8N, go to **Credentials** → **Create New**
2. Select **OpenAI API**
3. Add your OpenAI API key
4. Name it: `OpenAI API`

#### Step 2: Configure Obsidian API Credentials

1. In N8N, go to **Credentials** → **Create New**
2. Select **HTTP Header Auth**
3. Set:
   - Header name: `Authorization`
   - Header value: `Bearer [YOUR_OBSIDIAN_API_KEY]`
4. Name it: `Obsidian Local REST API`

#### Step 3: Import Workflow

1. Go to N8N Dashboard → **Workflows**
2. Click **Import**
3. Upload `obsidian-post-creator.json`
4. Review and fix any credential references (replace placeholder IDs)

#### Step 4: Test the Workflow

1. Open the workflow
2. Click **Test** or **Listen for chat**
3. Try a message like:
   ```
   Create posts for March Final Friday with Earth Girl, CHRISS, and Ava Iri
   $10 with code, $15 at door
   Tickets: https://final-friday.eventbrite.com
   ```
4. Check that posts appear in `🎵 StPeteMusic/Content/Drafts/`

### Using the Workflow

Once running, simply chat with the workflow:

**For Event Announcements:**
```
Create posts for [Event Name] on [Date] at Suite E Studios
Featuring: [Band 1], [Band 2], [Band 3]
Ticket prices: [Price with code], [Price at door]
Tickets: [URL]
```

**For Band Spotlights:**
```
Create a band spotlight for [Band Name] (@[handle])
They're [brief description of who they are]
What makes them special: [unique aspect]
Where to follow: [link]
```

---

## 📝 Workflow 2: Obsidian to Social Media Posting

### What It Does

Monitors Obsidian vault for posts with `status: ready`, then automatically posts them to Instagram, Facebook, and YouTube based on the platform field.

**Flow:**
1. Scheduled trigger (every 4 hours) OR manual trigger
2. Query Obsidian vault for files with `status: ready`
3. Extract post data from markdown frontmatter
4. Route by platform (IG/FB/YT)
5. Post to appropriate social platform
6. Update Obsidian file status to `published`

### Setup Steps

#### Step 1: Configure Social Media API Credentials

**Instagram:**
1. Go to **Credentials** → **Create New** → **Generic API**
2. Set Authorization: `Bearer [YOUR_INSTAGRAM_ACCESS_TOKEN]`
3. Name: `Instagram API Token`

**Facebook:**
1. Go to **Credentials** → **Create New** → **Generic API**
2. Set Authorization: `Bearer [YOUR_FACEBOOK_ACCESS_TOKEN]`
3. Name: `Facebook API Token`

**YouTube:**
1. Go to **Credentials** → **Create New** → **OAuth2**
2. Follow Google OAuth2 setup
3. Name: `YouTube API`

#### Step 2: Verify Obsidian Credentials

Use the same `Obsidian Local REST API` credentials from Workflow 1.

#### Step 3: Import Workflow

1. Go to N8N Dashboard → **Workflows**
2. Click **Import**
3. Upload `obsidian-to-social-media-posting.json`
4. Update all credential references

#### Step 4: Test the Workflow

1. Create a test post in `🎵 StPeteMusic/Content/Drafts/`
2. Use this frontmatter structure:
   ```markdown
   ---
   title: "Test Post"
   status: ready
   platform: IG
   publish-date: 2026-03-10
   publish-time: "11:00 AM"
   caption: "Test caption for Instagram"
   hashtags: "#StPeteMusic #test"
   media-link: "https://example.com/image.jpg"
   ---
   ```
3. Click **Manual Trigger** in the workflow
4. Monitor N8N execution
5. Verify post appears on Instagram (may be in draft if media handling needs adjustment)

### Using the Workflow

The workflow runs automatically every 4 hours. To manually trigger:

1. Open the workflow
2. Click **Execute**
3. Wait for posts to be queued/posted
4. Check social media accounts to verify

**To post content:**
1. Create a markdown file in `🎵 StPeteMusic/Content/Drafts/`
2. Set status to `ready` in frontmatter
3. Workflow will pick it up and post within 4 hours (or manually trigger)

---

## 📊 Markdown File Structure

All posts in the vault should follow this structure:

```markdown
---
title: "IG Post - 2026-03-10"
type: content
status: draft
content-type: event-announcement
platform: IG
subject: "Final Friday"
venue: "Suite E Studios"
publish-date: 2026-03-10
publish-time: "11:00 AM"
platforms: ["ig-reels"]
media-type: video
media-link: "https://..."
privacy-status: draft
ai-generated: true
created-date: 2026-03-04
---

# IG Post - 2026-03-10

## Caption

🎸 03.27 Earth Girl || Suite.E.Studios


✨ Get ready for an unforgettable night of electronic soundscapes!


#StPeteMusic #SuiteEStudios #EarthGirl

## Metadata

- **Platform**: IG
- **Date**: 2026-03-10
- **Time**: 11:00 AM
- **Tags**: @suite.e.studios @earthgirl
- **Hashtags**: #StPeteMusic #SuiteEStudios #EarthGirl
- **Media Type**: video

## Status

Ready to post!
```

---

## 🔑 Key Fields for Automation

The workflows look for these frontmatter fields:

| Field | Values | Purpose |
|-------|--------|---------|
| `status` | draft, ready, scheduled, published | Workflow trigger |
| `platform` | IG, FB, YT | Routes to correct social platform |
| `publish-date` | YYYY-MM-DD | When to post |
| `publish-time` | HH:MM AM/PM | What time (default 11:00 AM) |
| `media-link` | URL | Link to media (image/video) |
| `caption` | Text | Post content |
| `hashtags` | Text | Hashtags to append |
| `ai-generated` | true/false | For tracking |

---

## 🐛 Troubleshooting

### Posts not being created

**Check:**
1. Is Obsidian Local REST API running and enabled?
2. Is OpenAI API key valid?
3. Check N8N logs for error messages
4. Verify the Obsidian vault path is correct: `🎵 StPeteMusic/Content/Drafts/`

### Posts not posting to social media

**Check:**
1. Is the post status set to `ready`?
2. Are social media API tokens valid and have necessary permissions?
3. Is media-link URL accessible?
4. Check N8N execution logs for platform-specific errors

### API Key Issues

**Solution:**
1. Go to N8N Credentials
2. Find the credential
3. Click "Edit"
4. Update the API key
5. Save and re-run workflow

---

## 🚀 Next Steps

1. ✅ Set up all required API credentials
2. ✅ Import both workflows
3. ✅ Test Post Creator by creating 1-2 sample posts
4. ✅ Test Social Posting by manually triggering
5. ✅ Enable scheduled trigger (every 4 hours)
6. ✅ Start using via chat interface

---

## 📚 AI Prompt Templates

The workflows reference AI prompts stored in:
- `🤖 AI-Prompts/event-announcement-template.md`
- `🤖 AI-Prompts/band-spotlight-template.md`

These templates are used by the AI Agent to generate consistent, on-brand posts. Modify these templates to change tone, format, or guidelines.

---

## Questions or Issues?

Check the system-prompt.md file for detailed caption formatting rules, tag conventions, and platform-specific guidelines.

