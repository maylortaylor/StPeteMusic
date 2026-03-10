# Default VPC — referenced, not created
data "aws_vpc" "default" {
  default = true
}

# Security Group
resource "aws_security_group" "n8n" {
  name        = "stpetemusic-n8n-sg"
  description = "n8n StPeteMusic server"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project}-n8n-sg"
    Project = var.project
  }
}

# EC2 Instance
resource "aws_instance" "n8n" {
  ami                    = "ami-0c421724a94bba6d6" # Amazon Linux 2023, us-east-1
  instance_type          = "t3.micro"
  key_name               = var.ssh_key_name
  vpc_security_group_ids = [aws_security_group.n8n.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_backup.name

  # Configure DNS to use Google public DNS (fixes SERVFAIL on 100.100.100.100)
  user_data = base64encode(file("${path.module}/user_data.sh"))

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    # encrypted = true requires stopping the instance, snapshotting the volume,
    # copying with encryption, and swapping — cannot be done in-place.
    # Migration plan: snapshot → encrypted copy → attach → terraform import new volume
  }

  # Enable EC2 Auto Recovery: automatically restarts instance if it becomes unresponsive
  # Note: Auto Recovery handles hardware failures & OS hangs, not application crashes.
  # For n8n crashes, rely on docker-compose restart: unless-stopped policy (see docker-compose.prod.yaml)
  maintenance_options {
    auto_recovery = "default"
  }

  tags = {
    Name    = "${var.project}-n8n"
    Project = var.project
  }
}

# Elastic IP
resource "aws_eip" "n8n" {
  instance = aws_instance.n8n.id
  domain   = "vpc"

  tags = {
    Name    = "${var.project}-n8n-eip"
    Project = var.project
  }
}
