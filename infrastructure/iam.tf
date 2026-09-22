# IAM role for Amplify SSR — grants server-side rendering functions S3 write access.
# Amplify Hosting attaches this role to the SSR Lambda execution context so the
# AWS SDK credential chain resolves without explicit env vars (which would require
# the "AWS_" prefix that Amplify blocks).
resource "aws_iam_role" "amplify_admin_ssr" {
  name = "${var.project}-amplify-admin-ssr"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "amplify.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = { Project = var.project }
}

resource "aws_iam_role_policy" "amplify_admin_s3_assets" {
  name = "${var.project}-amplify-admin-s3-assets"
  role = aws_iam_role.amplify_admin_ssr.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject"]
      Resource = "${aws_s3_bucket.assets.arn}/*"
    }]
  })
}

# Dedicated IAM user for admin app → S3 asset upload.
# Amplify WEB_COMPUTE SSR Lambdas run with an internally-managed execution role
# that can't be configured externally. Explicit key-based credentials (S3_KEY_ID /
# S3_KEY_SECRET) are the only supported path for S3 writes from the Amplify SSR runtime.
resource "aws_iam_user" "admin_s3_upload" {
  name = "${var.project}-admin-s3-upload"
  tags = { Project = var.project }
}

resource "aws_iam_user_policy" "admin_s3_upload" {
  name = "${var.project}-admin-s3-upload-policy"
  user = aws_iam_user.admin_s3_upload.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject"]
      Resource = "${aws_s3_bucket.assets.arn}/*"
    }]
  })
}

resource "aws_iam_access_key" "admin_s3_upload" {
  user = aws_iam_user.admin_s3_upload.name
}
