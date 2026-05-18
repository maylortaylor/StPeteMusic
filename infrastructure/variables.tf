variable "aws_region" {
  description = "AWS region for all resources"
  default     = "us-east-1"
}

variable "project" {
  description = "Project name prefix for resource naming"
  default     = "stpetemusic"
}

variable "ssh_key_name" {
  description = "Name of the EC2 key pair for SSH access"
  default     = "stpetemusic-n8n"
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed to SSH into the EC2 instance. Open to all — SSH key auth is the protection."
  default     = "0.0.0.0/0"
}

variable "github_token" {
  description = "GitHub PAT (repo scope) for Amplify → GitHub repo connection. Set via TF_VAR_github_token in CI."
  type        = string
  sensitive   = true
  default     = ""  # empty default allows terraform validate to pass in CI without the secret
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

variable "listmonk_username" {
  description = "Listmonk admin API username. Set via TF_VAR_listmonk_username in CI."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.listmonk_username) > 0
    error_message = "listmonk_username must not be empty. Set the LISTMONK_USERNAME GitHub Secret."
  }
}

variable "listmonk_password" {
  description = "Listmonk admin API password. Set via TF_VAR_listmonk_password in CI."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.listmonk_password) > 0
    error_message = "listmonk_password must not be empty. Set the LISTMONK_PASSWORD GitHub Secret."
  }
}

variable "resend_api_key" {
  description = "Resend API key for contact form emails. Set via TF_VAR_resend_api_key in CI."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.resend_api_key) > 0
    error_message = "resend_api_key must not be empty. Set the RESEND_API_KEY GitHub Secret."
  }
}

variable "clerk_secret_key" {
  description = "Clerk secret key for admin app. Set via TF_VAR_clerk_secret_key in CI."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.clerk_secret_key) > 0
    error_message = "clerk_secret_key must not be empty. Set the CLERK_SECRET_KEY GitHub Secret."
  }
}

variable "clerk_publishable_key" {
  description = "Clerk publishable key for admin app. Set via TF_VAR_clerk_publishable_key in CI."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.clerk_publishable_key) > 0
    error_message = "clerk_publishable_key must not be empty. Set the NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY GitHub Secret."
  }
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token with Zone:DNS:Edit permission for stpetemusic.live. Create at dash.cloudflare.com → My Profile → API Tokens → Create Token → Edit zone DNS template. Set via TF_VAR_cloudflare_api_token in CI."
  type        = string
  sensitive   = true
  default     = ""  # empty default allows tofu validate/plan to pass without Cloudflare creds
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for stpetemusic.live. Found in Cloudflare dashboard → stpetemusic.live → right sidebar → Zone ID. Set via TF_VAR_cloudflare_zone_id in CI."
  type        = string
  default     = ""  # empty default allows tofu validate/plan to pass without Cloudflare creds
}

# ── Google Cloud ──────────────────────────────────────────────────────────────

variable "google_project_id" {
  description = "GCP project ID for the main StPeteMusic project. Set via TF_VAR_google_project_id in CI."
  type        = string
  default     = ""  # empty default allows tofu validate/plan to pass without GCP creds
}

variable "google_org_id" {
  description = "GCP organization ID for theburgmusic-org. Get via: gcloud organizations list. Set via TF_VAR_google_org_id in CI."
  type        = string
  default     = ""  # empty default allows tofu validate/plan to pass without GCP creds
}

variable "meta_pixel_id" {
  description = "Meta Pixel ID for Facebook/Instagram conversion tracking"
  type        = string
  sensitive   = true
  default     = ""
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

variable "ig_user_id" {
  description = "Instagram Business Account numeric ID. Used by admin dashboard to fetch follower count. Set via TF_VAR_ig_user_id in CI."
  type        = string
  sensitive   = true
  default     = ""
}

variable "ig_access_token" {
  description = "Instagram long-lived page access token with instagram_basic permission. Set via TF_VAR_ig_access_token in CI."
  type        = string
  sensitive   = true
  default     = ""
}

variable "fb_page_id" {
  description = "Facebook Page numeric ID for StPeteFLMusic. Used by admin dashboard to fetch fan count. Set via TF_VAR_fb_page_id in CI."
  type        = string
  sensitive   = true
  default     = ""
}

variable "fb_access_token" {
  description = "Facebook Page access token with pages_read_engagement permission. Set via TF_VAR_fb_access_token in CI."
  type        = string
  sensitive   = true
  default     = ""
}

variable "youtube_api_key" {
  description = "YouTube Data API v3 key. Used by admin dashboard to fetch subscriber count for @StPeteMusic. Set via TF_VAR_youtube_api_key in CI."
  type        = string
  sensitive   = true
  default     = ""
}

# ── Featured artists pipeline ─────────────────────────────────────────────────

variable "anthropic_api_key" {
  description = "Anthropic API key for admin app — newsletter blurb + blog post generation via @anthropic-ai/sdk. Set via TF_VAR_anthropic_api_key in CI."
  type        = string
  sensitive   = true
  default     = ""
}

variable "n8n_artist_enrichment_webhook_url" {
  description = "n8n webhook URL that triggers the artist-enrichment workflow. Set via TF_VAR_n8n_artist_enrichment_webhook_url in CI."
  type        = string
  sensitive   = true
  default     = ""
}

variable "n8n_webhook_secret" {
  description = "Shared secret for n8n → admin webhook callbacks (x-webhook-secret header). Must match N8N_WEBHOOK_SECRET in the n8n EC2 .env. Set via TF_VAR_n8n_webhook_secret in CI."
  type        = string
  sensitive   = true
  default     = ""
}

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

variable "eventbrite_org_id" {
  description = "Eventbrite API organization ID (from /users/me/organizations/ — NOT the profile URL number). Set via TF_VAR_eventbrite_org_id in CI."
  type        = string
  default     = ""
}

variable "eventbrite_private_token" {
  description = "Eventbrite Private Token for server-to-server API calls (theburgmusic@gmail.com). Set via TF_VAR_eventbrite_private_token in CI."
  type        = string
  sensitive   = true
  default     = ""
}

variable "eventbrite_api_key" {
  description = "Eventbrite OAuth API Key (theburgmusic@gmail.com). Set via TF_VAR_eventbrite_api_key in CI."
  type        = string
  sensitive   = true
  default     = ""
}

variable "eventbrite_client_secret" {
  description = "Eventbrite OAuth Client Secret (theburgmusic@gmail.com). Set via TF_VAR_eventbrite_client_secret in CI."
  type        = string
  sensitive   = true
  default     = ""
}

variable "eventbrite_public_token" {
  description = "Eventbrite Public Token (theburgmusic@gmail.com). Set via TF_VAR_eventbrite_public_token in CI."
  type        = string
  sensitive   = true
  default     = ""
}
