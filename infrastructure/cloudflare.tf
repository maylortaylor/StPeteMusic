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

# ── Web app: www.stpetemusic.live ─────────────────────────────────────────────

resource "cloudflare_record" "www" {
  count = local.enable_cloudflare ? 1 : 0

  zone_id         = var.cloudflare_zone_id
  name            = "www"
  type            = "CNAME"
  content         = try(split(" ", one([for s in aws_amplify_domain_association.web.sub_domain : s.dns_record if s.prefix == "www"]))[2], "")
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
  content         = try(split(" ", one([for s in aws_amplify_domain_association.web.sub_domain : s.dns_record if s.prefix == ""]))[2], "")
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
  content = try(split(" ", one([for s in aws_amplify_domain_association.admin.sub_domain : s.dns_record if s.prefix == "admin"]))[2], "")
  proxied = false
  ttl     = 1
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

