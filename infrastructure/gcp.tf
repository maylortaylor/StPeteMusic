# GCP resources for the main StPeteMusic project
#
# This project lives in theburgmusic-org and holds:
#   - Maps JavaScript API (for venue maps on the website)
#
# The project already exists — import it before first apply:
#   tofu import google_project.stpetemusic project-bb73c742-70e6-4419-a66
#
# Auth: set GOOGLE_APPLICATION_CREDENTIALS to a service account key path,
#       or run: gcloud auth application-default login

locals {
  enable_gcp = var.google_project_id != "" && var.google_org_id != ""
}

resource "google_project" "stpetemusic" {
  count = local.enable_gcp ? 1 : 0

  name       = "StPeteMusic"
  project_id = var.google_project_id
  org_id     = var.google_org_id

  lifecycle {
    # billing_account is managed outside Terraform — don't clear it on apply
    ignore_changes = [billing_account]
  }
}

# Maps JavaScript API — used for venue location maps on the website
resource "google_project_service" "maps_js" {
  count = local.enable_gcp ? 1 : 0

  project                    = google_project.stpetemusic[0].project_id
  service                    = "maps-backend.googleapis.com"
  disable_on_destroy         = false
  disable_dependent_services = false
}
