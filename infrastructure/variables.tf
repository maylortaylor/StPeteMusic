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
  description = "CIDR block allowed to SSH into the EC2 instance. Open to all — SSH key auth is the protection."
  default     = "0.0.0.0/0"
}

variable "github_token" {
  description = "GitHub PAT (repo scope) for Amplify → GitHub repo connection. Set via TF_VAR_github_token in CI."
  type        = string
  sensitive   = true
  default     = ""  # empty default allows terraform validate to pass in CI without the secret
}

variable "db_username" {
  description = "RDS master username. Set via TF_VAR_db_username in CI."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.db_username) > 0
    error_message = "db_username must not be empty. Set the POSTGRES_USER GitHub Secret."
  }
}

variable "db_password" {
  description = "RDS master password. Set via TF_VAR_db_password in CI."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.db_password) > 0
    error_message = "db_password must not be empty. Set the POSTGRES_PASSWORD GitHub Secret."
  }
}

variable "listmonk_username" {
  description = "Listmonk admin API username. Set via TF_VAR_listmonk_username in CI."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.listmonk_username) > 0
    error_message = "listmonk_username must not be empty. Set the LISTMONK_USERNAME GitHub Secret."
  }
}

variable "listmonk_password" {
  description = "Listmonk admin API password. Set via TF_VAR_listmonk_password in CI."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.listmonk_password) > 0
    error_message = "listmonk_password must not be empty. Set the LISTMONK_PASSWORD GitHub Secret."
  }
}
