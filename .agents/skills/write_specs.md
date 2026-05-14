# Skill: write_specs — @orchestrator

## Objective

Transform a vague idea or user request into a clear, actionable technical specification that downstream agents can execute without ambiguity.

---

## Rules of Engagement

- **Always** pause for user approval after writing the spec — do not chain to `@frontend` or `@infra` without explicit "proceed" from the user
- Save the final approved spec to `production_artifacts/specs/[feature-kebab-name].md`
- If the spec requires DB changes, tag the relevant schema tables from `packages/db/src/schema.ts`
- If the spec requires infra changes, note whether OpenTofu changes are needed
- If the spec involves content or social, note which agents (`@content_writer`, `@social_manager`) are downstream

---

## Instructions

1. **Read the user's request carefully.** Identify: what problem this solves, who uses it, what success looks like.

2. **Explore existing code before speccing new code.** Check:
   - `packages/db/src/schema.ts` — does a relevant table already exist?
   - `apps/admin/src/app/dashboard/` — does a relevant admin page exist?
   - `apps/web/src/app/` — does a relevant web page exist?
   - `apps/admin/src/app/api/` — does a relevant API endpoint exist?

3. **Write the spec** with these sections:
   - **Context** — what problem this solves and why now
   - **User Story** — who does what and what they get
   - **Acceptance Criteria** — numbered list, each testable
   - **Technical Approach** — which files to create/modify, which DB tables, which API endpoints
   - **Agent Chain** — which agents execute which parts, in what order
   - **Out of Scope** — what this spec explicitly does NOT cover

4. **Save to** `production_artifacts/specs/[feature-kebab-name].md`

5. **Present to user for approval.** Show the spec inline. Ask: "Ready to proceed with this spec?"

6. **Only after approval:** trigger the appropriate downstream agent.

---

## Approval Gate

```
@orchestrator: Here is the spec for [feature name]:

[spec content]

---
Ready to proceed? Reply "proceed" to start implementation, or provide feedback.
```
