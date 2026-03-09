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
