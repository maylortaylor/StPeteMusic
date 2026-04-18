# CHANGES.md — AI-Assisted Session History

Tracks significant changes made with AI (Claude Code) assistance. Newest entries first.

Each entry captures: session goal, files changed, and manual follow-up steps.

---

## 2026-04-18 — AWS Amplify CI/CD Setup

**Session goal:** Wire up AWS Amplify for Next.js hosting + CI/CD branch workflow + test infrastructure

**Context:** Domain `stpetemusic.live` registered on Cloudflare. AWS billing enabled.
Previous plan was Vercel — switched to AWS Amplify (SSR mode) to keep everything AWS-native.

### Files Created

| File | Purpose |
|---|---|
| `amplify.yml` | Amplify build spec — installs from root, builds apps/web |
| `infrastructure/amplify.tf` | AWS Amplify app + main + develop branches via Terraform |
| `.github/workflows/web-ci.yml` | PR quality gate — lint, typecheck, test on apps/web changes |
| `apps/web/vitest.config.ts` | Vitest config with jsdom + React plugin + @ path alias |
| `apps/web/src/test/setup.ts` | Test environment stubs (matchMedia, IntersectionObserver, ResizeObserver) |
| `apps/web/src/test/Nav.test.tsx` | Nav component smoke tests |
| `apps/web/src/test/Footer.test.tsx` | Footer component smoke tests |
| `apps/web/src/test/NewsletterSignup.test.tsx` | NewsletterSignup form + API tests |
| `CHANGES.md` | This file — AI session history |

### Files Modified

| File | Change |
|---|---|
| `apps/web/package.json` | Added `test`, `test:watch` scripts + vitest devDependencies |
| `infrastructure/variables.tf` | Added `github_token` variable (sensitive) |
| `infrastructure/outputs.tf` | Added Amplify app ID + URL outputs |
| `.github/workflows/terraform-plan.yml` | Added `TF_VAR_github_token` env var |
| `.github/workflows/terraform-apply.yml` | Added `TF_VAR_github_token` env var |
| `.github/dependabot.yml` | Added npm ecosystem tracking for `apps/web` |
| `CLAUDE.md` | Added Web App table + Branch Workflow sections |
| `ROADMAP.md` | Replaced Vercel with AWS Amplify; updated domain to stpetemusic.live |

### Manual Steps Matt Must Complete

- [ ] Create GitHub PAT (`repo` scope) → add as `GH_TOKEN_AMPLIFY` GitHub Secret
- [ ] Add `TF_VAR_github_token` to GitHub Actions → `terraform-plan.yml` + `terraform-apply.yml`
- [ ] Merge PR to `main` → Terraform Apply creates Amplify app
- [x] After apply: Amplify app ID = `d1fjwgk99cbqor` → add as `AMPLIFY_APP_ID` GitHub Secret
- [x] In Amplify console → `stpetemusic-web` → env vars set:
  - `LISTMONK_USERNAME` = `st-pete-music-admin`, `LISTMONK_PASSWORD`, `LISTMONK_API_URL`, `LISTMONK_LIST_ID`
- [ ] Trigger first build: push empty commit to `develop` or click "Run job" in Amplify console
- [ ] Set branch protection on `main` and `develop` in GitHub Settings → Branches
- [ ] After first Amplify build: verify staging URL + production URL load correctly
- [ ] Register `stpetemusic.live` nameservers point to Cloudflare (if not already)
- [ ] After confirming Amplify works: uncomment `aws_amplify_domain_association` in `amplify.tf` and re-apply

---

## 2026-04-17 — Frontend Scaffold

**Session goal:** Scaffold Next.js 14 frontend + Tailwind design system + newsletter API

### Files Created
- `apps/web/` — Next.js 14 App Router, Tailwind, brand design system
- Pages: `/` (landing), `/events` (stub), `/discover` (stub)
- Components: Nav, Hero, YouTubeGrid, EventsTeaser, NewsletterSignup, Footer, AnimateIn, dividers
- `apps/web/src/app/api/newsletter/subscribe/route.ts` → Listmonk
- `docker-compose.dev.yml` — PostgreSQL 16 + Listmonk for local dev
- `packages/types/src/index.ts` — shared TypeScript interfaces
- `DESIGN.md` — complete StPeteMusic design system
