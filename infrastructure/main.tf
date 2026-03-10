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
    # profile omitted — uses AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY in CI,
    # and the default credential chain locally (set AWS_PROFILE=personal if needed)
  }
}

provider "aws" {
  region = var.aws_region
  # profile omitted — uses env vars in CI; set AWS_PROFILE=personal locally
}
