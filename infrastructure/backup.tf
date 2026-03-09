# S3 Backup Bucket — uncomment when ready to enable automated backups
# See AWS_SETUP.md for manual backup procedure in the meantime.
#
# resource "aws_s3_bucket" "n8n_backups" {
#   bucket = "${var.project}-n8n-backups"
#   tags = {
#     Name    = "${var.project}-n8n-backups"
#     Project = var.project
#   }
# }
#
# resource "aws_s3_bucket_versioning" "n8n_backups" {
#   bucket = aws_s3_bucket.n8n_backups.id
#   versioning_configuration {
#     status = "Enabled"
#   }
# }
#
# resource "aws_s3_bucket_server_side_encryption_configuration" "n8n_backups" {
#   bucket = aws_s3_bucket.n8n_backups.id
#   rule {
#     apply_server_side_encryption_by_default {
#       sse_algorithm = "AES256"
#     }
#   }
# }
#
# resource "aws_s3_bucket_public_access_block" "n8n_backups" {
#   bucket                  = aws_s3_bucket.n8n_backups.id
#   block_public_acls       = true
#   ignore_public_acls      = true
#   block_public_policy     = true
#   restrict_public_buckets = true
# }
#
# resource "aws_s3_bucket_lifecycle_configuration" "n8n_backups" {
#   bucket = aws_s3_bucket.n8n_backups.id
#   rule {
#     id     = "expire-old-backups"
#     status = "Enabled"
#     expiration {
#       days = 30
#     }
#   }
# }
