# SSM SecureString parameters — single source of truth for app secrets
#
# Both the EC2 deploy script (via instance role) and Amplify (via Terraform data source)
# read from here. To rotate credentials:
#   1. Update the corresponding GitHub Secret
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

resource "aws_ssm_parameter" "resend_api_key" {
  name  = "/${var.project}/resend/api_key"
  type  = "SecureString"
  value = var.resend_api_key
  tags  = { Project = var.project }
}

resource "aws_ssm_parameter" "clerk_secret_key" {
  name  = "/${var.project}/clerk/secret_key"
  type  = "SecureString"
  value = var.clerk_secret_key
  tags  = { Project = var.project }
}

resource "aws_ssm_parameter" "clerk_publishable_key" {
  name  = "/${var.project}/clerk/publishable_key"
  type  = "SecureString"
  value = var.clerk_publishable_key
  tags  = { Project = var.project }
}

resource "aws_ssm_parameter" "meta_pixel_id" {
  count = var.meta_pixel_id != "" ? 1 : 0

  name  = "/${var.project}/analytics/meta_pixel_id"
  type  = "SecureString"
  value = var.meta_pixel_id

  tags = {
    Project = var.project
  }
}

resource "aws_ssm_parameter" "clarity_project_id" {
  count = var.clarity_project_id != "" ? 1 : 0

  name  = "/${var.project}/analytics/clarity_project_id"
  type  = "SecureString"
  value = var.clarity_project_id

  tags = {
    Project = var.project
  }
}

# ── Social stats ──────────────────────────────────────────────────────────────

resource "aws_ssm_parameter" "ig_user_id" {
  count = var.ig_user_id != "" ? 1 : 0

  name  = "/${var.project}/instagram/user_id"
  type  = "SecureString"
  value = var.ig_user_id
  tags  = { Project = var.project }
}

resource "aws_ssm_parameter" "ig_access_token" {
  count = var.ig_access_token != "" ? 1 : 0

  name  = "/${var.project}/instagram/access_token"
  type  = "SecureString"
  value = var.ig_access_token
  tags  = { Project = var.project }
}

resource "aws_ssm_parameter" "fb_page_id" {
  count = var.fb_page_id != "" ? 1 : 0

  name  = "/${var.project}/facebook/page_id"
  type  = "SecureString"
  value = var.fb_page_id
  tags  = { Project = var.project }
}

resource "aws_ssm_parameter" "fb_access_token" {
  count = var.fb_access_token != "" ? 1 : 0

  name  = "/${var.project}/facebook/access_token"
  type  = "SecureString"
  value = var.fb_access_token
  tags  = { Project = var.project }
}

resource "aws_ssm_parameter" "youtube_api_key" {
  count = var.youtube_api_key != "" ? 1 : 0

  name  = "/${var.project}/youtube/api_key"
  type  = "SecureString"
  value = var.youtube_api_key
  tags  = { Project = var.project }
}
