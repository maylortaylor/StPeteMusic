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
      days          = 14
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
