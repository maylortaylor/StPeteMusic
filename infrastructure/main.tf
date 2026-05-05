terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
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

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Google Cloud provider — auth via GOOGLE_APPLICATION_CREDENTIALS env var
# or gcloud application-default login (for local development).
# Set TF_VAR_google_project_id and TF_VAR_google_org_id in CI.
provider "google" {
  project = var.google_project_id
  region  = "us-east1"
}
