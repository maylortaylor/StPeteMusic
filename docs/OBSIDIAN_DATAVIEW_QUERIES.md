# Obsidian Dataview Queries - YouTube Shorts Tracker

This document contains the Dataview queries for the YouTube Shorts tracking system. Copy these into Obsidian code blocks to display your YouTube Shorts tracker.

---

## 📊 View 1: All YouTube Shorts (Grouped by Status)

**Purpose:** Complete dashboard view of all YouTube Shorts, grouped by status, sorted newest first.

**Location in Obsidian:** Create a file called `vault/StPeteMusic/YouTube/Shorts Dashboard.md` and insert this query:

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

### Alternative: More Detailed View

If you want to see more fields:

```dataview
TABLE WITHOUT ID
  file.link as "Video",
  bandName as "Band",
  bandInstagram as "IG",
  postDate as "Date",
  status as "Status",
  mediaType as "Media"
FROM "StPeteMusic/YouTube/Shorts"
WHERE type = "youtube-short"
GROUP BY status
SORT postDate DESC
```

---

## 🚀 View 2: Ready to Upload (READY Status Only)

**Purpose:** Filter view showing only videos with `status: ready` — ready for n8n to download and upload to YouTube. Sorted newest first.

**Location in Obsidian:** Create a file called `vault/StPeteMusic/YouTube/Ready for Upload.md` and insert this query:

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

### Why This View?

- **n8n watches this view** to know which videos are ready for upload
- You can click the Google Drive Link to verify the video before upload
- Status will auto-update to "processing" → "published" when n8n processes it
- If upload fails, status changes to "failed" for you to review

---

## 📋 Additional Helpful Queries

### By Date (Week View)

```dataview
TABLE WITHOUT ID
  file.link as "Video",
  bandName as "Band",
  postDate as "Date",
  status as "Status"
FROM "StPeteMusic/YouTube/Shorts"
WHERE type = "youtube-short" AND postDate >= today - 7
SORT postDate DESC
```

### By Band (Grouped)

```dataview
TABLE WITHOUT ID
  file.link as "Video",
  postDate as "Date",
  status as "Status"
FROM "StPeteMusic/YouTube/Shorts"
WHERE type = "youtube-short"
GROUP BY bandName
SORT bandName
```

### Stats Summary

```dataview
LIST LENGTH(rows) as "Total Videos"
FROM "StPeteMusic/YouTube/Shorts"
WHERE type = "youtube-short"
GROUP BY status
```

Shows: `Total Videos by Status`

---

## 🔄 Field Reference

### YAML Frontmatter (for filtering)

| Field | Type | Example | Filterable |
|-------|------|---------|------------|
| `type` | text | `youtube-short` | ✅ |
| `status` | text | `draft`, `ready`, `published` | ✅ |
| `bandName` | text | `Bad Wolf` | ✅ |
| `bandInstagram` | text | `@bad_wolf_band` | ✅ |
| `postDate` | date | `2026-03-15` | ✅ |
| `postTime` | text | `11:00 AM` | ✅ |
| `platform` | text | `YouTube` | ✅ |
| `eventType` | text | `Music` | ✅ |

### Inline Fields (in markdown body)

Use these in queries when you want to reference them:

```
bandName:: Band Name
status:: draft
postDate:: 2026-03-15
mediaLink:: https://drive.google.com/...
```

---

## 🎯 How to Use

### Add This to Your Vault Structure

Create these files in Obsidian:

```
vault/
├── StPeteMusic/
│   └── YouTube/
│       ├── Shorts/                    (folder for individual short files)
│       │   ├── 03.05.2026 | Bad Wolf @bad_wolf.md
│       │   ├── 03.06.2026 | Wandering Hearts @wandering_hearts.md
│       │   └── ...
│       ├── Shorts Dashboard.md        (View 1 - all videos grouped by status)
│       └── Ready for Upload.md        (View 2 - only "ready" status)
```

### Workflow

1. **n8n Chat triggers workflow** → New short file created in `/Shorts/` folder
2. **You manually add:**
   - Google Drive link to `mediaLink` field
   - Any caption edits
3. **Change status to `ready`**
4. **n8n watches `Ready for Upload.md`** → Downloads video, uploads to YouTube
5. **n8n updates status** → `processing` → `published` (or `failed`)

---

## 🛠️ Common Queries

### Find All Videos by a Specific Band

```dataview
TABLE WITHOUT ID
  file.link as "Video",
  postDate as "Date",
  status as "Status"
FROM "StPeteMusic/YouTube/Shorts"
WHERE type = "youtube-short" AND bandName = "Bad Wolf"
SORT postDate DESC
```

### Find All Failed Uploads

```dataview
TABLE WITHOUT ID
  file.link as "Video",
  bandName as "Band",
  status as "Status"
FROM "StPeteMusic/YouTube/Shorts"
WHERE type = "youtube-short" AND status = "failed"
SORT postDate DESC
```

### Find Videos Without Media Links (Incomplete)

```dataview
TABLE WITHOUT ID
  file.link as "Video",
  bandName as "Band",
  status as "Status"
FROM "StPeteMusic/YouTube/Shorts"
WHERE type = "youtube-short" AND !mediaLink
SORT postDate DESC
```

---

## 📌 Dataview Syntax Cheat Sheet

| Syntax | Meaning | Example |
|--------|---------|---------|
| `WHERE x = y` | Exact match | `WHERE status = "ready"` |
| `WHERE x AND y` | Both conditions | `WHERE type = "youtube-short" AND status = "ready"` |
| `WHERE !x` | Not set/empty | `WHERE !mediaLink` |
| `WHERE x >= date` | Date comparison | `WHERE postDate >= today - 7` |
| `SORT x DESC` | Sort descending | `SORT postDate DESC` |
| `GROUP BY x` | Group results | `GROUP BY status` |
| `TABLE x as "Name"` | Select columns | `TABLE bandName as "Band"` |

---

## ✅ Next Steps

1. **Copy the n8n workflow** → Import `youtube-shorts-tracker-creator.json` into n8n
2. **Create Obsidian folder structure** → `/StPeteMusic/YouTube/Shorts/`
3. **Add the two dashboard files** → `Shorts Dashboard.md` and `Ready for Upload.md`
4. **Paste queries** → Into those dashboard files
5. **Test the workflow** → Chat in n8n with YouTube Short info
6. **Monitor the `Ready for Upload` view** → Add Google Drive links and change status to "ready"
7. **Build the upload workflow** → (Next phase) Create workflow that watches this view and uploads to YouTube

---

**Questions about Dataview?** Refer to the [official Dataview docs](https://blacksmithgu.github.io/obsidian-dataview/)
