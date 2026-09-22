# DNS records for stpetemusic.live — managed via Cloudflare Terraform provider
#
# All Amplify custom domain records MUST be DNS-only (proxied = false).
# Cloudflare proxy (orange cloud) breaks Amplify's ACM SSL cert validation.
#
# First-time setup:
#   1. Add GitHub Secrets: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID
#   2. Import existing records into Terraform state (see docs/infrastructure/DNS_CLOUDFLARE.md)
#   3. Run: tofu apply
#
# The dns_record values come from Amplify's domain associations after apply.
# Run `tofu output web_domain_dns_records` and `tofu output admin_domain_dns_records`
# to see the CNAME targets Amplify expects.

locals {
  enable_cloudflare = var.cloudflare_zone_id != "" && var.cloudflare_api_token != ""
}

# 🔴 apex, www and admin left Amplify for the roboBOREALIS platform (2026-09-22).
#
# These three used to derive their content from aws_amplify_domain_association,
# which no longer exists - the Amplify apps are deleted. They now point at the
# platform CloudFront distribution, which is what is actually live.
#
# They stay MANAGED here rather than being dropped from state. Deleting the
# resource blocks would destroy live DNS and take the site down, and a `removed`
# block was tried first but this stack pins OpenTofu ~1.9, where the nested
# `lifecycle { destroy = false }` is rejected as an unsupported block. Rather
# than depend on what a bare `removed` means on that version, the records keep an
# owner and the configuration is corrected to match reality.
#
# Values verified against the Cloudflare API on 2026-09-22: all three are
# unproxied CNAMEs to the platform distribution.

# ── Web app: www.stpetemusic.live ─────────────────────────────────────────────

resource "cloudflare_record" "www" {
  count = local.enable_cloudflare ? 1 : 0

  zone_id         = var.cloudflare_zone_id
  name            = "www"
  type            = "CNAME"
  content         = var.platform_cloudfront_domain
  proxied         = false
  ttl             = 1  # 1 = auto (required when proxied = false)
  allow_overwrite = true
}

# ── Web app: stpetemusic.live (apex) ──────────────────────────────────────────
# Cloudflare CNAME flattening handles apex records transparently.

resource "cloudflare_record" "apex" {
  count = local.enable_cloudflare ? 1 : 0

  zone_id         = var.cloudflare_zone_id
  name            = "@"
  type            = "CNAME"
  content         = var.platform_cloudfront_domain
  proxied         = false
  ttl             = 1
  allow_overwrite = true
}

# ── Admin app: admin.stpetemusic.live ─────────────────────────────────────────

resource "cloudflare_record" "admin" {
  count = local.enable_cloudflare ? 1 : 0

  zone_id = var.cloudflare_zone_id
  name    = "admin"
  type    = "CNAME"
  content = var.platform_cloudfront_domain
  proxied = false
  ttl     = 1
}

# ── Streaming: stream.stpetemusic.live ────────────────────────────────────────
# RTMP ingest endpoint for Restream custom destination.
# Must be DNS-only (proxied = false) — Cloudflare proxy blocks TCP port 1935.

resource "cloudflare_record" "stream" {
  count = local.enable_cloudflare ? 1 : 0

  zone_id         = var.cloudflare_zone_id
  name            = "stream"
  type            = "A"
  content         = aws_eip.n8n.public_ip
  proxied         = false
  ttl             = 60
  allow_overwrite = true
}

# ── HLS viewer endpoint: hls.stpetemusic.live ─────────────────────────────────
# CloudFront CDN for HLS live stream. stream.stpetemusic.live (RTMP ingest) is
# unchanged — this is a separate subdomain for viewer-facing HLS delivery.
# DNS-only (not proxied) — CloudFront is the CDN; don't route through Cloudflare too.

resource "cloudflare_record" "hls" {
  count = local.enable_cloudflare ? 1 : 0

  zone_id         = var.cloudflare_zone_id
  name            = "hls"
  type            = "CNAME"
  content         = aws_cloudfront_distribution.hls_stream.domain_name
  proxied         = false
  ttl             = 1
  allow_overwrite = true
}

# ── ACM SSL verification ───────────────────────────────────────────────────────
# Amplify-managed ACM cert validation record. NEVER delete — Amplify uses it for
# automatic annual renewal. Value is static after initial cert issuance.
# The hardcoded value is the known validation CNAME for this domain's cert.
# If the cert is ever recreated, update this value from the Amplify console or
# tofu output admin_domain_dns_records.

resource "cloudflare_record" "acm_validation" {
  count = local.enable_cloudflare ? 1 : 0

  zone_id         = var.cloudflare_zone_id
  name            = "_ddf1b33c5eab2d60eddc95848a12d240"
  type            = "CNAME"
  content         = "_bf19e363018afabe1b2e49737993dac9.jkddzztszm.acm-validations.aws"
  proxied         = false
  ttl             = 1
  allow_overwrite = true  # static hardcoded value — safe to overwrite; record may pre-exist state
}

# ── Google Search Console verification ────────────────────────────────────────
resource "cloudflare_record" "google_search_console" {
  count = local.enable_cloudflare ? 1 : 0

  zone_id = var.cloudflare_zone_id
  name    = "@"
  type    = "TXT"
  content = "google-site-verification=8S66qi-itvjxwf01Hou8gH7utVBQHekEASBWZ00tGos"
  proxied = false
  ttl     = 1
}

# ── Bing Webmaster Tools verification ─────────────────────────────────────────
resource "cloudflare_record" "bing_webmaster_verification" {
  count = var.bing_webmaster_verification_code != "" ? 1 : 0

  zone_id = var.cloudflare_zone_id
  name    = "@"
  type    = "TXT"
  content = "msvalidate.01=${var.bing_webmaster_verification_code}"
  proxied = false
  ttl     = 1
}

# ── Livestream viewer aliases ──────────────────────────────────────────────────
# livestream.stpetemusic.live and live.stpetemusic.live both redirect → /live
# Uses RFC 5737 dummy IP (192.0.2.1) with Cloudflare proxy enabled so that the
# redirect ruleset below fires before any request reaches the origin.

resource "cloudflare_record" "livestream" {
  count = local.enable_cloudflare ? 1 : 0

  zone_id = var.cloudflare_zone_id
  name    = "livestream"
  type    = "A"
  content = "192.0.2.1"
  proxied = true
  ttl     = 1
}

resource "cloudflare_record" "live_subdomain" {
  count = local.enable_cloudflare ? 1 : 0

  zone_id = var.cloudflare_zone_id
  name    = "live"
  type    = "A"
  content = "192.0.2.1"
  proxied = true
  ttl     = 1
}

# Single ruleset with one combined rule — uses 1 of the 10 rules in the Free tier.
resource "cloudflare_ruleset" "livestream_redirects" {
  count = local.enable_cloudflare ? 1 : 0

  zone_id = var.cloudflare_zone_id
  name    = "Livestream subdomain redirects"
  kind    = "zone"
  phase   = "http_request_dynamic_redirect"

  rules {
    action     = "redirect"
    expression = "(http.host eq \"livestream.stpetemusic.live\") or (http.host eq \"live.stpetemusic.live\")"
    action_parameters {
      from_value {
        status_code = 301
        target_url {
          value = "https://www.stpetemusic.live/live"
        }
        preserve_query_string = false
      }
    }
  }
}

