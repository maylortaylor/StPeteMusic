# Workflow: feature-cycle

**Slash command:** `/feature-cycle <idea>`

## Purpose

End-to-end feature development pipeline from vague idea to tested, deployable code. Chains `@orchestrator → @frontend → @qa` with approval gates at each transition.

---

## Agent Chain

```
User: /feature-cycle <idea>
  │
  ▼
@orchestrator (write_specs.md)
  - Explores existing code
  - Writes spec to production_artifacts/specs/
  - PAUSES → User approves spec
  │
  ▼ (after approval)
@frontend (build_feature.md)
  - Reads approved spec
  - Builds feature (web or admin app)
  - Reports files changed + how to test
  │
  ▼
@qa (run_tests.md)
  - Runs pnpm test
  - Checks coverage ≥75%
  - Validates Drizzle migrations (if any)
  - Reports: ready to merge or needs fixes
  │
  ▼ (if infra needed, based on spec)
@infra (manage_infra.md) [CONDITIONAL]
  - Runs tofu plan
  - PAUSES → User approves infra changes
  - Applies
```

---

## Approval Gates

1. **After spec:** User must say "proceed" or provide feedback
2. **After infra plan:** User must say "apply" or provide feedback
3. All other transitions are automatic

---

## How to Invoke

```
/feature-cycle add a content calendar to the admin dashboard
/feature-cycle add a brand voice editor page to admin
/feature-cycle show social analytics on the admin dashboard
```
