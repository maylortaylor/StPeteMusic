# AWS Amplify — Next.js SSR hosting for apps/web
# Platform: WEB_COMPUTE (required for API routes / SSR)
# Branches: main (production) + develop (staging)
# Build spec: amplify.yml at repo root

# Read secrets from SSM so Amplify env vars stay in sync
data "aws_ssm_parameter" "clerk_secret_key" {
  name            = aws_ssm_parameter.clerk_secret_key.name
  with_decryption = true
}

data "aws_ssm_parameter" "clerk_publishable_key" {
  name            = aws_ssm_parameter.clerk_publishable_key.name
  with_decryption = true
}

data "aws_ssm_parameter" "resend_api_key" {
  name            = aws_ssm_parameter.resend_api_key.name
  with_decryption = true
}

data "aws_ssm_parameter" "listmonk_username" {
  name            = aws_ssm_parameter.listmonk_username.name
  with_decryption = true
}

data "aws_ssm_parameter" "listmonk_password" {
  name            = aws_ssm_parameter.listmonk_password.name
  with_decryption = true
}

resource "aws_amplify_app" "web" {
  name         = "${var.project}-web"
  repository   = "https://github.com/maylortaylor/StPeteMusic"
  access_token = var.github_token != "" ? var.github_token : null

  # SSR mode — required because /api/newsletter/subscribe cannot be statically exported
  platform = "WEB_COMPUTE"

  # No build_spec here — Amplify reads amplify.yml directly from the repo root.
  # This means build spec changes never require a terraform apply.

  environment_variables = {
    AMPLIFY_MONOREPO_APP_ROOT = "apps/web"  # tells Amplify where to find package.json for framework detection
    NEXT_PUBLIC_SITE_URL      = "https://www.stpetemusic.live"
    NEXT_PUBLIC_GTM_ID        = "GTM-WW7MSP3L"
    RESEND_API_KEY            = data.aws_ssm_parameter.resend_api_key.value
    LISTMONK_API_URL          = "https://listmonk.stpetemusic.live"
    LISTMONK_LIST_ID          = "3"
    LISTMONK_USERNAME         = data.aws_ssm_parameter.listmonk_username.value
    LISTMONK_PASSWORD         = data.aws_ssm_parameter.listmonk_password.value
    # Constructed from existing POSTGRES_USER / POSTGRES_PASSWORD GitHub Secrets.
    # SSL handled by db.ts (rejectUnauthorized:false for non-localhost connections).
    DATABASE_URL              = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.address}:5432/n8n"
  }

  enable_auto_branch_creation = false
  enable_branch_auto_deletion = true

  tags = {
    Name    = "${var.project}-web"
    Project = var.project
  }

  # access_token is only needed on initial creation — ignore changes so plan
  # succeeds even when GH_TOKEN_AMPLIFY is not available in tofu-plan CI.
  lifecycle {
    ignore_changes = [access_token]
  }
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.web.id
  branch_name = "main"
  framework   = "Next.js - SSR"
  stage       = "PRODUCTION"

  enable_auto_build           = true
  enable_pull_request_preview = false

  tags = {
    Name    = "${var.project}-web-main"
    Project = var.project
  }
}

resource "aws_amplify_branch" "develop" {
  app_id      = aws_amplify_app.web.id
  branch_name = "develop"
  framework   = "Next.js - SSR"
  stage       = "DEVELOPMENT"

  enable_auto_build           = true
  enable_pull_request_preview = true

  environment_variables = {
    LISTMONK_API_URL = "http://localhost:9000"
  }

  tags = {
    Name    = "${var.project}-web-develop"
    Project = var.project
  }
}

# ── Admin app ────────────────────────────────────────────────────────────────

resource "aws_amplify_app" "admin" {
  name         = "${var.project}-admin"
  repository   = "https://github.com/maylortaylor/StPeteMusic"
  access_token = var.github_token != "" ? var.github_token : null
  platform     = "WEB_COMPUTE"

  environment_variables = {
    AMPLIFY_MONOREPO_APP_ROOT           = "apps/admin"
    NEXT_PUBLIC_SITE_URL                = "https://admin.stpetemusic.live"
    DATABASE_URL                        = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.address}:5432/stpetemusic"
    CLERK_SECRET_KEY                    = data.aws_ssm_parameter.clerk_secret_key.value
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY   = data.aws_ssm_parameter.clerk_publishable_key.value
    NEXT_PUBLIC_CLERK_SIGN_IN_URL       = "/sign-in"
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL = "/dashboard"
  }

  enable_auto_branch_creation = false
  enable_branch_auto_deletion = true

  tags = {
    Name    = "${var.project}-admin"
    Project = var.project
  }

  lifecycle {
    ignore_changes = [access_token]
  }
}

resource "aws_amplify_branch" "admin_main" {
  app_id      = aws_amplify_app.admin.id
  branch_name = "main"
  framework   = "Next.js - SSR"
  stage       = "PRODUCTION"

  enable_auto_build           = true
  enable_pull_request_preview = false

  tags = {
    Name    = "${var.project}-admin-main"
    Project = var.project
  }
}

resource "aws_amplify_branch" "admin_develop" {
  app_id      = aws_amplify_app.admin.id
  branch_name = "develop"
  framework   = "Next.js - SSR"
  stage       = "DEVELOPMENT"

  enable_auto_build           = true
  enable_pull_request_preview = true

  tags = {
    Name    = "${var.project}-admin-develop"
    Project = var.project
  }
}

resource "aws_amplify_domain_association" "admin" {
  app_id      = aws_amplify_app.admin.id
  domain_name = "stpetemusic.live"

  sub_domain {
    branch_name = aws_amplify_branch.admin_main.branch_name
    prefix      = "admin"
  }
}

# ── Web app custom domain ────────────────────────────────────────────────────

resource "aws_amplify_domain_association" "web" {
  app_id      = aws_amplify_app.web.id
  domain_name = "stpetemusic.live"

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = "www"
  }

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = ""
  }
}
