# GCP resources for the StPeteMusic analytics project
#
# This project (stpetemusic-analytics) lives in theburgmusic-org and holds:
#   - Google Analytics Data API    (ga4-export.mjs)
#   - Google Analytics Admin API   (ga4-conversions.mjs, ga4-setup.mjs)
#   - Tag Manager API              (gtm-backup.mjs, gtm-apply.mjs, gtm-validate.mjs)
#   - Service account for CLI scripts
#
# The project already exists — move it to the org and then import:
#   gcloud projects move stpetemusic-analytics --organization=<ORG_ID>
#   tofu import google_project.analytics stpetemusic-analytics
#
# After import, tofu apply will:
#   - Ensure all required APIs are enabled
#   - Ensure the analytics service account exists

resource "google_project" "analytics" {
  count = local.enable_gcp ? 1 : 0

  name       = "stpetemusic-analytics"
  project_id = "stpetemusic-analytics"
  org_id     = var.google_org_id
}

# Cloud Resource Manager API — required by the Google Terraform provider to read project state
resource "google_project_service" "resource_manager" {
  count = local.enable_gcp ? 1 : 0

  project                    = google_project.analytics[0].project_id
  service                    = "cloudresourcemanager.googleapis.com"
  disable_on_destroy         = false
  disable_dependent_services = false
}

# GA4 Data API — read analytics reports
resource "google_project_service" "ga4_data" {
  count = local.enable_gcp ? 1 : 0

  project                    = google_project.analytics[0].project_id
  service                    = "analyticsdata.googleapis.com"
  disable_on_destroy         = false
  disable_dependent_services = false
}

# GA4 Admin API — manage properties, streams, conversion events
resource "google_project_service" "ga4_admin" {
  count = local.enable_gcp ? 1 : 0

  project                    = google_project.analytics[0].project_id
  service                    = "analyticsadmin.googleapis.com"
  disable_on_destroy         = false
  disable_dependent_services = false
}

# IAM API — required to create service accounts
resource "google_project_service" "iam_api" {
  count = local.enable_gcp ? 1 : 0

  project                    = google_project.analytics[0].project_id
  service                    = "iam.googleapis.com"
  disable_on_destroy         = false
  disable_dependent_services = false
}

# Tag Manager API — backup/apply/validate GTM container config
resource "google_project_service" "tag_manager" {
  count = local.enable_gcp ? 1 : 0

  project                    = google_project.analytics[0].project_id
  service                    = "tagmanager.googleapis.com"
  disable_on_destroy         = false
  disable_dependent_services = false
}

# Service account for CLI analytics scripts
# After apply: create + download a JSON key in GCP Console
#   → APIs & Services → Credentials → Create credentials → Service account key
#   → Save as apps/web/scripts/sa-key.json (gitignored)
# Workload Identity Federation — allows GitHub Actions to impersonate the CI service account
# without a long-lived key. The attribute_condition locks this to this specific repo (by
# numeric ID, which is immutable even if the repo is renamed).
#
# First-time setup:
#   tofu import google_iam_workload_identity_pool.github_actions \
#     projects/stpetemusic-analytics/locations/global/workloadIdentityPools/github-actions
#   tofu import google_iam_workload_identity_pool_provider.github \
#     projects/stpetemusic-analytics/locations/global/workloadIdentityPools/github-actions/providers/github
resource "google_iam_workload_identity_pool" "github_actions" {
  count = local.enable_gcp ? 1 : 0

  project                   = google_project.analytics[0].project_id
  workload_identity_pool_id = "github-actions"
  display_name              = "GitHub Actions"
  description               = "WIF pool for GitHub Actions CI/CD"

  depends_on = [google_project_service.iam_api]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  count = local.enable_gcp ? 1 : 0

  project                            = google_project.analytics[0].project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_actions[0].workload_identity_pool_id
  workload_identity_pool_provider_id = "github"
  display_name                       = "GitHub"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.repository_id" = "assertion.repository_id"
  }

  # Restrict to this specific repo by numeric ID (immutable — safe against repo renames)
  attribute_condition = "attribute.repository_id == \"1144434287\""

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# Service account for CLI analytics scripts
# After apply: create + download a JSON key in GCP Console
#   → APIs & Services → Credentials → Create credentials → Service account key
#   → Save as apps/web/scripts/sa-key.json (gitignored)
resource "google_service_account" "analytics_sa" {
  count = local.enable_gcp ? 1 : 0

  project      = google_project.analytics[0].project_id
  account_id   = "spm-analytics-sa"
  display_name = "SPM Analytics Service Account"
  description  = "Used by ga4-export.mjs, ga4-setup.mjs, ga4-conversions.mjs, gtm-backup.mjs, gtm-apply.mjs"

  depends_on = [google_project_service.iam_api]
}
