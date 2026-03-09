# RDS PostgreSQL — uncomment when n8n needs a persistent database
# See docs/POSTGRES_PLAN.md for the full migration plan before enabling.
#
# variable "db_password" {
#   description = "PostgreSQL master password — set via TF_VAR_db_password env var or GitHub Secret"
#   sensitive   = true
# }
#
# resource "aws_db_subnet_group" "n8n" {
#   name       = "${var.project}-db-subnet-group"
#   subnet_ids = data.aws_subnets.default.ids
#   tags = {
#     Name    = "${var.project}-db-subnet-group"
#     Project = var.project
#   }
# }
#
# data "aws_subnets" "default" {
#   filter {
#     name   = "vpc-id"
#     values = [data.aws_vpc.default.id]
#   }
# }
#
# resource "aws_db_instance" "n8n" {
#   identifier           = "${var.project}-postgres"
#   engine               = "postgres"
#   engine_version       = "16"
#   instance_class       = "db.t4g.micro"
#   allocated_storage    = 20
#   storage_type         = "gp3"
#   db_name              = "n8n"
#   username             = "n8n"
#   password             = var.db_password
#   db_subnet_group_name = aws_db_subnet_group.n8n.name
#   skip_final_snapshot  = false
#   deletion_protection  = true
#   multi_az             = false
#   publicly_accessible  = false
#   vpc_security_group_ids = [aws_security_group.n8n.id]
#   tags = {
#     Name    = "${var.project}-postgres"
#     Project = var.project
#   }
# }
#
# output "db_endpoint" {
#   description = "RDS PostgreSQL endpoint"
#   value       = aws_db_instance.n8n.endpoint
# }
