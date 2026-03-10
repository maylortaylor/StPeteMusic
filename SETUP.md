# StPeteMusic Project Setup Guide

## Quick Start (3 steps)

1. **Run setup script:**
   ```bash
   bash scripts/setup.sh
   ```

2. **Allow direnv:**
   ```bash
   direnv allow
   ```

3. **Verify everything works:**
   ```bash
   make validate-config
   ```

Done! Your environment is isolated and protected.

---

## What Was Installed

### 1. direnv (.envrc)
Auto-isolates your environment when you cd into this directory.

**Why?** Prevents global env vars from PSD/amver projects from leaking in.

**Install direnv (one-time):**
```bash
brew install direnv
```

Then add to your shell config (~/.zshrc or ~/.bashrc):
```bash
eval "$(direnv hook zsh)"
```

Reload shell:
```bash
exec zsh
```

### 2. Pre-Commit Hooks (.pre-commit-config.yaml)
Prevents committing secrets, bad code, or misconfigured infrastructure.

**Runs automatically before every commit to catch:**
- ❌ AWS credentials (AKIA keys)
- ❌ .env files with secrets
- ❌ Private keys (*.pem, *.key)
- ❌ Bad Terraform syntax
- ❌ Invalid JSON workflows
- ❌ Large files

**Install (one-time):**
```bash
pip install pre-commit
pre-commit install
```

**Test manually:**
```bash
pre-commit run --all-files
```

### 3. Setup Script (scripts/setup.sh)
Validates your environment is clean and properly configured.

**Run any time to verify:**
```bash
bash scripts/setup.sh
```

Checks:
- ✅ direnv installed
- ✅ .env file exists with credentials
- ✅ AWS credentials valid
- ✅ Terraform syntax valid
- ✅ n8n workflows valid JSON
- ✅ Docker installed

### 4. Makefile
Common commands at your fingertips.

**View all commands:**
```bash
make help
```

**Useful commands:**
```bash
make dev              # Start local n8n
make dev-down         # Stop local n8n
make tf-plan          # Preview infrastructure changes
make tf-apply         # Apply infrastructure changes
make check-server     # Check if production is online
make restart-server   # Restart production server
make ssh              # SSH into production
make validate-config  # Validate all configs
```

---

## Daily Workflow

### Working in this project

```bash
cd ~/Documents/_dev/maylortaylor/StPeteMusic

# direnv auto-loads environment
# Your AWS_PROFILE is automatically set to "personal"
# Global env vars from other projects are automatically unset
```

### Making changes

```bash
# Edit workflows, Terraform, or code

git add .
git commit -m "feat: add new workflow"

# Pre-commit hooks run automatically:
# ✅ Validates no secrets are leaked
# ✅ Validates Terraform syntax
# ✅ Validates workflow JSON
# ✅ If all checks pass, commit succeeds
```

### Testing changes

```bash
# Local n8n
make dev
open http://localhost:5678

# Terraform
make tf-plan

# Run checks
make validate-config
```

---

## Environment Variables

Your environment is isolated by direnv (.envrc).

**When you cd into this directory:**
- ✅ `AWS_PROFILE` is set to `personal`
- ✅ `.env` is loaded (contains your secrets)
- ✅ Problematic global vars are unset:
  - `AWS_WEB_IDENTITY_TOKEN_FILE` (PSD)
  - `DATABASE_URL` (PSD)
  - `KEYCLOAK_ISSUER` (PSD)
  - `NEXT_PUBLIC_AMVER_*` (PSD)

**Your .env file:**
- Contains all your API keys and secrets
- Is git-ignored (never committed)
- Loaded automatically by direnv
- Template provided in `.env.example`

---

## Troubleshooting

### "AWS credentials not working"
```bash
# Reload environment
direnv allow
cd .

# Verify
AWS_PROFILE=personal aws sts get-caller-identity
```

### "Pre-commit hook failed"
The hook is protecting you! It found a potential issue.

**Review the output** and fix:
- Remove secrets/API keys from code
- Fix Terraform syntax
- Check JSON validity

Then commit again.

### "n8n server not responding"
```bash
make check-server   # Check AWS status

# Quick restart
make restart-server

# Full restart (if reboot doesn't work)
make ssh            # SSH into server
docker-compose restart n8n
```

### "terraform plan fails"
```bash
cd infrastructure
terraform init -reconfigure
terraform plan
```

---

## Next Steps

1. **Local Development:**
   ```bash
   make dev
   open http://localhost:5678
   ```

2. **Test a workflow:**
   - Import a workflow from `n8n/workflows/StPeteMusic/`
   - Test locally
   - Push to production via GitHub PR

3. **Make infrastructure changes:**
   ```bash
   cd infrastructure
   terraform plan     # Review changes
   terraform apply    # Apply (or use PR)
   ```

---

## Key Files

| File | Purpose |
|------|---------|
| `.envrc` | direnv config — auto-isolates environment |
| `.pre-commit-config.yaml` | Pre-commit hooks — prevents secrets from leaking |
| `scripts/setup.sh` | Setup validation script |
| `Makefile` | Common commands |
| `CLAUDE.md` | Detailed guidance for Claude Code (AI) |
| `README.md` | Project overview |
| `.env.example` | Template for secrets (copy to .env) |

---

## One-Time Setup Checklist

- [ ] Ran `bash scripts/setup.sh` and saw ✅ for all checks
- [ ] Installed direnv: `brew install direnv`
- [ ] Added direnv hook to ~/.zshrc
- [ ] Ran `direnv allow`
- [ ] Ran `pre-commit install`
- [ ] Created .env from .env.example with your API keys
- [ ] Verified: `AWS_PROFILE=personal aws sts get-caller-identity`

Done! Your environment is now protected and isolated.

---

*For detailed information, see CLAUDE.md and README.md*
