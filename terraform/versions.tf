terraform {
  required_version = "= 1.9.8"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.66.0"
    }
  }

  # Backend values are supplied by CI so state location and lock ownership are
  # explicit deployment inputs. Local validation remains available with
  # `terraform init -backend=false`.
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      App       = "api-mcp"
      ManagedBy = "terraform"
      Repo      = "github.com/ZapSign/api-mcp"
    }
  }
}

# ACM certificates for CloudFront / ALB must be in us-east-1 when used with
# CloudFront. We are NOT using CloudFront (per plan guardrail). The ALB cert
# can live in the same region as the ALB, so no alias provider is needed.
