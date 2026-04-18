# AWS Amplify — Next.js SSR hosting for apps/web
# Platform: WEB_COMPUTE (required for API routes / SSR)
# Branches: main (production) + develop (staging)
# Build spec: amplify.yml at repo root

resource "aws_amplify_app" "web" {
  name         = "${var.project}-web"
  repository   = "https://github.com/maylortaylor/StPeteMusic"
  access_token = var.github_token

  # SSR mode — required because /api/newsletter/subscribe cannot be statically exported
  platform = "WEB_COMPUTE"

  # No build_spec here — Amplify reads amplify.yml directly from the repo root.
  # This means build spec changes never require a terraform apply.

  environment_variables = {
    NEXT_PUBLIC_SITE_URL = "https://www.stpetemusic.live"

    # Non-secret Listmonk config — secrets set in Amplify console per branch
    LISTMONK_API_URL = "https://newsletter.stpetemusic.live"
    LISTMONK_LIST_ID = "1"
  }

  enable_auto_branch_creation = false
  enable_branch_auto_deletion = true

  tags = {
    Name    = "${var.project}-web"
    Project = var.project
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

# Custom domain — uncomment after stpetemusic.live nameservers point to Cloudflare
# and after the Amplify app is created (run terraform apply without this block first,
# then add it and re-apply once you have the Amplify CNAME value for Cloudflare DNS).
#
# resource "aws_amplify_domain_association" "web" {
#   app_id      = aws_amplify_app.web.id
#   domain_name = "stpetemusic.live"
#
#   sub_domain {
#     branch_name = aws_amplify_branch.main.branch_name
#     prefix      = "www"
#   }
#
#   sub_domain {
#     branch_name = aws_amplify_branch.main.branch_name
#     prefix      = ""
#   }
# }
