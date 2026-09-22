variable "aws_region" {
  description = "AWS region for all resources"
  default     = "us-east-1"
}

variable "project" {
  description = "Project name prefix for resource naming"
  default     = "stpetemusic"
}

variable "github_token" {
  description = "GitHub PAT (repo scope) for Amplify → GitHub repo connection. Set via TF_VAR_github_token in CI."
  type        = string
  sensitive   = true
  default     = "" # empty default allows terraform validate to pass in CI without the secret
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

variable "cloudflare_api_token" {
  description = "Cloudflare API token for stpetemusic.live. Required permissions: Zone:DNS:Edit AND Zone:Transform Rules:Edit. Create at dash.cloudflare.com → My Profile → API Tokens → Create Token. Set via TF_VAR_cloudflare_api_token in CI."
  type        = string
  sensitive   = true
  default     = "" # empty default allows tofu validate/plan to pass without Cloudflare creds
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for stpetemusic.live. Found in Cloudflare dashboard → stpetemusic.live → right sidebar → Zone ID. Set via TF_VAR_cloudflare_zone_id in CI."
  type        = string
  default     = "" # empty default allows tofu validate/plan to pass without Cloudflare creds
}

# ── Google Cloud ──────────────────────────────────────────────────────────────

variable "google_project_id" {
  description = "GCP project ID for the main StPeteMusic project. Set via TF_VAR_google_project_id in CI."
  type        = string
  default     = "" # empty default allows tofu validate/plan to pass without GCP creds
}

variable "google_org_id" {
  description = "GCP organization ID for theburgmusic-org. Get via: gcloud organizations list. Set via TF_VAR_google_org_id in CI."
  type        = string
  default     = "" # empty default allows tofu validate/plan to pass without GCP creds
}

variable "clarity_project_id" {
  description = "Microsoft Clarity project ID for session recording"
  type        = string
  sensitive   = true
  default     = ""
}

variable "bing_webmaster_verification_code" {
  description = "Bing Webmaster Tools site verification code (msvalidate.01 value)"
  type        = string
  default     = ""
}

# ── Social stats (admin dashboard cards) ─────────────────────────────────────
# All optional — admin dashboard degrades gracefully to "—" when not set.

variable "rtmp_stream_key" {
  description = "Secret stream key for RTMP ingest (MediaMTX publishPass). Restream must include this as the stream password. Set via TF_VAR_rtmp_stream_key in CI."
  type        = string
  sensitive   = true
  default     = ""
}

variable "youtube_channel_id" {
  description = "YouTube channel ID for @StPeteMusic (UCxxxxxxxx format — public, not sensitive). Used by the /live page to detect active broadcasts. Set via TF_VAR_youtube_channel_id in CI."
  type        = string
  default     = ""
}

# ── Eventbrite (theburgmusic@gmail.com) ──────────────────────────────────────
#
# eventbrite_org_id stays (unused, zero-cost — no resource ever read it, out of scope for
# this pass). The 4 secret-backed SSM params (private_token, api_key, client_secret,
# public_token) were removed with the rest of the orphaned set; see secrets.tf.

variable "eventbrite_org_id" {
  description = "Eventbrite API organization ID (from /users/me/organizations/ — NOT the profile URL number). Set via TF_VAR_eventbrite_org_id in CI."
  type        = string
  default     = ""
}

variable "alert_email" {
  description = "Email for CloudWatch SNS alarm notifications. Set via TF_VAR_alert_email in CI."
  type        = string
  default     = "theburgmusic@gmail.com"
}

# Where apex, www and admin point now that StPeteMusic's web and admin run on
# the roboBOREALIS platform box instead of Amplify. A variable rather than a
# literal in cloudflare.tf so the cutover target has one name, and so pointing
# the site somewhere else later is a single edit.
#
# Verified against the Cloudflare API 2026-09-22: apex, www and admin are all
# unproxied CNAMEs to this host.
variable "platform_cloudfront_domain" {
  description = "CloudFront distribution serving the platform build of stpetemusic.live"
  type        = string
  default     = "d123fbe0johuow.cloudfront.net"
}
