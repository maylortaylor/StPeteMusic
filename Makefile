.PHONY: setup help dev dev-down tofu-plan tofu-apply tofu-validate ssh ssm docker-ps docker-logs-n8n docker-logs-listmonk ssm-result restart check-server restart-server pre-commit-run pre-commit-install direnv-allow validate-workflows validate-config

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

INSTANCE_ID  := i-03874197d725b0455
AWS_PROFILE  := personal
AWS_REGION   := us-east-1
SSH_KEY      := $(HOME)/.ssh/stpetemusic-n8n.pem
EC2_HOST     := ec2-user@n8n.stpetemusic.live

## tofu-plan — Show OpenTofu infrastructure changes
tofu-plan:
	@echo "Planning OpenTofu changes..."
	@unset AWS_WEB_IDENTITY_TOKEN_FILE && cd infrastructure && AWS_PROFILE=$(AWS_PROFILE) tofu plan -lock=false

## tofu-apply — Apply OpenTofu infrastructure changes (production!)
tofu-apply:
	@echo "Applying OpenTofu changes..."
	@unset AWS_WEB_IDENTITY_TOKEN_FILE && cd infrastructure && AWS_PROFILE=$(AWS_PROFILE) tofu apply

## tofu-validate — Validate OpenTofu syntax
tofu-validate:
	@echo "Validating OpenTofu..."
	@cd infrastructure && tofu validate

## ssh — SSH into production server (needs port 22 open in SG + correct IP)
ssh:
	@echo "Connecting via SSH..."
	@ssh -i $(SSH_KEY) -F /dev/null $(EC2_HOST)

## ssm — Open interactive SSM Session Manager shell (no SSH key or open port needed)
ssm:
	@echo "Opening SSM session..."
	@unset AWS_WEB_IDENTITY_TOKEN_FILE && \
		aws ssm start-session --target $(INSTANCE_ID) \
		--profile $(AWS_PROFILE) --region $(AWS_REGION)

## docker-ps — Check running containers on EC2 via SSM (returns CommandId)
docker-ps:
	@unset AWS_WEB_IDENTITY_TOKEN_FILE && \
		aws ssm send-command \
		--instance-ids $(INSTANCE_ID) \
		--document-name "AWS-RunShellScript" \
		--timeout-seconds 30 \
		--parameters '{"commands":["docker ps --format \"table {{.Names}}\\t{{.Status}}\""]}' \
		--query 'Command.CommandId' --output text \
		--region $(AWS_REGION) --profile $(AWS_PROFILE)
	@echo "Run: make ssm-result CMD=<id above>"

## docker-logs-n8n — Tail n8n logs on EC2 via SSM (returns CommandId)
docker-logs-n8n:
	@unset AWS_WEB_IDENTITY_TOKEN_FILE && \
		aws ssm send-command \
		--instance-ids $(INSTANCE_ID) \
		--document-name "AWS-RunShellScript" \
		--timeout-seconds 30 \
		--parameters '{"commands":["docker logs n8n --tail 50 2>&1"]}' \
		--query 'Command.CommandId' --output text \
		--region $(AWS_REGION) --profile $(AWS_PROFILE)
	@echo "Run: make ssm-result CMD=<id above>"

## docker-logs-listmonk — Tail listmonk logs on EC2 via SSM (returns CommandId)
docker-logs-listmonk:
	@unset AWS_WEB_IDENTITY_TOKEN_FILE && \
		aws ssm send-command \
		--instance-ids $(INSTANCE_ID) \
		--document-name "AWS-RunShellScript" \
		--timeout-seconds 30 \
		--parameters '{"commands":["docker logs stpetemusic-listmonk --tail 50 2>&1"]}' \
		--query 'Command.CommandId' --output text \
		--region $(AWS_REGION) --profile $(AWS_PROFILE)
	@echo "Run: make ssm-result CMD=<id above>"

## ssm-result — Get output of an SSM command. Usage: make ssm-result CMD=<command-id>
ssm-result:
	@unset AWS_WEB_IDENTITY_TOKEN_FILE && \
		aws ssm get-command-invocation \
		--command-id "$(CMD)" \
		--instance-id $(INSTANCE_ID) \
		--query '[Status,StandardOutputContent,StandardErrorContent]' \
		--output text \
		--region $(AWS_REGION) --profile $(AWS_PROFILE)

## restart — Restart all Docker containers on EC2 via SSM (returns CommandId)
restart:
	@echo "Restarting containers via SSM..."
	@unset AWS_WEB_IDENTITY_TOKEN_FILE && \
		aws ssm send-command \
		--instance-ids $(INSTANCE_ID) \
		--document-name "AWS-RunShellScript" \
		--timeout-seconds 120 \
		--parameters '{"commands":["cd /home/ec2-user/stpetemusic/n8n && docker-compose -f docker-compose.prod.yaml --env-file ../.env restart","sleep 10","docker ps"]}' \
		--query 'Command.CommandId' --output text \
		--region $(AWS_REGION) --profile $(AWS_PROFILE)
	@echo "Run: make ssm-result CMD=<id above>"

## check-server — Check EC2 instance status
check-server:
	@echo "Checking EC2 status..."
	@unset AWS_WEB_IDENTITY_TOKEN_FILE && \
		aws ec2 describe-instance-status \
		--instance-ids $(INSTANCE_ID) --region $(AWS_REGION) --profile $(AWS_PROFILE) | \
		python3 -c "import sys,json; s=json.load(sys.stdin)['InstanceStatuses']; print(s[0]['InstanceState']['Name'],s[0]['InstanceStatus']['Status']) if s else print('no status (instance may be stopped)')"

## restart-server — Reboot EC2 instance (containers auto-start via systemd service)
restart-server:
	@echo "Rebooting EC2 instance..."
	@unset AWS_WEB_IDENTITY_TOKEN_FILE && \
		aws ec2 reboot-instances \
		--instance-ids $(INSTANCE_ID) --region $(AWS_REGION) --profile $(AWS_PROFILE)
	@echo "Reboot initiated. Containers will auto-start in ~2 minutes."

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
