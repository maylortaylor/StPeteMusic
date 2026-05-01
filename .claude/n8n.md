---
topic: n8n
triggers: n8n, workflow, automation, obsidian, youtube, instagram, facebook, social post, posting
updated: 2026-04-30
---

# n8n Workflows

**Active workflows only**: `n8n/workflows/StPeteMusic/` — do not import from other directories.
**Detailed n8n guidance**: `n8n/CLAUDE.md`

`system-prompt.md` is the source of truth for AI agent instructions — always keep in sync with `systemMessage` field in the workflow JSON.

## obsidian-to-youtube-posting
**File**: `n8n/workflows/StPeteMusic/obsidian-to-youtube-posting.json`
**Trigger**: Manual + scheduled every 4 hours
Reads Obsidian posts with `status: ready`, downloads video from Google Drive, publishes to YouTube and/or Instagram.

Key rules:
- Google Drive files must be **public (shared-by-link)** for IG download
- Instagram scheduling: `published=false` + `scheduled_publish_time` (Unix timestamp from `postDate`)
- `postDate` must be 10 min – 75 days in the future when container is created
- Container status polling: checks `status_code` every 30s until `FINISHED` or `SCHEDULED`
- Videos saved to `~/stpetemusic/n8n/local-files/videos/` → served at `https://n8n.stpetemusic.live/media/<filename>`

## obsidian-post-creator
**File**: `n8n/workflows/StPeteMusic/obsidian-post-creator.json`
Chat-based agent that generates YouTube post metadata and writes drafts to Obsidian.
When updating the system prompt: edit `system-prompt.md` first → sync `systemMessage` in JSON → commit both.

## AI Config
- Default: Anthropic Claude (`CLAUDE_API_KEY_N8N_STPETEMUSIC`)
- Backup: Google Gemini (`N8N_GEMINI_API_KEY`)
- Always use Claude as default in new workflow AI nodes
