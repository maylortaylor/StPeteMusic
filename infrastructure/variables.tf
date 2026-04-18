variable "aws_region" {
  description = "AWS region for all resources"
  default     = "us-east-1"
}

variable "project" {
  description = "Project name prefix for resource naming"
  default     = "stpetemusic"
}

variable "ssh_key_name" {
  description = "Name of the EC2 key pair for SSH access"
  default     = "stpetemusic-n8n"
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed to SSH into the EC2 instance. Update if your IP changes (run: curl ifconfig.me)"
  default     = "66.117.37.36/32"
}

variable "github_token" {
  description = "GitHub PAT (repo scope) for Amplify → GitHub repo connection. Set via TF_VAR_github_token in CI."
  type        = string
  sensitive   = true
  default     = ""  # empty default allows terraform validate to pass in CI without the secret
}
