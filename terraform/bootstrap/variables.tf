variable "aws_region" {
  description = "AWS region containing the application resources."
  type        = string
}

variable "github_oidc_provider_arn" {
  description = "ARN of the operator-created account-wide GitHub Actions OIDC provider."
  type        = string

  validation {
    condition     = can(regex("^arn:[^:]+:iam::[0-9]{12}:oidc-provider/token\\.actions\\.githubusercontent\\.com$", var.github_oidc_provider_arn))
    error_message = "github_oidc_provider_arn must identify the token.actions.githubusercontent.com IAM OIDC provider."
  }
}

variable "tf_state_bucket" {
  description = "S3 bucket containing the application Terraform state."
  type        = string

  validation {
    condition     = trimspace(var.tf_state_bucket) != ""
    error_message = "tf_state_bucket must not be empty."
  }
}

variable "tf_state_key" {
  description = "Application state object key; this must differ from the bootstrap backend key."
  type        = string

  validation {
    condition     = trimspace(var.tf_state_key) != ""
    error_message = "tf_state_key must not be empty."
  }
}

variable "tf_state_region" {
  description = "AWS region containing the application state backend."
  type        = string
}

variable "tf_state_lock_table" {
  description = "DynamoDB lock table used by the application state backend."
  type        = string
}

variable "task_role_permissions_boundary_arn" {
  description = "Operator-created permissions boundary required on both application task roles."
  type        = string

  validation {
    condition     = can(regex("^arn:[^:]+:iam::[0-9]{12}:policy/.+$", var.task_role_permissions_boundary_arn))
    error_message = "task_role_permissions_boundary_arn must be an IAM managed-policy ARN."
  }
}

variable "app_name" {
  description = "Application resource-name prefix."
  type        = string
  default     = "api-mcp-prod"

  validation {
    condition     = var.app_name == "api-mcp-prod"
    error_message = "app_name is fixed to api-mcp-prod for this production role."
  }
}

variable "dynamo_table_name" {
  description = "Application DynamoDB table managed by the deployment role."
  type        = string
  default     = "api-mcp-kv"
}

variable "secret_prefix" {
  description = "Secrets Manager prefix containing the three application secrets."
  type        = string
  default     = "/api-mcp/prod"
}

variable "acm_certificate_arn" {
  description = "Prevalidated dual-domain certificate the workflow may inspect and attach."
  type        = string

  validation {
    condition     = can(regex("^arn:[^:]+:acm:[^:]+:[0-9]{12}:certificate/.+$", var.acm_certificate_arn))
    error_message = "acm_certificate_arn must be an ACM certificate ARN."
  }
}
