# Attach SSM managed policy to existing EC2 IAM role
# Enables SSM Session Manager as a fallback when SSH is unavailable
# Cost: $0 — SSM Session Manager is free for EC2 instances
resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2_backup.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}
