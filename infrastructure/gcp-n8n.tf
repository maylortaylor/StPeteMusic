# GCP resources for the n8n workflow integrations project
#
# This project consolidates YouTube, Google Calendar, and Google Sheets OAuth
# into a single project for all n8n automation workflows.
#
# Replaces two fragmented projects:
#   - stpetemusic-youtube-n8n  (YouTube Data API v3)
#   - spm-gcalendar-website    (Google Calendar API)
#
# Migration steps (run once):
#   1. Create the project:  tofu apply -target=google_project.n8n_workflows
#   2. Enable APIs:         tofu apply -target=google_project_service.*
#   3. In GCP Console → spm-n8n-workflows → APIs & Services → Credentials:
#      Create OAuth 2.0 Client ID (Web application)
#      Redirect URI: https://n8n.stpetemusic.live/rest/oauth2-credential/callback
#      Download JSON → update GitHub Secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
#   4. In n8n: re-authorize YouTube, Google Calendar, Google Sheets credentials
#      using the new OAuth client
#   5. Verify n8n workflows run successfully
#   6. Remove billing from old projects, schedule deletion after 30 days

resource "google_project" "n8n_workflows" {
  count = local.enable_gcp ? 1 : 0

  name       = "SPM n8n Workflows"
  project_id = "spm-n8n-workflows"
  org_id     = var.google_org_id
}

# YouTube Data API v3 — n8n YouTube posting + shorts tracking workflows
resource "google_project_service" "youtube" {
  count = local.enable_gcp ? 1 : 0

  project                    = google_project.n8n_workflows[0].project_id
  service                    = "youtube.googleapis.com"
  disable_on_destroy         = false
  disable_dependent_services = false
}

# Google Calendar API — n8n calendar event integrations
resource "google_project_service" "calendar" {
  count = local.enable_gcp ? 1 : 0

  project                    = google_project.n8n_workflows[0].project_id
  service                    = "calendar-json.googleapis.com"
  disable_on_destroy         = false
  disable_dependent_services = false
}

# Google Sheets API — n8n newsletter-draft-creator reads from Google Sheets
resource "google_project_service" "sheets" {
  count = local.enable_gcp ? 1 : 0

  project                    = google_project.n8n_workflows[0].project_id
  service                    = "sheets.googleapis.com"
  disable_on_destroy         = false
  disable_dependent_services = false
}

# Google Forms API — setup script configures the artist info submission form
resource "google_project_service" "forms" {
  count = local.enable_gcp ? 1 : 0

  project                    = google_project.n8n_workflows[0].project_id
  service                    = "forms.googleapis.com"
  disable_on_destroy         = false
  disable_dependent_services = false
}
