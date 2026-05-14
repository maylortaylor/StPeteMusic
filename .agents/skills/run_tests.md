# Skill: run_tests — @qa

## Objective

Ensure all code changes are tested, correct, and safe to ship. Catch bugs before production, and never let a migration break the schema.

---

## Rules of Engagement

- Must achieve ≥75% test coverage on all modified files
- Never mark tests as passing when Playwright E2E fails
- Always validate Drizzle migrations for breaking changes before approving
- Run all tests from monorepo root using `pnpm` commands
- Co-locate test files next to source: `Component.tsx` → `Component.test.ts`

---

## Test Commands

```bash
# Run all tests (from monorepo root)
pnpm test

# Watch mode
pnpm test -- --watch

# Coverage report
pnpm test:coverage

# Type checking (all apps)
pnpm typecheck

# Lint
pnpm lint

# Full CI check (what GitHub Actions runs)
pnpm ci:local
```

---

## Instructions

### Standard Test Run

1. **Run** `pnpm test` from monorepo root
2. **Check coverage** against the 75% threshold for modified files
3. **Report** test results: pass/fail counts, coverage percentages, any failures

### Migration Safety Check

Before approving any DB change in `packages/db/src/schema.ts`:

1. Verify no existing columns are being removed or renamed — breaking changes require a migration plan
2. Verify new NOT NULL columns have a default value or are added as nullable first
3. Check that new tables don't conflict with existing table names
4. Verify foreign key relationships are consistent

```bash
# Check for drift between schema and DB
pnpm --filter @stpetemusic/db db:check

# Generate migration file
pnpm --filter @stpetemusic/db db:generate

# Apply to local dev DB
pnpm --filter @stpetemusic/db db:push
```

### Playwright E2E Tests

```bash
# Run E2E tests
pnpm test:e2e

# Run specific test file
pnpm test:e2e -- --grep "content calendar"

# UI mode (debug)
pnpm test:e2e -- --ui
```

### Writing New Tests

Follow these patterns:
- **Component tests:** Use React Testing Library, query by role/label (not test IDs)
- **API tests:** Use Vitest with mock Drizzle clients; test happy path + error cases
- **Coverage:** Focus on branch coverage, not just line coverage
- **Mocking:** Mock external APIs (GA4, n8n webhooks, Listmonk); never mock the Drizzle DB client

```ts
// Component test pattern
import { render, screen } from '@testing-library/react';
import { PostCard } from './PostCard';

describe('PostCard', () => {
  it('shows draft status badge', () => {
    render(<PostCard post={{ ...mockPost, status: 'draft' }} />);
    expect(screen.getByRole('status')).toHaveTextContent('Draft');
  });

  it('shows approval button when status is pending_approval', () => {
    render(<PostCard post={{ ...mockPost, status: 'pending_approval' }} />);
    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
  });
});
```

### Test Report Format

```
@qa: Test results for [feature name]

✅ Vitest: [X] passed, [Y] failed
📊 Coverage: [X]% on modified files ([status vs 75% threshold])
🔍 TypeScript: [pass/fail]
🎭 Playwright: [X] passed, [Y] failed (or "not run")

[If failures: list specific failing tests and the error]

[If coverage below 75%: list which files need more tests]

Ready to merge: [YES / NO — reason if no]
```
