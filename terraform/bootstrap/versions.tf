terraform {
  required_version = "= 1.9.8"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.66.0"
    }
  }

  # Operators must configure a bootstrap state key distinct from the app key.
  # The GitHub deployment role receives access only to var.tf_state_key.
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      App       = "api-mcp"
      ManagedBy = "terraform-bootstrap"
      Repo      = "github.com/ZapSign/api-mcp"
    }
  }
}
