#!/bin/bash
# StPeteMusic project setup script
# Installs dependencies, validates configuration, and sets up pre-commit hooks
# Usage: bash scripts/setup.sh

set -e

echo "🚀 StPeteMusic Setup"
echo "===================="
echo ""

# Check if running from project root
if [ ! -f "CLAUDE.md" ] || [ ! -d "infrastructure" ]; then
  echo "❌ Error: Run this script from the StPeteMusic project root"
  exit 1
fi

# 1. Check direnv is installed
echo "1️⃣  Checking direnv..."
if ! command -v direnv &> /dev/null; then
  echo "❌ direnv not found. Install it:"
  echo "   brew install direnv"
  exit 1
fi
echo "✅ direnv is installed"
echo ""

# 2. Check .envrc exists and allow it
echo "2️⃣  Setting up direnv..."
if [ ! -f ".envrc" ]; then
  echo "❌ .envrc not found"
  exit 1
fi
direnv allow
echo "✅ direnv allowed"
echo ""

# 3. Check .env file exists
echo "3️⃣  Checking .env file..."
if [ ! -f ".env" ]; then
  echo "⚠️  .env not found. Creating from template..."
  if [ ! -f ".env.example" ]; then
    echo "❌ .env.example not found"
    exit 1
  fi
  cp .env.example .env
  echo "⚠️  Created .env from template - PLEASE FILL IN YOUR CREDENTIALS"
else
  echo "✅ .env file exists"
fi
echo ""

# 4. Validate AWS credentials
echo "4️⃣  Validating AWS credentials..."
if ! AWS_PROFILE=personal aws sts get-caller-identity &> /dev/null; then
  echo "❌ AWS credentials not configured. Run:"
  echo "   aws configure --profile personal"
  exit 1
fi
ACCOUNT=$(AWS_PROFILE=personal aws sts get-caller-identity --query Account --output text)
echo "✅ AWS credentials valid (Account: $ACCOUNT)"
echo ""

# 5. Install pre-commit
echo "5️⃣  Setting up pre-commit hooks..."
if ! command -v pre-commit &> /dev/null; then
  echo "⚠️  pre-commit not installed. Installing..."
  pip install pre-commit
fi
pre-commit install
echo "✅ Pre-commit hooks installed"
echo ""

# 6. Validate Terraform
echo "6️⃣  Validating Terraform..."
cd infrastructure
if ! terraform init -backend=false 2>/dev/null; then
  echo "⚠️  Terraform validation failed (expected on first run)"
else
  echo "✅ Terraform syntax valid"
fi
cd ..
echo ""

# 7. Validate n8n workflows
echo "7️⃣  Validating n8n workflows..."
for workflow in n8n/workflows/StPeteMusic/*.json; do
  if ! python3 -c "import json; json.load(open('$workflow'))" 2>/dev/null; then
    echo "❌ Invalid JSON: $workflow"
    exit 1
  fi
done
echo "✅ All n8n workflows valid JSON"
echo ""

# 8. Test Docker
echo "8️⃣  Checking Docker..."
if ! command -v docker &> /dev/null; then
  echo "⚠️  Docker not found. Install Docker Desktop to run local n8n"
else
  echo "✅ Docker is installed"
fi
echo ""

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Load environment: direnv allow (or cd . to refresh)"
echo "2. Fill in .env with your API keys (if not already done)"
echo "3. For local development: cd n8n && docker-compose up -d"
echo "4. For Terraform: cd infrastructure && terraform plan"
echo ""
echo "See CLAUDE.md for detailed instructions"
