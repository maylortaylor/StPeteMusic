output "elastic_ip" {
  description = "Public Elastic IP address of the n8n EC2 instance"
  value       = aws_eip.n8n.public_ip
}

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.n8n.id
}

output "n8n_url" {
  description = "Public URL for n8n"
  value       = "https://n8n-stpetemusic.duckdns.org"
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.n8n.id
}

output "backup_bucket" {
  description = "S3 bucket name for n8n backups"
  value       = aws_s3_bucket.n8n_backups.id
}

output "amplify_app_id" {
  description = "AWS Amplify app ID — add as AMPLIFY_APP_ID GitHub Secret"
  value       = aws_amplify_app.web.id
}

output "amplify_default_domain" {
  description = "Amplify default domain (before custom domain is connected)"
  value       = aws_amplify_app.web.default_domain
}

output "amplify_production_url" {
  description = "Production URL on Amplify (main branch)"
  value       = "https://main.${aws_amplify_app.web.default_domain}"
}

output "amplify_staging_url" {
  description = "Staging URL on Amplify (develop branch)"
  value       = "https://develop.${aws_amplify_app.web.default_domain}"
}
