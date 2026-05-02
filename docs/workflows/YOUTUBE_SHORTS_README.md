# YouTube Shorts Tracker - Documentation Index

**Status:** Phase 1 Complete ✅

This folder contains the n8n workflow for YouTube Shorts tracking. Documentation files are in your Obsidian vault.

---

## 📂 File Locations

### n8n Workflow (Here)
- **File:** `youtube-shorts-tracker-creator.json`
- **Location:** `/StPeteMusic/n8n/workflows/StPeteMusic/`
- **Purpose:** Creates YouTube Shorts tracking files via n8n Chat

### Obsidian Vault Documentation
- **Location:** `/obsidian_vault/StPeteMusic/YouTube/`
- **Files:**
  - `Shorts Dashboard.md` — View all videos by status
  - `Ready for Upload.md` — View only "ready" videos for upload
  - `SETUP_GUIDE.md` — Complete setup instructions
  - `QUICK_REFERENCE.md` — Quick start & common tasks
  - `Shorts/` — Folder for individual short files

---

## 🚀 Quick Start

### 1. Import n8n Workflow

```bash
# File location
/StPeteMusic/n8n/workflows/StPeteMusic/youtube-shorts-tracker-creator.json

# In n8n UI:
Workflows → Import from file → Select above file
```

### 2. Check Obsidian Vault Structure

All dashboard files and documentation are in:
```
/obsidian_vault/StPeteMusic/YouTube/
├── Shorts/                    ← Short files go here
├── Shorts Dashboard.md
├── Ready for Upload.md
├── SETUP_GUIDE.md
└── QUICK_REFERENCE.md
```

### 3. Start Creating Shorts

Open n8n Chat and send:
```
Create YouTube Short:
Band: Bad Wolf @bad_wolf_band
Date: 03.06.2026
Caption: 🎸 Bad Wolf at Final Friday
Tags: #FinalFriday #StPeteMusic
```

File appears in Obsidian at: `Shorts/03.06.2026 | Bad Wolf @bad_wolf_band.md`

---

## 📋 Next Phase

Phase 2 will automate YouTube uploads when a short's status changes to `ready`:

1. **Watch** the "Ready for Upload" Obsidian view
2. **Download** video from Google Drive
3. **Upload** to YouTube Shorts with all metadata
4. **Update** status to "published"

---

## 🔗 File Architecture

```
YouTube Shorts Tracker System

n8n Side:
├── youtube-shorts-tracker-creator.json
│   ├── Chat trigger (you provide info)
│   ├── AI Agent (extracts metadata)
│   ├── Parse output (JSON)
│   ├── Convert to markdown
│   └── HTTP PUT to Obsidian

Obsidian Side:
├── StPeteMusic/YouTube/Shorts/
│   └── MM.dd.yyyy | Band @handle.md
│       ├── YAML frontmatter (metadata)
│       └── Inline fields (for Dataview)
├── Shorts Dashboard.md
│   └── Dataview query: All by status
├── Ready for Upload.md
│   └── Dataview query: Only ready ones
└── Documentation files
```

---

## 📊 Data Fields Tracked

Each YouTube Short contains:

```
YAML Frontmatter:
- type: youtube-short
- status: draft|ready|processing|published|failed
- bandName, bandInstagram
- suiteEStudios, suiteEStudiosInstagram
- caption, platform, postDate, postTime
- hashtags, mentions (array)
- eventType, mediaType
- ytPlaylist, ytTags
- mediaLink, bandNameString, bandUsernameIG
- created-date

Inline Fields (in markdown):
- bandName::
- status::
- mediaLink::
- postDate::
```

---

## 🎯 For Reference

### Full Documentation
→ Open `/obsidian_vault/StPeteMusic/YouTube/SETUP_GUIDE.md`

### Quick Commands
→ Open `/obsidian_vault/StPeteMusic/YouTube/QUICK_REFERENCE.md`

### Dashboard Views
- All videos: `/obsidian_vault/StPeteMusic/YouTube/Shorts Dashboard.md`
- Ready to upload: `/obsidian_vault/StPeteMusic/YouTube/Ready for Upload.md`

---

## 🔧 Workflow Configuration

### Obsidian Local API

The workflow sends files via HTTP PUT to Obsidian's local API:

```
Endpoint: http://host.docker.internal:27123/vault/...
Auth: HTTP Bearer (same as post creator v2)
Body: Markdown file content
```

**Note:** This requires Obsidian to be running with the local API enabled.

---

## 📞 Support & Resources

- **Dataview Docs:** https://blacksmithgu.github.io/obsidian-dataview/
- **n8n Docs:** https://docs.n8n.io/
- **Obsidian Docs:** https://help.obsidian.md/

---

**Last Updated:** March 5, 2026
**Maintained By:** Matt Taylor (@StPeteMusic)
