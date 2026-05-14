# Skill: build_workflow — @workflow_builder

## Objective

Create, modify, and maintain n8n workflows for social media automation, content publishing, event syncing, and AI-powered content generation.

---

## Rules of Engagement

- **Never expose credentials in workflow JSON** — use n8n credential names: `Anthropic Claude (Default)`, `Google Gemini (Backup)`, `YouTube OAuth`, `Facebook/Instagram`
- **Always validate JSON** before saving: `python3 -c "import json; json.load(open('workflow.json')); print('Valid')"`
- **System prompt sync rule:** Edit `system-prompt.md` first, then sync `systemMessage` field in workflow JSON. Commit both files together.
- **Never hardcode OBSIDIAN_HOST** — always use `{{ $env.OBSIDIAN_HOST }}` in Obsidian HTTP nodes
- **Default AI model:** `Anthropic Claude (Default)` credential — use Gemini only when explicitly specified
- **Source of truth for brand voice:** `.agents/context/brand-voice.md` — use this when writing or updating system prompts

---

## Active Workflows

All in `n8n/workflows/StPeteMusic/`:

| File | Purpose | AI Used |
|------|---------|---------|
| `obsidian-post-creator.json` | Chat agent → YouTube post metadata → Obsidian draft | Claude |
| `obsidian-to-youtube-posting.json` | Obsidian draft → YouTube publish | Claude |
| `newsletter-draft-creator.json` | Chat agent → HTML newsletter body | Claude |
| `newsletter-publisher.json` | Newsletter HTML → Listmonk campaign | Claude |
| `gcal-to-db-sync.json` | Google Calendar events → RDS database | None |
| `spm-multi-gcal-to-db-sync.json` | Multi-calendar sync | None |
| `venue-events-sync.json` | Venue Facebook events → RDS (triggered by admin webhook) | None |
| `youtube-shorts-tracker-creator.json` | Shorts tracking + creation prompts | Gemini |

---

## Instructions

### Building a New Workflow

1. **Read existing workflows** as templates — start from a similar one rather than from scratch
2. **Map the flow:**
   - Trigger type: Manual, Webhook, Schedule, or Chat
   - Data sources: n8n HTTP Request nodes, DB connection, Obsidian
   - AI nodes: which model, what system prompt (reference brand-voice.md)
   - Output: Obsidian write, DB upsert, API publish, or file
3. **Build the workflow JSON** using existing node patterns from similar workflows
4. **Write or update the system prompt** in a `.md` file if AI nodes are involved
5. **Validate:** `python3 -c "import json; json.load(open('workflow.json')); print('Valid')"`
6. **Save to** `n8n/workflows/StPeteMusic/[workflow-name].json`
7. **Update** `n8n/CLAUDE.md` active workflows table if adding a new workflow
8. **Deploy to production:**

```bash
scp -i ~/.ssh/stpetemusic-n8n.pem -r \
  ./n8n/workflows/StPeteMusic/ \
  ec2-user@n8n.stpetemusic.live:~/stpetemusic/n8n/workflows/
```

### Updating System Prompts

1. Edit the `.md` file (e.g., `system-prompt.md` or `newsletter-system-prompt.md`)
2. Copy the updated content into the `systemMessage` field of the relevant AI node in the workflow JSON
3. Validate JSON
4. Commit both the `.md` and `.json` files together
5. Re-import workflow in n8n UI if testing locally

### OAuth Redirect URI (for credential setup)

```
https://n8n.stpetemusic.live/rest/oauth2-credential/callback
```

---

## Key Integration Variables

| Variable | Used In | Value |
|----------|---------|-------|
| `OBSIDIAN_HOST` | All Obsidian nodes | `http://host.docker.internal:27123` (local) / Tailscale IP (prod) |
| `N8N_VENUE_SYNC_WEBHOOK_URL` | venue-events-sync trigger | Webhook URL from n8n |
| `CLAUDE_API_KEY_N8N_STPETEMUSIC` | Claude credential | Set in n8n credential store |
| `N8N_GEMINI_API_KEY` | Gemini credential | Set in n8n credential store |
