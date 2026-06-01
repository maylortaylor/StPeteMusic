# AWS Amplify — Next.js SSR hosting for apps/web
# Platform: WEB_COMPUTE (required for API routes / SSR)
# Branches: main (production) + develop (staging)
# Build spec: amplify.yml at repo root

# Read secrets from SSM so Amplify env vars stay in sync
data "aws_ssm_parameter" "revalidation_secret" {
  count           = var.revalidation_secret != "" ? 1 : 0
  name            = aws_ssm_parameter.revalidation_secret[0].name
  with_decryption = true
}

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

# ── Featured artists pipeline ─────────────────────────────────────────────────

data "aws_ssm_parameter" "anthropic_api_key" {
  count           = var.anthropic_api_key != "" ? 1 : 0
  name            = aws_ssm_parameter.anthropic_api_key[0].name
  with_decryption = true
}

data "aws_ssm_parameter" "n8n_artist_enrichment_webhook_url" {
  count           = var.n8n_artist_enrichment_webhook_url != "" ? 1 : 0
  name            = aws_ssm_parameter.n8n_artist_enrichment_webhook_url[0].name
  with_decryption = true
}

data "aws_ssm_parameter" "n8n_webhook_secret" {
  count           = var.n8n_webhook_secret != "" ? 1 : 0
  name            = aws_ssm_parameter.n8n_webhook_secret[0].name
  with_decryption = true
}

data "aws_ssm_parameter" "eventbrite_private_token" {
  count           = var.eventbrite_private_token != "" ? 1 : 0
  name            = aws_ssm_parameter.eventbrite_private_token[0].name
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
    NEXT_PUBLIC_META_PIXEL_ID = var.meta_pixel_id
    NEXT_PUBLIC_CLARITY_ID    = var.clarity_project_id
    YOUTUBE_API_KEY           = var.youtube_api_key
    YOUTUBE_CHANNEL_ID        = var.youtube_channel_id
    REVALIDATION_SECRET       = var.revalidation_secret != "" ? data.aws_ssm_parameter.revalidation_secret[0].value : ""
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
    DATABASE_URL                        = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.address}:5432/n8n"
    CLERK_SECRET_KEY                    = data.aws_ssm_parameter.clerk_secret_key.value
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY   = data.aws_ssm_parameter.clerk_publishable_key.value
    NEXT_PUBLIC_CLERK_SIGN_IN_URL       = "/sign-in"
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL = "/dashboard"
    # Listmonk — newsletter page + subscriber stat card
    LISTMONK_API_URL                    = "https://listmonk.stpetemusic.live"
    LISTMONK_USERNAME                   = data.aws_ssm_parameter.listmonk_username.value
    LISTMONK_PASSWORD                   = data.aws_ssm_parameter.listmonk_password.value
    # Social stat cards — optional, degrade to "—" if empty
    IG_USER_ID                          = var.ig_user_id
    IG_ACCESS_TOKEN                     = var.ig_access_token
    FB_PAGE_ID                          = var.fb_page_id
    FB_ACCESS_TOKEN                     = var.fb_access_token
    YOUTUBE_API_KEY                     = var.youtube_api_key
    # Featured artists pipeline
    ANTHROPIC_API_KEY                   = var.anthropic_api_key != "" ? data.aws_ssm_parameter.anthropic_api_key[0].value : ""
    N8N_ARTIST_ENRICHMENT_WEBHOOK_URL   = var.n8n_artist_enrichment_webhook_url != "" ? data.aws_ssm_parameter.n8n_artist_enrichment_webhook_url[0].value : ""
    N8N_WEBHOOK_SECRET                  = var.n8n_webhook_secret != "" ? data.aws_ssm_parameter.n8n_webhook_secret[0].value : ""
    # Revalidation — admin calls web app's /api/revalidate after syncs
    WEB_APP_URL                         = "https://www.stpetemusic.live"
    REVALIDATION_SECRET                 = var.revalidation_secret != "" ? data.aws_ssm_parameter.revalidation_secret[0].value : ""
    # Eventbrite integration (admin only — never exposed to web app)
    EVENTBRITE_ORG_ID                   = var.eventbrite_org_id
    EVENTBRITE_PRIVATE_TOKEN            = var.eventbrite_private_token != "" ? data.aws_ssm_parameter.eventbrite_private_token[0].value : ""
    # Artist image upload — S3 bucket + CloudFront CDN
    AWS_ASSETS_BUCKET                   = aws_s3_bucket.assets.id
    ASSETS_CDN_URL                      = "https://cdn.stpetemusic.live"
    AWS_REGION                          = var.aws_region
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
  app_id                 = aws_amplify_app.admin.id
  domain_name            = "stpetemusic.live"
  wait_for_verification  = false  # DNS managed via cloudflare.tf; Amplify validates async

  sub_domain {
    branch_name = aws_amplify_branch.admin_main.branch_name
    prefix      = "admin"
  }
}

# ── Web app custom domain ────────────────────────────────────────────────────

resource "aws_amplify_domain_association" "web" {
  app_id                 = aws_amplify_app.web.id
  domain_name            = "stpetemusic.live"
  wait_for_verification  = false  # DNS managed via cloudflare.tf; Amplify validates async

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = "www"
  }

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = ""
  }
}
