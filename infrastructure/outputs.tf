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
