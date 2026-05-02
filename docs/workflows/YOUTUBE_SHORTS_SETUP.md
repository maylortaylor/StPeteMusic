# YouTube Shorts Tracker - Setup & Integration Guide

**Created:** March 5, 2026
**Project:** @StPeteMusic YouTube Shorts Automation
**Status:** Phase 1 - Tracker Setup

---

## 🎯 Overview

This system allows you to:
1. ✅ Create YouTube Shorts tracking files via n8n Chat
2. ✅ Manage video metadata in Obsidian (with Dataview dashboard)
3. ✅ Filter videos by status (draft → ready → published)
4. ✅ Trigger n8n to download & upload to YouTube when status = "ready"

---

## 📋 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    YouTube Shorts Workflow                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ Phase 1: Tracking (THIS)                                         │
│                                                                  │
│  You (n8n Chat)                                                 │
│    ↓                                                             │
│  n8n: YouTube Shorts Creator v1                                │
│    ↓                                                             │
│  Obsidian File Created: MM.dd.yyyy | Band Name @IG.md          │
│    ↓                                                             │
│  You: Add mediaLink + change status to "ready"                 │
│    ↓                                                             │
│  Obsidian: "Ready for Upload" Dashboard updated                │
│    ↓                                                             │
│  [READY FOR PHASE 2]                                            │
└──────────────────────────────────────────────────────────────────┘

[Future Phase 2: YouTube Upload]

┌──────────────────────────────────────────────────────────────────┐
│ Phase 2: Upload to YouTube (NEXT)                                │
│                                                                  │
│  n8n: YouTube Shorts Uploader                                  │
│    ↓                                                             │
│  Watches: Obsidian "Ready for Upload" view                     │
│    ↓                                                             │
│  Downloads: Video from Google Drive                             │
│    ↓                                                             │
│  Uploads: To YouTube Shorts with all metadata                  │
│    ↓                                                             │
│  Updates: Status to "published" in Obsidian                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (Phase 1)

### Step 1: Create Obsidian Folder Structure

In your Obsidian vault, create this folder structure:

```
vault/
└── StPeteMusic/
    └── YouTube/
        ├── Shorts/                    ← Individual short files go here
        ├── Shorts Dashboard.md        ← View 1: All videos by status
        └── Ready for Upload.md        ← View 2: Only "ready" videos
```

### Step 2: Import n8n Workflow

1. Open n8n UI: `http://localhost:5678`
2. **Workflows** → **Import from file**
3. Select: `youtube-shorts-tracker-creator.json`
4. Click **Import**
5. Set up n8n HTTP Bearer credentials (same as post creator v2)

### Step 3: Add Dataview Queries

1. In Obsidian, open **`vault/StPeteMusic/YouTube/Shorts Dashboard.md`**
2. Paste this query:

```dataview
TABLE WITHOUT ID
  file.link as "Video",
  bandName as "Band",
  postDate as "Date",
  status as "Status"
FROM "StPeteMusic/YouTube/Shorts"
WHERE type = "youtube-short"
GROUP BY status
SORT file.name DESC
```

3. In Obsidian, open **`vault/StPeteMusic/YouTube/Ready for Upload.md`**
4. Paste this query:

```dataview
TABLE WITHOUT ID
  file.link as "Video",
  bandName as "Band",
  bandInstagram as "IG",
  postDate as "Date",
  mediaLink as "Google Drive Link",
  status as "Status"
FROM "StPeteMusic/YouTube/Shorts"
WHERE type = "youtube-short" AND status = "ready"
SORT postDate DESC
```

### Step 4: Test the Workflow

1. Open n8n and start the workflow (toggle ON)
2. Click **Chat** (bottom right)
3. Send a message like:

```
Create a YouTube Short for: Bad Wolf @bad_wolf_band on 03.06.2026
at Final Friday. The performance was amazing, great energy!
Caption: 🎸 Bad Wolf bringing the energy at Final Friday
Include: #FinalFriday #StPeteMusic @suite.e.studios
```

4. n8n will create a markdown file
5. Check Obsidian: `vault/StPeteMusic/YouTube/Shorts/03.06.2026 | Bad Wolf @bad_wolf_band.md`

---

## 📝 Example YouTube Short File

Here's what gets created:

**File:** `03.06.2026 | Bad Wolf @bad_wolf_band.md`

```markdown
---
title: "YouTube Short - Bad Wolf"
type: youtube-short
status: draft
bandName: "Bad Wolf"
bandInstagram: "@bad_wolf_band"
suiteEStudios: "Suite E Studios"
suiteEStudiosInstagram: "@suite.e.studios"
caption: "🎸 Bad Wolf bringing the energy at Final Friday"
platform: "YouTube"
postDate: "2026-03-06"
postTime: "11:00 AM"
hashtags: "#FinalFriday #StPeteMusic"
mentions: "@StPeteMusic, @suite.e.studios, @bad_wolf_band"
eventType: "Music"
mediaType: "Video"
ytPlaylist: ""
ytTags: "stpetemusic,suite e studios,final friday,bad wolf"
mediaLink: ""
bandNameString: "Bad Wolf"
bandUsernameIG: "@bad_wolf_band"
created-date: 2026-03-05
---

# YouTube Short: Bad Wolf

**Date Created:** 3/5/2026
**Status:** draft

---

## 📌 Video Metadata

bandName:: Bad Wolf
bandInstagram:: @bad_wolf_band
suiteEStudios:: Suite E Studios
suiteEStudiosInstagram:: @suite.e.studios
platform:: YouTube
status:: draft
postDate:: 2026-03-06
postTime:: 11:00 AM
eventType:: Music
mediaType:: Video

---

## 📝 Caption

🎸 Bad Wolf bringing the energy at Final Friday

---

## 🔗 Links & Tags

mediaLink:: Not yet added
ytPlaylist::
ytTags:: stpetemusic,suite e studios,final friday,bad wolf

**Mentions:**
- @StPeteMusic
- @suite.e.studios
- @bad_wolf_band

**Hashtags:**
#FinalFriday #StPeteMusic

---

## ✅ Status Workflow

Current Status: **draft**

- **draft** — Still collecting info
- **ready** — Approved, Google Drive link added, ready for n8n upload
- **processing** — n8n is uploading to YouTube
- **published** — Live on YouTube
- **failed** — Upload failed, review error log

---

## 📋 Upload Checklist

- [ ] Caption finalized
- [ ] Video available in Google Drive (public link)
- [ ] Hashtags set
- [ ] Mentions tagged
- [ ] Status changed to "ready"
- [ ] n8n uploads to YouTube
- [ ] Status updates to "published"
```

---

## ✏️ How to Update a Short

### Step 1: Open the file in Obsidian

`vault/StPeteMusic/YouTube/Shorts/03.06.2026 | Bad Wolf @bad_wolf_band.md`

### Step 2: Add the Google Drive Link

Find this line:
```
mediaLink:: Not yet added
```

Replace with:
```
mediaLink:: [View in Google Drive](https://drive.google.com/file/d/1ABC123XYZ/view?usp=sharing)
```

### Step 3: (Optional) Edit Caption

Edit the caption section if needed.

### Step 4: Change Status to "ready"

Find this line in the frontmatter:
```yaml
status: draft
```

Change to:
```yaml
status: ready
```

Also update the inline field:
```
status:: ready
```

### Step 5: Done!

File is now showing in the **"Ready for Upload"** dashboard. When the next phase (YouTube upload workflow) is ready, n8n will:
- Detect status = "ready"
- Download video from Google Drive
- Upload to YouTube Shorts with all metadata
- Update status to "published"

---

## 📊 Dashboard Views

### View 1: Shorts Dashboard (All Videos)

Shows all YouTube Shorts organized by status:

| Video | Band | Date | Status |
|-------|------|------|--------|
| 03.06.2026 | Bad Wolf | 2026-03-06 | draft |
| 03.05.2026 | Wandering Hearts | 2026-03-05 | ready |
| 03.04.2026 | The Natives | 2026-03-04 | published |

**Click any video name to open and edit it.**

### View 2: Ready for Upload (Upload Queue)

Shows only videos with `status: ready`:

| Video | Band | IG | Date | Google Drive Link | Status |
|-------|------|----|----|---|--------|
| 03.05.2026 | Wandering Hearts | @wandering_hearts | 2026-03-05 | [Link](https://...) | ready |

**This is what n8n will watch for Phase 2 uploads.**

---

## 🔄 Field Reference

### Fields You Can Filter/Search

**Frontmatter fields** (YAML):
- `status` — draft, ready, processing, published, failed
- `bandName` — Band name
- `bandInstagram` — Band IG handle
- `postDate` — Date (YYYY-MM-DD format)
- `platform` — Always "YouTube" for this system
- `eventType` — Music, Comedy, Art, etc.

**Inline fields** (in markdown body):
- `bandName::` — Queryable in Dataview
- `status::` — Queryable in Dataview
- `mediaLink::` — Queryable in Dataview
- `postDate::` — Queryable in Dataview

---

## 🛠️ Troubleshooting

### File not appearing in Obsidian

- **Check:** Obsidian is running and vault is open
- **Check:** HTTP request succeeded (n8n logs)
- **Check:** File path is correct: `vault/StPeteMusic/YouTube/Shorts/`
- **Solution:** Restart Obsidian vault

### Dataview query not showing results

- **Check:** Files have `type: youtube-short` in frontmatter
- **Check:** Files are in `StPeteMusic/YouTube/Shorts/` folder
- **Check:** Dataview plugin is installed and enabled
- **Solution:** Open Obsidian settings → Dataview → Verify enabled

### "Ready for Upload" dashboard is empty

- **Check:** No files with `status: ready` exist yet
- **Solution:** Create a test file and manually change status to "ready"

### n8n Chat not working

- **Check:** Workflow is toggled ON
- **Check:** n8n HTTP Bearer credentials are configured
- **Check:** Obsidian local API is running (port 27123)
- **Solution:** Restart n8n and check logs

---

## 🎯 Next Phase: YouTube Upload Workflow

When you're ready to automate YouTube uploads, the next workflow will:

1. **Watch** the "Ready for Upload" Obsidian dashboard
2. **Detect** videos with `status: ready`
3. **Download** video from Google Drive URL
4. **Extract** all metadata from frontmatter
5. **Upload** to YouTube Shorts with:
   - Title/caption
   - Description
   - Tags
   - Playlist assignment
   - Thumbnail (if available)
6. **Update** status to:
   - `processing` (while uploading)
   - `published` (success) with YouTube URL
   - `failed` (if error) with error message

### What You Need to Prepare for Phase 2

- YouTube Data API credentials in n8n
- Google Drive API credentials in n8n
- Permission to upload to @StPeteMusic YouTube channel
- Thumbnail images (optional but recommended)

---

## 📞 Support

- **Dataview Issues:** [Obsidian Dataview Docs](https://blacksmithgu.github.io/obsidian-dataview/)
- **n8n Issues:** Check n8n logs and workflow execution history
- **Obsidian Issues:** Check vault settings and plugin configuration

---

**Last Updated:** March 5, 2026
**Maintained By:** Matt Taylor (@StPeteMusic)
