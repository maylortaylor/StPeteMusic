# ─────────────────────────────────────────────────────────────────────────────
# ARTIST / MEDIA IMAGE STORAGE
#
# Private S3 bucket for uploaded artist images (hero photos, etc.).
# Images are served via CloudFront at cdn.stpetemusic.live.
#
# Upload path: POST /api/upload/artist-image in admin app → sharp processing →
#              S3 key artists/{artistId}/{uuid}.webp → cdn.stpetemusic.live/{key}
#
# Cache busting: each upload generates a new UUID key so the CDN URL always
# changes, naturally expiring Next.js image cache without invalidation.
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_s3_bucket" "assets" {
  bucket = "${var.project}-assets"
  tags   = { Name = "${var.project}-assets", Project = var.project }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

# Block all direct public access — CloudFront is the only public entry point
resource "aws_s3_bucket_public_access_block" "assets" {
  bucket                  = aws_s3_bucket.assets.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

# Allow CloudFront OAC to read from the bucket
data "aws_iam_policy_document" "assets_bucket_policy" {
  statement {
    sid    = "AllowCloudFrontServicePrincipal"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.assets.arn}/*"]
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.assets.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "assets" {
  bucket = aws_s3_bucket.assets.id
  policy = data.aws_iam_policy_document.assets_bucket_policy.json
}

# Origin Access Control — modern replacement for OAI
resource "aws_cloudfront_origin_access_control" "assets" {
  name                              = "${var.project}-assets-oac"
  description                       = "OAC for stpetemusic-assets S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ACM certificate for cdn.stpetemusic.live
# CloudFront requires certificates in us-east-1 (already our default region)
resource "aws_acm_certificate" "assets_cdn" {
  domain_name       = "cdn.stpetemusic.live"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Project = var.project
    Name    = "${var.project}-assets-cdn-cert"
  }
}

# DNS validation record written to Cloudflare
resource "cloudflare_record" "assets_cdn_acm_validation" {
  count = local.enable_cloudflare ? 1 : 0

  zone_id         = var.cloudflare_zone_id
  name            = tolist(aws_acm_certificate.assets_cdn.domain_validation_options)[0].resource_record_name
  type            = tolist(aws_acm_certificate.assets_cdn.domain_validation_options)[0].resource_record_type
  content         = tolist(aws_acm_certificate.assets_cdn.domain_validation_options)[0].resource_record_value
  proxied         = false
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "assets_cdn" {
  certificate_arn         = aws_acm_certificate.assets_cdn.arn
  validation_record_fqdns = [for r in cloudflare_record.assets_cdn_acm_validation : r.hostname]
  depends_on              = [cloudflare_record.assets_cdn_acm_validation]
}

# CloudFront distribution serving cdn.stpetemusic.live from the assets S3 bucket
resource "aws_cloudfront_distribution" "assets" {
  enabled     = true
  comment     = "StPeteMusic asset CDN — artist images"
  aliases     = ["cdn.stpetemusic.live"]
  price_class = "PriceClass_100" # US + Europe edge nodes

  origin {
    domain_name              = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_id                = "s3-assets-origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.assets.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-assets-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    # 1-year cache — content-addressable filenames mean new uploads always get new URLs
    min_ttl     = 0
    default_ttl = 31536000
    max_ttl     = 31536000
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.assets_cdn.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Project = var.project
    Name    = "${var.project}-assets-cdn"
  }

  depends_on = [aws_acm_certificate_validation.assets_cdn]
}

# DNS CNAME: cdn.stpetemusic.live → CloudFront domain
resource "cloudflare_record" "assets_cdn" {
  count = local.enable_cloudflare ? 1 : 0

  zone_id         = var.cloudflare_zone_id
  name            = "cdn"
  type            = "CNAME"
  content         = aws_cloudfront_distribution.assets.domain_name
  proxied         = false
  ttl             = 1
  allow_overwrite = true
}
