# Workflow: content-cycle

**Slash command:** `/content-cycle <event-or-topic>`

## Purpose

Generate a complete multi-platform content bundle from a single prompt, then queue it for publishing via n8n with user approval at each step.

---

## Agent Chain

```
User: /content-cycle <event-or-topic>
  │
  ▼
@content_writer (write_content.md)
  - Loads brand-voice.md + event-types.md
  - Asks for any missing info (band handle, date)
  - Generates bundle: YouTube title/caption/description + IG/FB post + newsletter snippet
  - Saves to production_artifacts/content/
  - PAUSES → User reviews and approves content
  │
  ▼ (after approval)
@workflow_builder (build_workflow.md) [or direct DB insert if social_posts table exists]
  - Queues approved content in n8n obsidian-post-creator workflow
  - OR creates a draft record in social_posts table with status "approved"
  - Confirms the scheduled postDate
```

---

## Approval Gate

After `@content_writer` generates the bundle:
```
@content_writer: Content bundle ready for [event/band].

[bundle preview]

---
Approve to queue for publishing, or provide feedback for revisions.
```

User must say "approved" or "queue it" to trigger `@workflow_builder`.

---

## How to Invoke

```
/content-cycle Final Friday May 30 with Beach Terror, The Wanderers, and Ava Iri
/content-cycle Instant Noodles June 25
/content-cycle Second Saturday Art Walk July 12
/content-cycle Beach Terror show on June 14 @beach_terror
```

---

## Output Locations

| Artifact | Location |
|----------|---------|
| Content bundle | `production_artifacts/content/[event]-YYYY-MM-DD-bundle.md` |
| Queued in n8n | Obsidian vault draft OR `social_posts` DB table (draft status) |
