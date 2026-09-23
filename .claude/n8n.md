---
topic: n8n
triggers: n8n, workflow, automation, obsidian, youtube, instagram, facebook, social post, posting, google drive, video, reel, publish, linktree
updated: 2026-09-23
---

# n8n

**Live n8n is https://n8n.stpetemusic.live, on the roboBOREALIS services box.** The deploy
source of truth for the live workflows is the platform repo:
`infrastructure/services/n8n/workflows/stpetemusic/` (StPeteMusic keepers) and
`.../shared/` (the linktree API + scraper that feed the site's "Find Us Everywhere").

`n8n/workflows/StPeteMusic/` here is an **archive** of the pre-platform workflows. The audit
that chose the keepers is roboborealis-platform#395. Do not import from here without checking
the platform copy first. The go-live workflow was removed on purpose (roboborealis-platform#472).

`system-prompt.md` files here are still the source for the AI agent prompts, and
`scripts/sync-n8n-prompts.js` (a pre-commit hook) syncs them into the archived JSON.

## AI config

- Default: Anthropic Claude. Backup: Google Gemini.
- Always use Claude as the default in new workflow AI nodes.
