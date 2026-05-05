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
resource "google_service_account" "analytics_sa" {
  count = local.enable_gcp ? 1 : 0

  project      = google_project.analytics[0].project_id
  account_id   = "spm-analytics-sa"
  display_name = "SPM Analytics Service Account"
  description  = "Used by ga4-export.mjs, ga4-setup.mjs, ga4-conversions.mjs, gtm-backup.mjs, gtm-apply.mjs"
}
