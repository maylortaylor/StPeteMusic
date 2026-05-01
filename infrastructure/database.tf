data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-db-subnet-group"
  subnet_ids = data.aws_subnets.default.ids
  tags       = { Name = "${var.project}-db-subnet-group", Project = var.project }
}

resource "aws_security_group" "rds" {
  name        = "${var.project}-rds-sg"
  description = "RDS PostgreSQL — EC2 + public internet (Amplify SSR, SSL required)"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.n8n.id]
    description     = "PostgreSQL from EC2"
  }

  # Amplify WEB_COMPUTE has no fixed egress IPs — must allow internet access.
  # Mitigated by: strong password, SSL required (sslmode=require in DATABASE_URL).
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "PostgreSQL from internet (Amplify SSR + local dev)"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-rds-sg", Project = var.project }

  # description is immutable in AWS — ignore changes to prevent forced destroy+recreate
  lifecycle {
    ignore_changes = [description]
  }
}

resource "aws_db_instance" "main" {
  identifier             = "${var.project}-postgres"
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = "db.t4g.micro"
  allocated_storage      = 20
  storage_type           = "gp3"
  db_name                = "n8n"
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  skip_final_snapshot    = false
  deletion_protection    = true
  multi_az               = false
  publicly_accessible    = true   # required for Amplify SSR → RDS connectivity
  backup_retention_period = 7

  tags = { Name = "${var.project}-postgres", Project = var.project }
}

# Store RDS host in SSM so deploy.yml can read it without hardcoding
resource "aws_ssm_parameter" "rds_host" {
  name  = "/${var.project}/rds/host"
  type  = "String"
  value = aws_db_instance.main.address
  tags  = { Project = var.project }
}

output "db_endpoint" {
  description = "RDS PostgreSQL endpoint (host:port)"
  value       = aws_db_instance.main.endpoint
}
