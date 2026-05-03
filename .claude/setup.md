---
topic: setup
triggers: setup, direnv, env, pre-commit, install, first-time, scripts/setup.sh, envrc, hooks
updated: 2026-05-02
---

# Setup & Environment Isolation

## First-Time Setup

Run the setup script to install dependencies and validate configuration:

```bash
bash scripts/setup.sh
```

This will:
1. ✅ Check direnv is installed (or guide you to install it)
2. ✅ Load `.envrc` to isolate environment
3. ✅ Validate `.env` file with your credentials
4. ✅ Verify AWS credentials are configured
5. ✅ Validate Terraform syntax
6. ✅ Validate n8n workflow JSON
7. ✅ Check Docker is available

## direnv (.envrc)

When you `cd` into this directory, direnv automatically:
- Unsets problematic global env vars (like `AWS_WEB_IDENTITY_TOKEN_FILE` from PSD projects)
- Sets `AWS_PROFILE=personal` for AWS CLI
- Loads your local `.env` file

**Setup direnv:**
```bash
brew install direnv
# Add to ~/.zshrc (or ~/.bashrc):
# eval "$(direnv hook zsh)"
# Then reload shell: exec zsh
```

**Allow direnv in this project:**
```bash
direnv allow
```

## Pre-Commit Hooks

Git hooks automatically prevent:
- ❌ Committing AWS credentials (AKIA keys)
- ❌ Committing `.env` file
- ❌ Bad Terraform syntax
- ❌ Private keys
- ❌ Large files

**Install pre-commit hooks:**
```bash
pip install pre-commit
pre-commit install
```

**Run manually to test:**
```bash
pre-commit run --all-files
```
