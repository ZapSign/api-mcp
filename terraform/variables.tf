variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "us-east-1"
}

variable "task_role_permissions_boundary_arn" {
  description = "Operator-managed IAM permissions boundary required on both ECS task roles."
  type        = string

  validation {
    condition     = can(regex("^arn:[^:]+:iam::[0-9]{12}:policy/.+$", var.task_role_permissions_boundary_arn))
    error_message = "task_role_permissions_boundary_arn must be an IAM managed-policy ARN."
  }
}

variable "env_name" {
  description = "Environment name (prod, staging). Used in resource names and tags."
  type        = string
  default     = "prod"
}

variable "image_tag" {
  description = "Immutable release identifier in sha-<40 lowercase hex characters> form."
  type        = string

  validation {
    condition     = can(regex("^sha-[0-9a-f]{40}$", var.image_tag))
    error_message = "image_tag must be an immutable sha-<40 lowercase hex characters> release identifier."
  }
}

variable "image_digest" {
  description = "Resolved ECR image digest deployed by ECS. CI resolves this from image_tag before planning."
  type        = string

  validation {
    condition     = can(regex("^sha256:[0-9a-f]{64}$", var.image_digest))
    error_message = "image_digest must be a sha256 digest."
  }
}

variable "vpc_id" {
  description = "VPC ID to deploy into. If empty, the account default VPC is used."
  type        = string
  default     = ""
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for ALB + Fargate tasks. Must span at least 2 AZs. If empty, all default-VPC public subnets are used."
  type        = list(string)
  default     = []
}

variable "container_port" {
  description = "Port the Node container listens on (PORT env var default)."
  type        = number
  default     = 8080
}

variable "task_cpu" {
  description = "Fargate task CPU units (1 vCPU = 1024)."
  type        = number
  default     = 512
}

variable "task_memory" {
  description = "Fargate task memory in MiB."
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Desired number of running tasks (min 2 for multi-AZ HA)."
  type        = number
  default     = 2

  validation {
    condition     = var.desired_count >= 2
    error_message = "desired_count must be at least 2 for multi-AZ availability."
  }
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention for the api-mcp log group."
  type        = number
  default     = 90
}

variable "alb_idle_timeout" {
  description = "ALB idle timeout in seconds. Raised for streamable HTTP / SSE connections."
  type        = number
  default     = 300
}

variable "primary_domain" {
  description = "Primary custom domain for the MCP server."
  type        = string
  default     = "mcp.zapsign.com.br"

  validation {
    condition     = var.primary_domain == "mcp.zapsign.com.br"
    error_message = "primary_domain is fixed to the isolated child zone mcp.zapsign.com.br."
  }
}

variable "secondary_domain" {
  description = "Secondary custom domain (SAN) for the MCP server."
  type        = string
  default     = "mcp.zapsign.co"

  validation {
    condition     = var.secondary_domain == "mcp.zapsign.co"
    error_message = "secondary_domain is fixed to the isolated child zone mcp.zapsign.co."
  }
}

# ---------------------------------------------------------------------------
# ACM — staged migration inputs
#
# Phase 1 (Cloudflare parent zones remain authoritative):
#   - Set acm_certificate_arn to an ARN of a certificate that was ALREADY
#     validated. To obtain it: request a cert in ACM console or CLI, then
#     add the two CNAME validation records that ACM provides to Cloudflare
#     DNS manually. Once ACM status shows "Issued", paste the ARN here.
#   - Leave manage_route53 = false (default).
#
# Phase 2 (todo 7 — delegate only the two MCP child zones):
#   - Set manage_route53 = true.
#   - Keep acm_certificate_arn set; Terraform never requests a replacement.
#   - Add the output child-zone NS records to the existing Cloudflare parents.
# ---------------------------------------------------------------------------

variable "acm_certificate_arn" {
  description = <<-EOT
    Required ARN of a pre-validated ACM certificate covering primary_domain
    and secondary_domain. Terraform reuses this certificate in every mode and
    never creates DNS validation records or waits for certificate issuance.
  EOT
  type        = string
}

variable "manage_route53" {
  description = <<-EOT
    When false, Terraform performs no Route53 writes. When true, Terraform
    creates isolated public child zones for mcp.zapsign.com.br and
    mcp.zapsign.co plus apex ALB aliases. Parent-zone NS delegation remains an
    explicit Cloudflare operation using the emitted child-zone name servers.
  EOT
  type        = bool
  default     = false
}

variable "dynamo_table_name" {
  description = "DynamoDB table name for the KV store."
  type        = string
  default     = "api-mcp-kv"
}

variable "secret_prefix" {
  description = "AWS Secrets Manager path prefix for app secrets."
  type        = string
  default     = "/api-mcp/prod"
}

variable "tags" {
  description = "Additional tags merged into all resources."
  type        = map(string)
  default     = {}
}
