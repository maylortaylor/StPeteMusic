# Band Extraction Workflow Reference

## What Changed

The workflow now extracts and stores band information from your chat message:
- **bandNameString**: Full band name (e.g., "Beach Terror", "Austen Van Der Bleek")
- **bandUsernameIG**: Instagram username with @ (e.g., "@beach_terror", "@avbleek")

---

## Example Chat Input

```
Create YouTube posts for Beach Terror performing at Suite E on March 27.
Their Instagram is @beach_terror
```

---

## AI Output (JSON)

The AI generates:

```json
{
  "bandNameString": "Beach Terror",
  "bandUsernameIG": "@beach_terror",
  "posts": [
    {
      "caption": "🎸 03.27 @beach_terror at @Suite.E.Studios",
      "platform": "YT",
      "postDate": "2026-03-10",
      "postTime": "11:00 AM",
      "hashtags": "#StPeteMusic #SuiteEStudios #StPeteFL #TampaBay",
      "mentions": ["@StPeteMusic", "@suite.e.studios", "@beach_terror"],
      "eventType": "Music",
      "mediaType": "Video",
      "ytPlaylist": "https://www.youtube.com/...",
      "ytTags": "stpetemusic, suite e studios, live music, st pete",
      "mediaLink": ""
    }
  ]
}
```

---

## Workflow Processing

### Node 1: AI Agent
- Extracts band name from chat message
- Extracts band Instagram handle from chat message (or infers from band name)
- Returns JSON with `bandNameString` and `bandUsernameIG` at top level

### Node 2: Parse AI Output
- Extracts `bandNameString` and `bandUsernameIG` from JSON
- **Passes these to each post** so they're available downstream

### Node 3: JSON to YAML + Template
- Adds to YAML frontmatter:
  ```yaml
  band-name: "Beach Terror"
  band-username-ig: "@beach_terror"
  ```

### Node 4: Write to Obsidian
- Creates file with band info in frontmatter
- Templater displays using:
  ```
  <% tp.frontmatter["band-name"] %>
  <% tp.frontmatter["band-username-ig"] %>
  ```

---

## In Obsidian File

**Frontmatter:**
```yaml
---
band-name: "Beach Terror"
band-username-ig: "@beach_terror"
platform: YT
caption: "🎸 03.27 @beach_terror at @Suite.E.Studios"
mentions: "@StPeteMusic @suite.e.studios @beach_terror"
---
```

**Rendered in Template:**
```
## Band Info - AUTO-FILLED

| Property | Value |
|----------|-------|
| **Band Name** | Beach Terror |
| **Band Instagram** | @beach_terror |
```

---

## Test It

Send a message to the Post Creator workflow:
```
Create a YouTube post for Austen Van Der Bleek performing at Suite E on March 15.
His Instagram is @avbleek
```

Should create a file with:
- `band-name: "Austen Van Der Bleek"`
- `band-username-ig: "@avbleek"`
- Both displayed in the Band Info section
