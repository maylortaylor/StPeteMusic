# S3 Backup Bucket
resource "aws_s3_bucket" "n8n_backups" {
  bucket = "${var.project}-n8n-backups"
  tags = {
    Name    = "${var.project}-n8n-backups"
    Project = var.project
  }
}

resource "aws_s3_bucket_versioning" "n8n_backups" {
  bucket = aws_s3_bucket.n8n_backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "n8n_backups" {
  bucket = aws_s3_bucket.n8n_backups.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "n8n_backups" {
  bucket                  = aws_s3_bucket.n8n_backups.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "n8n_backups" {
  bucket = aws_s3_bucket.n8n_backups.id
  rule {
    id     = "expire-old-backups"
    status = "Enabled"
    filter {}
    expiration {
      days = 30
    }
  }
}

# IAM role that allows the EC2 instance to write backups to S3
resource "aws_iam_role" "ec2_backup" {
  name = "${var.project}-ec2-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = { Project = var.project }
}

resource "aws_iam_role_policy" "ec2_backup_s3" {
  name = "${var.project}-ec2-backup-s3-policy"
  role = aws_iam_role.ec2_backup.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ]
      Resource = [
        aws_s3_bucket.n8n_backups.arn,
        "${aws_s3_bucket.n8n_backups.arn}/*"
      ]
    }]
  })
}

resource "aws_iam_instance_profile" "ec2_backup" {
  name = "${var.project}-ec2-backup-profile"
  role = aws_iam_role.ec2_backup.name
  tags = { Project = var.project }
}
