# Attach SSM managed policy to existing EC2 IAM role
# Enables SSM Session Manager as a fallback when SSH is unavailable
# Cost: $0 — SSM Session Manager is free for EC2 instances
resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2_backup.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Allow EC2 to write recordings to the private VOD S3 bucket
resource "aws_iam_role_policy" "ec2_vod_s3" {
  name = "${var.project}-ec2-vod-s3-policy"
  role = aws_iam_role.ec2_backup.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["s3:PutObject", "s3:GetObject", "s3:ListBucket"]
      Resource = [
        aws_s3_bucket.vod.arn,
        "${aws_s3_bucket.vod.arn}/*"
      ]
    }]
  })
}

# Allow EC2 to read Listmonk credentials from SSM Parameter Store
# Used by deploy.yml to populate .env without passing secrets through GitHub Actions envs
resource "aws_iam_role_policy" "ec2_ssm_listmonk" {
  name = "${var.project}-ec2-ssm-listmonk-policy"
  role = aws_iam_role.ec2_backup.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["ssm:GetParameter"]
      Resource = [
        aws_ssm_parameter.listmonk_username.arn,
        aws_ssm_parameter.listmonk_password.arn,
        aws_ssm_parameter.rds_host.arn,
      ]
    }]
  })
}
