# YouTube Shorts Tracker - Quick Reference

## 🚀 Quick Start (30 seconds)

1. **In n8n Chat:** Send info about a YouTube Short
2. **File created:** `vault/StPeteMusic/YouTube/Shorts/MM.dd.yyyy | Band @IG.md`
3. **In Obsidian:** Add Google Drive link + change status to "ready"
4. **Dashboards update:** Show in "All Videos" and "Ready for Upload" views
5. **Next phase:** n8n downloads & uploads to YouTube

---

## 📁 File Structure

```
/StPeteMusic/YouTube/
├── Shorts/                          ← New short files here
│   ├── 03.06.2026 | Bad Wolf @bad_wolf_band.md
│   └── 03.07.2026 | Wandering Hearts @wandering_hearts.md
├── Shorts Dashboard.md              ← View all by status
└── Ready for Upload.md              ← Only "ready" videos
```

---

## 💬 How to Create a Short in n8n Chat

Send something like:

```
Create YouTube Short:
Band: Bad Wolf @bad_wolf_band
Date: 03.06.2026
Caption: 🎸 Bad Wolf bringing the energy at Final Friday
Tags: #FinalFriday #StPeteMusic @suite.e.studios
```

✅ File created automatically in Obsidian

---

## ✏️ How to Update a Short

### In Obsidian:

1. Open the file
2. Find `mediaLink::` → Add Google Drive link
3. Find `status: draft` → Change to `status: ready`
4. Save

✅ Appears in "Ready for Upload" dashboard

---

## 🗓️ Statuses

| Status | Meaning | Next Step |
|--------|---------|-----------|
| `draft` | New, still editing | Add mediaLink + edit |
| `ready` | Approved & linked | Wait for n8n Phase 2 |
| `processing` | Uploading to YouTube | Wait... |
| `published` | Live on YouTube | Done! ✅ |
| `failed` | Upload failed | Check error, try again |

---

## 📊 Dashboard Commands

### View 1: All Videos (Grouped by Status)

Open: `Shorts Dashboard.md`

Shows: All videos organized by status, newest first

### View 2: Ready to Upload

Open: `Ready for Upload.md`

Shows: Only `status: ready` videos, newest first

**This is what n8n Phase 2 will watch!**

---

## 🎯 Field Mapping

| What You Input | Where It Goes | Editable |
|---|---|---|
| Band name | `bandName` | ✅ In file |
| Instagram handle | `bandInstagram` | ✅ In file |
| Date | `postDate` | ✅ In file |
| Caption | `caption` | ✅ In file |
| Hashtags | `hashtags` | ✅ In file |
| Mentions | `mentions` | ✅ In file |
| **Google Drive link** | **`mediaLink`** | **✅ Add manually** |
| Status | `status` | ✅ Change in file |

---

## 🔗 Google Drive Link Format

Make sure your Google Drive video is **publicly accessible** and get the share link:

```
https://drive.google.com/file/d/FILE_ID_HERE/view?usp=sharing
```

Add to file as:

```markdown
mediaLink:: [View in Google Drive](https://drive.google.com/file/d/FILE_ID_HERE/view?usp=sharing)
```

---

## 📋 Metadata Tracked

✅ Band name & Instagram
✅ Event date & post time
✅ Caption & hashtags
✅ Mentions & tags
✅ YouTube playlist assignment
✅ Media link (Google Drive)
✅ Creation & status dates
✅ Video type (always Video for Shorts)
✅ Platform (always YouTube)

---

## 🛠️ Common Tasks

### Edit Caption After File Created
- Open file in Obsidian
- Edit `caption:` in frontmatter
- Edit markdown section
- Save

### Change Band Info
- Open file
- Edit frontmatter fields: `bandName`, `bandInstagram`
- Save

### Mark as Ready to Upload
- Open file
- Change `status: draft` → `status: ready`
- Add `mediaLink:: [link](url)`
- Save
- ✅ Appears in "Ready for Upload" dashboard

### Mark as Failed (Retry)
- Open file
- Change `status: failed` → `status: ready`
- Fix any issues
- Save

---

## ⚠️ Important Notes

- **File naming:** `MM.dd.yyyy | Band Name @handle.md` — Auto-generated
- **Dates:** Always `YYYY-MM-DD` format internally
- **Status field:** Must be in BOTH frontmatter AND inline (or query might miss it)
- **Google Drive:** Link must be **public** (shareable link)
- **Hashtags:** Stored as single string: `#Tag1 #Tag2`
- **Mentions:** Stored as array: `@mention1, @mention2`

---

## 🚀 Workflow Files

| File | Purpose |
|------|---------|
| `youtube-shorts-tracker-creator.json` | n8n workflow - creates shorts |
| `YOUTUBE_SHORTS_TRACKER_SETUP.md` | Full setup guide |
| `OBSIDIAN_DATAVIEW_QUERIES.md` | Dataview query reference |
| `YOUTUBE_SHORTS_QUICK_REFERENCE.md` | This file |

---

## 📞 Keyboard Shortcuts (In Obsidian)

- **Ctrl+F:** Search within file
- **Ctrl+Shift+F:** Search all files
- **Cmd+K:** Link files together
- **Cmd+E:** Toggle edit/preview mode

---

## 🎵 Example: Full Workflow

**Step 1 - Create (n8n)**
```
Chat: "Bad Wolf @bad_wolf_band at Final Friday 03.06.2026"
↓
File created: 03.06.2026 | Bad Wolf @bad_wolf_band.md
```

**Step 2 - Update (Obsidian)**
```
Open file
Add: mediaLink:: https://drive.google.com/...
Change: status: draft → status: ready
Save
↓
File appears in "Ready for Upload"
```

**Step 3 - Upload (n8n Phase 2 - Future)**
```
n8n sees status: ready
Downloads video from Google Drive
Uploads to YouTube Shorts
Updates file: status: ready → status: published
YouTube link added to file
```

✅ **Done!** Video is now live on YouTube Shorts.

---

## 💡 Pro Tips

1. **Batch create** multiple shorts at once in n8n chat
2. **Use the dashboards** to see what's pending
3. **Keep captions short** - YouTube Shorts viewers scroll quickly
4. **Double-check** Google Drive links are public before marking ready
5. **Review metadata** before uploading - once published, hard to edit

---

**Questions?** Check:
- `YOUTUBE_SHORTS_TRACKER_SETUP.md` for full instructions
- `OBSIDIAN_DATAVIEW_QUERIES.md` for query examples
- Dataview docs: https://blacksmithgu.github.io/obsidian-dataview/

**Last Updated:** March 5, 2026
