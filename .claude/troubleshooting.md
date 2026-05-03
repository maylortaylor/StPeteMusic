---
topic: troubleshooting
triggers: error, down, debug, troubleshoot, ssh, terraform issue, connection refused, 403, 500, not responding, credentials issue, env leakage, contamination
updated: 2026-05-02
---

# Troubleshooting

## AWS Credentials Issues

**Problem:** `Error: No valid credential sources found`

**Solution:**
1. Verify `.envrc` is allowed: `direnv allow`
2. Configure AWS profile:
   ```bash
   aws configure --profile personal
   ```
3. Test: `AWS_PROFILE=personal aws sts get-caller-identity`

**Problem:** AWS commands reference `/Users/matttaylor/Documents/_dev/amver-hub/aws_token`

**Solution:** This is contamination from PSD projects. The `.envrc` file should clean this up automatically:
```bash
direnv allow
cd .  # refresh environment
AWS_PROFILE=personal aws sts get-caller-identity
```

If it persists, check your shell config (`.zshrc`, `.bashrc`) for `AWS_WEB_IDENTITY_TOKEN_FILE` and remove it.

## Terraform Issues

**Problem:** `Backend initialization required`

**Solution:**
```bash
cd infrastructure
unset AWS_WEB_IDENTITY_TOKEN_FILE && AWS_PROFILE=personal tofu init -reconfigure
```

**Problem:** `tofu plan` shows no changes but changes are expected

**Solution:** State might be out of sync:
```bash
unset AWS_WEB_IDENTITY_TOKEN_FILE
AWS_PROFILE=personal tofu refresh
AWS_PROFILE=personal tofu plan
```

## n8n Server Down

**Problem:** `https://n8n.stpetemusic.live` not responding

**Solutions (in order):**
1. Check AWS status:
   ```bash
   AWS_PROFILE=personal aws ec2 describe-instance-status \
     --instance-ids i-03874197d725b0455 --region us-east-1
   ```

2. Restart Docker containers:
   ```bash
   ssh -i ~/.ssh/stpetemusic-n8n.pem ec2-user@n8n.stpetemusic.live \
     "cd ~/stpetemusic/n8n && docker-compose -f docker-compose.prod.yaml restart"
   ```

3. Reboot instance:
   ```bash
   AWS_PROFILE=personal aws ec2 reboot-instances \
     --instance-ids i-03874197d725b0455 --region us-east-1
   ```

4. Full stop/start:
   ```bash
   AWS_PROFILE=personal aws ec2 stop-instances --instance-ids i-03874197d725b0455 --region us-east-1
   sleep 30
   AWS_PROFILE=personal aws ec2 start-instances --instance-ids i-03874197d725b0455 --region us-east-1
   ```

## SSH Access Denied

**Problem:** `Connection refused` or `Operation timed out`

**Reason:** SSH is restricted to a specific IP (see `infrastructure/ec2.tf`)

**Solution:** Update the security group in Terraform:
```hcl
# In infrastructure/ec2.tf, find aws_security_group.n8n
# Update cidr_blocks for port 22:
cidr_blocks = ["YOUR.IP.ADDRESS/32"]  # Replace with your public IP
```

Then apply:
```bash
cd infrastructure
unset AWS_WEB_IDENTITY_TOKEN_FILE && AWS_PROFILE=personal tofu apply
```

## Environment Variable Leakage

**Problem:** Global env vars from other projects interfere

**Prevention:**
- ✅ Always run from this project directory (direnv will isolate environment)
- ✅ Use `AWS_PROFILE=personal` explicitly when not in directory
- ✅ Pre-commit hooks prevent committing bad configs
- ✅ Run setup.sh to validate clean environment

**If contamination happens:**
```bash
unset AWS_WEB_IDENTITY_TOKEN_FILE
unset DATABASE_URL
unset KEYCLOAK_ISSUER
direnv allow
cd .  # refresh
```
