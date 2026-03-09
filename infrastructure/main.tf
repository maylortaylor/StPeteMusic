terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "stpetemusic-terraform-state"
    key            = "stpetemusic/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "stpetemusic-terraform-locks"
    encrypt        = true
    profile        = "personal"
  }
}

provider "aws" {
  region  = var.aws_region
  profile = "personal"
}
