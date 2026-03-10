.PHONY: setup help dev dev-down tf-plan tf-apply tf-validate ssh check-server restart-server

## setup — Run first-time setup
setup:
	@echo "🚀 Running StPeteMusic setup..."
	@bash scripts/setup.sh

## help — Show this help
help:
	@echo "StPeteMusic — Available commands:"
	@echo ""
	@grep -E '^## ' Makefile | sed 's/## //' | column -t -s '-'
	@echo ""

## dev — Start local n8n (Docker)
dev:
	@echo "Starting local n8n..."
	@cd n8n && docker-compose up -d
	@echo "✅ n8n available at http://localhost:5678"

## dev-down — Stop local n8n
dev-down:
	@echo "Stopping local n8n..."
	@cd n8n && docker-compose down

## tf-plan — Show Terraform changes
tf-plan:
	@echo "Planning Terraform changes..."
	@cd infrastructure && terraform plan

## tf-apply — Apply Terraform changes (production!)
tf-apply:
	@echo "⚠️  Applying Terraform changes..."
	@cd infrastructure && terraform apply

## tf-validate — Validate Terraform syntax
tf-validate:
	@echo "Validating Terraform..."
	@cd infrastructure && terraform validate

## ssh — SSH into production server
ssh:
	@echo "Connecting to n8n server..."
	@ssh -i ~/.ssh/stpetemusic-n8n.pem ec2-user@n8n-stpetemusic.duckdns.org

## check-server — Check if production server is online
check-server:
	@echo "Checking n8n server status..."
	@AWS_PROFILE=personal aws ec2 describe-instance-status \
		--instance-ids i-03874197d725b0455 --region us-east-1 | \
		jq '.InstanceStatuses[0] | {State: .InstanceState.Name, Status: .InstanceStatus.Status}'

## restart-server — Restart production server
restart-server:
	@echo "⚠️  Restarting production server..."
	@AWS_PROFILE=personal aws ec2 reboot-instances \
		--instance-ids i-03874197d725b0455 --region us-east-1
	@echo "Reboot initiated. Will take ~1 minute to come back online."

## pre-commit-run — Run pre-commit hooks on all files
pre-commit-run:
	@echo "Running pre-commit hooks..."
	@pre-commit run --all-files

## pre-commit-install — Install pre-commit hooks
pre-commit-install:
	@echo "Installing pre-commit hooks..."
	@pre-commit install

## direnv-allow — Allow direnv in this project
direnv-allow:
	@echo "Allowing direnv..."
	@direnv allow
	@echo "✅ direnv allowed. Reload shell: exec zsh"

## validate-workflows — Check n8n workflows JSON validity
validate-workflows:
	@echo "Validating n8n workflows..."
	@for workflow in n8n/workflows/StPeteMusic/*.json; do \
		if python3 -c "import json; json.load(open('$$workflow'))" 2>/dev/null; then \
			echo "✅ $$workflow"; \
		else \
			echo "❌ $$workflow"; \
			exit 1; \
		fi \
	done

## validate-config — Run full configuration validation
validate-config: tf-validate validate-workflows
	@echo "✅ All configuration valid"
