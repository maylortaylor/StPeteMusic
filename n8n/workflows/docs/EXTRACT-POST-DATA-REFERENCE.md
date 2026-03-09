# Extract Post Data Node - Reference

## What It Does

The "Extract Post Data" node reads the Obsidian API response and extracts all frontmatter fields into usable variables for the YouTube posting workflow.

---

## Input (From Obsidian API)

```json
{
  "frontmatter": {
    "title": "YT Post - 2026-02-19",
    "type": "content",
    "status": "draft",
    "platform": "YT",
    "band-name": "Harlow Gold",
    "band-username-ig": "@o.g.harlow",
    "publish-date": "2026-02-19",
    "publish-time": "11:00 AM",
    "caption": "🎸 02.27 @o.g.harlow at @Suite.E.Studios",
    "hashtags": "#StPeteMusic #SuiteEStudios #StPeteFL #TampaBay #FinalFriday",
    "mentions": "@StPeteMusic,@suite.e.studios,@o.g.harlow",
    "yt-tags": "stpetemusic, suite e studios, live music, st pete, final friday, harlow gold",
    "yt-playlist": "https://www.youtube.com/watch?v=...",
    "media-link": "",
    "media-type": "Video",
    "privacy-status": "unlisted",
    "ai-generated": true
  },
  "content": "---\ntitle: ...\n---\n\n# YouTube Post Draft\n...",
  "path": "StPeteMusic/Content/Drafts/YT/03.04.2026.md"
}
```

---

## Output (Extracted Data)

The node extracts and returns:

| Field | Source | Example |
|-------|--------|---------|
| `filePath` | `$json.path` | `StPeteMusic/Content/Drafts/YT/03.04.2026.md` |
| `fileName` | `$json.name` | `03.04.2026.md` |
| `title` | `frontmatter.title` | `YT Post - 2026-02-19` |
| `caption` | `frontmatter.caption` | `🎸 02.27 @o.g.harlow at @Suite.E.Studios` |
| `platform` | `frontmatter.platform` | `YT` |
| `bandName` | `frontmatter.band-name` | `Harlow Gold` |
| `bandUsernameIG` | `frontmatter.band-username-ig` | `@o.g.harlow` |
| `postDate` | `frontmatter.publish-date` | `2026-02-19` |
| `postTime` | `frontmatter.publish-time` | `11:00 AM` |
| `youtubePlaylist` | `frontmatter.yt-playlist` | `https://www.youtube.com/watch?v=...` |
| `youtubeTags` | `frontmatter.yt-tags` | `stpetemusic, suite e studios, live music, ...` |
| `mediaUrl` | `frontmatter.media-link` | `` (empty if not set) |
| `mediaType` | `frontmatter.media-type` | `Video` |
| `hashtags` | `frontmatter.hashtags` | `#StPeteMusic #SuiteEStudios #StPeteFL #TampaBay #FinalFriday` |
| `mentions` | `frontmatter.mentions` | `@StPeteMusic,@suite.e.studios,@o.g.harlow` |
| `privacyStatus` | `frontmatter.privacy-status` | `unlisted` |
| `status` | `frontmatter.status` | `draft` or `ready` |
| `aiGenerated` | `frontmatter.ai-generated` | `true` / `false` |
| `originalContent` | `$json.content` | Full markdown with YAML frontmatter |

---

## How It Filters

**Only processes posts with `status: "ready"`**

If status is not "ready", the node returns `null` and the post is skipped by the workflow.

---

## Downstream Usage

The extracted data flows to:

### Platform Check
- Uses `platform` field to route to correct platform handler
- Currently routes YouTube posts to "Post to YouTube" node

### Post to YouTube
- Uses: `title`, `caption`, `youtubeTags`, `privacyStatus`
- Sends to YouTube API v3

### Update Obsidian Status
- Uses: `filePath`, `originalContent`
- Updates post status to "published" after successful posting

---

## Example Workflow

```
Obsidian API Response
    ↓
Extract Post Data
    ↓
    ├─ Filter: status == "ready"?
    │
    ├─ YES → Platform Check
    │         ├─ Is YT? → Post to YouTube
    │         │           ↓
    │         │      Update Obsidian Status (published)
    │         │
    │         └─ Not YT? → Skip
    │
    └─ NO → Skip (return null)
```

---

## Debugging

If a post isn't being posted, check:

1. **Status Field**: Is it exactly `ready`? (not "Ready", not "READY")
2. **Platform Field**: Is it `YT`? (case-sensitive)
3. **YouTube Tags**: Are they comma-separated?
4. **Media Link**: Can be empty, but other fields should be filled

Example of a "ready to post" file:
```yaml
---
status: ready
platform: YT
yt-tags: stpetemusic, suite e studios, live music
caption: 🎸 02.27 @o.g.harlow at @Suite.E.Studios
---
```
