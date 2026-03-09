# YouTube Shorts Tracker - Usage Guide

**Updated:** March 6, 2026
**Version:** v1.1 (Fixed AI Agent output)

---

## ✅ What Was Fixed

The workflow now uses a **stricter AI Agent system message** that forces JSON-only output. The AI Agent will:
- Output ONLY valid JSON in a code block
- Extract ALL required metadata
- Apply defaults for missing fields
- Ignore conversational requests

---

## 📝 How to Create a YouTube Short (Correct Format)

### Example Input (Copy This Format)

Send one of these formats in n8n Chat:

**Format 1 (Simple):**
```
Band: Mountain Holler @mountain_holler
Date: 02.20.2026
Caption: Amazing live performance at Final Friday
```

**Format 2 (Detailed):**
```
Create YouTube Short:
Band: Mountain Holler @mountain_holler
Date: 02.20.2026
Venue: Final Friday at Suite E Studios
Caption: 🎸 Mountain Holler bringing the energy!
Hashtags: #FinalFriday #StPeteMusic #LiveMusic
Mentions: @StPeteMusic @suite.e.studios
```

**Format 3 (Most Detailed):**
```
YouTube Short Info:
- Band: Bad Wolf @bad_wolf_band
- Date: 03.06.2026
- Event: Final Friday
- Caption: 🎸 Bad Wolf at Final Friday - amazing energy!
- Hashtags: #FinalFriday #StPeteMusic #WarehouseArts
- Mentions: @StPeteMusic @suite.e.studios @bad_wolf_band
- Playlist: https://www.youtube.com/playlist?list=...
```

---

## ✅ Expected Output

The AI Agent will extract the data and create a markdown file like:

**Filename:** `02.20.2026 | Mountain Holler @mountain_holler.md`

**Content:** YAML frontmatter + markdown with all fields

---

## 🔄 Full Workflow

### Step 1: Create Short (n8n Chat)
```
Band: Mountain Holler @mountain_holler
Date: 02.20.2026
Caption: Great performance!
```

### Step 2: Check Output
- File appears in Obsidian: `StPeteMusic/YouTube/Shorts/02.20.2026 | Mountain Holler @mountain_holler.md`
- Status: `draft`
- Google Drive link: empty

### Step 3: Update in Obsidian
1. Open the file
2. Add Google Drive link:
   ```
   mediaLink:: [View in Google Drive](https://drive.google.com/file/d/FILE_ID/view?usp=sharing)
   ```
3. Change status in two places:
   - YAML frontmatter: `status: ready`
   - Inline field: `status:: ready`
4. Save

### Step 4: Dashboard Updates
- File appears in "Ready for Upload" dashboard
- Ready for Phase 2 YouTube upload

---

## 📋 Required vs Optional Fields

### REQUIRED (Must provide in chat)
- Band name (extract from your input)
- Band Instagram handle (e.g., @band_name)
- Date (MM.DD.YYYY format)
- Caption or description

### AUTO-FILLED (Defaults applied)
- `suiteEStudios`: "Suite E Studios"
- `suiteEStudiosInstagram`: "@suite.e.studios"
- `platform`: "YouTube"
- `eventType`: "Music"
- `mediaType`: "Video"
- `postTime`: "11:00 AM"
- `status`: "draft"
- `mediaLink`: "" (you add this manually)

### OPTIONAL (Include in chat if available)
- Hashtags
- Additional mentions
- Event type (if not music)
- YouTube playlist URL
- YouTube tags

---

## 🎯 What The AI Agent Extracts

From your chat input, the AI Agent extracts:

```json
{
  "bandName": "Mountain Holler",           // Band name from input
  "bandInstagram": "@mountain_holler",    // Band IG handle from input
  "suiteEStudios": "Suite E Studios",     // DEFAULT
  "suiteEStudiosInstagram": "@suite.e.studios",  // DEFAULT
  "caption": "Amazing live performance!",  // Your caption
  "platform": "YouTube",                  // DEFAULT
  "postDate": "2026-02-20",               // Converted from 02.20.2026
  "postTime": "11:00 AM",                 // DEFAULT
  "hashtags": "#FinalFriday #StPeteMusic", // From input or defaults
  "mentions": ["@StPeteMusic", "@suite.e.studios", "@mountain_holler"],
  "eventType": "Music",                   // DEFAULT
  "mediaType": "Video",                   // DEFAULT
  "ytPlaylist": "",                       // Optional (if not provided)
  "ytTags": "stpetemusic,suite e studios,final friday,mountain holler",
  "mediaLink": "",                        // YOU ADD LATER
  "bandNameString": "Mountain Holler",    // Same as bandName
  "bandUsernameIG": "@mountain_holler",   // Same as bandInstagram
  "status": "draft"                       // DEFAULT
}
```

---

## 🛠️ Troubleshooting

### "Failed to parse AI output" error

**Problem:** AI Agent didn't return valid JSON

**Solutions:**
1. **Include band Instagram handle** - Must have @handle in your input
2. **Include date** - Must be MM.DD.YYYY format
3. **Simplify input** - Too much text might confuse the AI
4. **Try again** - Sometimes AI needs a retry

### File not appearing in Obsidian

**Problem:** Obsidian didn't receive the file

**Check:**
- Obsidian is running
- Obsidian local API is enabled (port 27123)
- Check n8n execution logs for HTTP errors

### Status fields not updating in dashboard

**Problem:** File has status but isn't showing in "Ready for Upload"

**Check:**
- Updated BOTH places:
  - YAML frontmatter: `status: ready`
  - Inline field: `status:: ready`
- File is in correct folder: `StPeteMusic/YouTube/Shorts/`
- File has `type: youtube-short` in frontmatter
- Refresh Obsidian (Cmd+R or reload vault)

---

## 📊 Field Reference

### Frontmatter Fields

```yaml
title: "YouTube Short - Band Name"
type: youtube-short                # REQUIRED for Dataview
status: draft                       # draft, ready, processing, published, failed
bandName: "Band Name"
bandInstagram: "@band_instagram"
suiteEStudios: "Suite E Studios"
suiteEStudiosInstagram: "@suite.e.studios"
caption: "Full caption text"
platform: "YouTube"
postDate: "2026-02-20"              # YYYY-MM-DD format
postTime: "11:00 AM"
hashtags: "#Tag1 #Tag2 #Tag3"
mentions: "@mention1, @mention2, @mention3"
eventType: "Music"
mediaType: "Video"
ytPlaylist: "https://..."
ytTags: "tag1,tag2,tag3"
mediaLink: ""                       # YOU ADD THIS
bandNameString: "Band Name"
bandUsernameIG: "@band_instagram"
created-date: 2026-03-06
```

### Inline Fields (In markdown body)

```
bandName:: Band Name
bandInstagram:: @band_instagram
status:: draft
mediaLink:: [Google Drive](https://...)
postDate:: 2026-02-20
```

---

## ✨ Tips for Best Results

1. **Include band Instagram** - Critical for extraction
2. **Use MM.DD.YYYY dates** - Format matters
3. **Include caption** - Description for YouTube
4. **Keep it simple** - Avoid too much extra text
5. **Add hashtags** - Helps with YouTube discoverability
6. **Review file after creation** - Edit caption or hashtags before marking ready
7. **Google Drive links must be public** - When you add mediaLink, make sure video is publicly shared

---

## 🚀 Example Workflows

### Workflow 1: Simple Creation
```
Chat: "Mountain Holler @mountain_holler on 02.20.2026 - Great performance!"
Result: File created with default caption
Next: Edit caption, add Google Drive link, change status to ready
```

### Workflow 2: Detailed Creation
```
Chat: "
Band: Bad Wolf @bad_wolf_band
Date: 03.06.2026
Caption: 🎸 Bad Wolf at Final Friday - amazing energy!
Hashtags: #FinalFriday #StPeteMusic #WarehouseArts
"
Result: File created with all details
Next: Add Google Drive link, change status to ready
```

### Workflow 3: Batch Creation
```
Chat 1: "Mountain Holler @mountain_holler on 02.20.2026"
Chat 2: "Bad Wolf @bad_wolf_band on 02.20.2026"
Chat 3: "Wandering Hearts @wandering_hearts on 03.06.2026"
Result: 3 files created
Next: Update each one with Google Drive links and change status
```

---

## 🔗 Next Phase (YouTube Upload)

When the Phase 2 workflow is ready:
1. It watches the "Ready for Upload" dashboard
2. Detects videos with `status: ready`
3. Downloads from Google Drive
4. Uploads to YouTube Shorts
5. Updates status to `processing` → `published`

---

**Last Updated:** March 6, 2026
**Workflow Version:** v1.1 (Fixed)
**Status:** Ready for testing
