# Private S3 bucket for VOD recordings before the editing/processing workflow
resource "aws_s3_bucket" "vod" {
  bucket = "${var.project}-vod"
  tags   = { Name = "${var.project}-vod", Project = var.project }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "vod" {
  bucket = aws_s3_bucket.vod.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

resource "aws_s3_bucket_public_access_block" "vod" {
  bucket                  = aws_s3_bucket.vod.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

# Move recordings to cheaper storage after 2 weeks — they're processed long before that
resource "aws_s3_bucket_lifecycle_configuration" "vod" {
  bucket = aws_s3_bucket.vod.id
  rule {
    id     = "transition-to-ia"
    status = "Enabled"
    filter {}
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }
}

# RTMP stream key — stored in SSM so it never appears in plaintext in deploy logs or git
resource "aws_ssm_parameter" "rtmp_stream_key" {
  name  = "/${var.project}/streaming/rtmp_stream_key"
  type  = "SecureString"
  value = var.rtmp_stream_key
  tags  = { Project = var.project }
}

# Route53 health check — monitors TCP:1935 from AWS edge nodes every 30s
# ~$0.50/month. Visible in Route53 console; attach to SNS for alerts later.
resource "aws_route53_health_check" "rtmp" {
  type              = "TCP"
  ip_address        = aws_eip.n8n.public_ip
  port              = 1935
  request_interval  = 30
  failure_threshold = 3

  tags = {
    Name    = "${var.project}-rtmp-health"
    Project = var.project
  }
}

# ── HLS streaming CDN ──────────────────────────────────────────────────────────
# ACM certificate for hls.stpetemusic.live.
# CloudFront requires certificates in us-east-1 — this project's default provider
# is already us-east-1, so no provider alias is needed.

resource "aws_acm_certificate" "hls_stream" {
  domain_name       = "hls.stpetemusic.live"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Project = var.project
    Name    = "${var.project}-hls-cert"
  }
}

# DNS validation record written to Cloudflare.
# A single-domain cert always produces exactly one validation option — tolist()[0] is safe.
# Must use count (not for_each): local.enable_cloudflare derives from a sensitive var
# so Terraform refuses to use it as a for_each key.
resource "cloudflare_record" "hls_acm_validation" {
  count = local.enable_cloudflare ? 1 : 0

  zone_id         = var.cloudflare_zone_id
  name            = tolist(aws_acm_certificate.hls_stream.domain_validation_options)[0].resource_record_name
  type            = tolist(aws_acm_certificate.hls_stream.domain_validation_options)[0].resource_record_type
  content         = tolist(aws_acm_certificate.hls_stream.domain_validation_options)[0].resource_record_value
  proxied         = false
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "hls_stream" {
  certificate_arn         = aws_acm_certificate.hls_stream.arn
  validation_record_fqdns = [for r in cloudflare_record.hls_acm_validation : r.hostname]
  depends_on              = [cloudflare_record.hls_acm_validation]
}

# CloudFront distribution.
# Origin: n8n.stpetemusic.live/hls (nginx proxies /hls/ → MediaMTX :8888)
# Viewer URL: hls.stpetemusic.live
# Path mapping: viewer /live/index.m3u8 → origin /hls/live/index.m3u8 → MediaMTX /live/index.m3u8
resource "aws_cloudfront_distribution" "hls_stream" {
  enabled     = true
  comment     = "StPeteMusic HLS live stream CDN"
  aliases     = ["hls.stpetemusic.live"]
  price_class = "PriceClass_100" # US + Europe edge nodes — cheapest, within free tier

  origin {
    domain_name = "n8n.stpetemusic.live"
    origin_id   = "ec2-hls-origin"
    origin_path = "/hls" # prepended to every CF→origin request; nginx /hls/ strips it

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default behavior: .ts segment files — cache 30s (immutable once MediaMTX writes them)
  default_cache_behavior {
    target_origin_id       = "ec2-hls-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    min_ttl     = 0
    default_ttl = 30
    max_ttl     = 60
  }

  # .m3u8 manifests must never be cached — HLS.js needs a fresh segment list every ~2s
  ordered_cache_behavior {
    path_pattern           = "*.m3u8"
    target_origin_id       = "ec2-hls-origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = false

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.hls_stream.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Project = var.project
    Name    = "${var.project}-hls-cdn"
  }

  depends_on = [aws_acm_certificate_validation.hls_stream]
}
