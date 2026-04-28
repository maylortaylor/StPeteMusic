# SSM SecureString parameters — single source of truth for Listmonk credentials
#
# Both the EC2 deploy script (via instance role) and Amplify (via Terraform data source)
# read from here. To rotate credentials:
#   1. Update LISTMONK_USERNAME / LISTMONK_PASSWORD GitHub Secrets
#   2. Push a change to infrastructure/ to trigger tofu-apply.yml
#   3. Push to main to apply to EC2 + Amplify rebuild

resource "aws_ssm_parameter" "listmonk_username" {
  name  = "/${var.project}/listmonk/username"
  type  = "SecureString"
  value = var.listmonk_username
  tags  = { Project = var.project }
}

resource "aws_ssm_parameter" "listmonk_password" {
  name  = "/${var.project}/listmonk/password"
  type  = "SecureString"
  value = var.listmonk_password
  tags  = { Project = var.project }
}
